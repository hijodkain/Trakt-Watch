'use client';

import React, { useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Container, SectionHeader, Grid } from '@trak-watch/ui/components/layout';
import { Button } from '@trak-watch/ui/components/primitives/Button';
import { Input } from '@trak-watch/ui/components/primitives/Input';
import { Badge } from '@trak-watch/ui/components/primitives/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@trak-watch/ui/components/primitives/Dialog';
import { useLists, type ListMedia } from '@/features/lists/store';
import { readSyncEvents } from '@/features/sync/outbox';
import { Plus, Trash2, Eye, Lock, Heart, Check, Clock, Download, Upload, Tv, Clapperboard } from 'lucide-react';
import { useToast } from '@trak-watch/ui/components/primitives/useToast';

const typeIcons: Record<string, React.ReactNode> = {
  pendientes: <Eye className="h-5 w-5" />,
  favoritas: <Heart className="h-5 w-5" />,
  siguiendo: <Tv className="h-5 w-5" />,
  'seguir-viendo': <Clapperboard className="h-5 w-5" />,
  custom: <Clock className="h-5 w-5" />,
};

const typeLabels: Record<string, string> = {
  pendientes: 'Pendientes',
  favoritas: 'Favoritas',
  siguiendo: 'Siguiendo',
  'seguir-viendo': 'Seguir viendo',
  custom: 'Personalizada',
};

export function ListsPage() {
  const { lists, items, createList, deleteList, exportJson, importJson } = useLists();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [newListMedia, setNewListMedia] = useState<ListMedia>('mixed');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingCount = readSyncEvents().length;

  const handleCreate = () => {
    const name = newListName.trim();
    if (!name) return;
    createList({ name, description: newListDescription.trim(), media: newListMedia });
    setNewListName('');
    setNewListDescription('');
    setShowCreateDialog(false);
  };

  const handleExport = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trak-watch-listas-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const { imported, errors } = importJson(text);
    if (errors.length > 0) {
      toast({ title: 'Importación parcial', description: errors[0], variant: 'warning' });
    } else {
      toast({ title: 'Importado', description: `${imported} elementos importados`, variant: 'success' });
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="min-h-screen">
      <main className="py-8">
        <Container>
          <SectionHeader
            title="Mis Listas"
            action={
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleExport} className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
                <Button variant="secondary" onClick={() => fileRef.current?.click()} className="gap-2">
                  <Upload className="h-4 w-4" />
                  Importar
                </Button>
                <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nueva lista
                </Button>
              </div>
            }
          />
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />

          {pendingCount > 0 && (
            <p className="text-xs text-fg-subtle mb-4">
              {pendingCount} cambios pendientes de sincronizar con Stremio (se enviarán cuando conectes el addon).
            </p>
          )}

          {lists.length > 0 ? (
            <Grid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={6}>
              {lists.map((list) => {
                const count = items.filter((i) => i.list_id === list.id).length;
                const cover = items.find((i) => i.list_id === list.id && i.poster_path);
                return (
                  <div
                    key={list.id}
                    className="group relative bg-bg-elevated border border-border rounded-xl overflow-hidden transition-all hover:shadow-poster-hover"
                  >
                    <NavLink to={`/lists/${list.id}`} className="block">
                      <div className="aspect-[2/3] bg-gradient-to-br from-border to-border-light relative overflow-hidden">
                        {cover?.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w342${cover.poster_path}`}
                            alt={list.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : count > 0 ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-6xl font-bold text-fg/10">{count}</span>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-fg-subtle">
                            <span className="text-4xl">📋</span>
                          </div>
                        )}
                      </div>
                    </NavLink>
                    {list.kind === 'custom' && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-black/50 backdrop-blur text-red-400"
                          onClick={() => setConfirmDelete(list.id)}
                          aria-label={`Borrar ${list.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {typeIcons[list.kind === 'custom' ? 'custom' : list.slug] || typeIcons.custom}
                        <span className="text-xs font-medium text-fg-muted capitalize">
                          {typeLabels[list.slug] || typeLabels[list.type] || 'Personalizada'}
                        </span>
                        {list.media !== 'mixed' && (
                          <Badge variant="secondary" size="sm">
                            {list.media === 'movie' ? 'Pelis' : 'Series'}
                          </Badge>
                        )}
                      </div>
                      <NavLink to={`/lists/${list.id}`}>
                        <h3 className="font-semibold text-fg truncate hover:text-accent">{list.name}</h3>
                      </NavLink>
                      {list.description && <p className="text-sm text-fg-muted mt-1 line-clamp-2">{list.description}</p>}
                      <div className="mt-3 flex items-center justify-between text-xs text-fg-subtle">
                        <span className="flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          {count} elementos
                        </span>
                        <span>Solo tú</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </Grid>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📋</div>
              <h2 className="text-xl font-bold text-fg mb-2">No tienes listas aún</h2>
              <p className="text-fg-muted mb-6">Crea tu primera lista para organizar tus películas y series</p>
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Crear lista
              </Button>
            </div>
          )}
        </Container>
      </main>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear nueva lista</DialogTitle>
            <DialogDescription>Organiza tus películas y series favoritas</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
          >
            <div className="space-y-4 py-4">
              <Input
                label="Nombre"
                placeholder="Ej: Terror, Para el finde, Documentales..."
                value={newListName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewListName(e.target.value)}
                required
                maxLength={100}
              />
              <Input
                label="Descripción (opcional)"
                placeholder="Breve descripción de la lista..."
                value={newListDescription}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewListDescription(e.target.value)}
                maxLength={500}
              />
              <div>
                <label className="block text-sm font-medium text-fg mb-2">Tipo de contenido</label>
                <select
                  value={newListMedia}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewListMedia(e.target.value as ListMedia)}
                  className="w-full px-4 py-2.5 text-sm text-fg bg-bg-elevated border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="mixed">Películas y series</option>
                  <option value="movie">Solo películas</option>
                  <option value="tv">Solo series</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" type="button" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit">Crear lista</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete !== null} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Borrar lista</DialogTitle>
            <DialogDescription>Se borrará la lista y sus elementos. Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmDelete) deleteList(confirmDelete);
                setConfirmDelete(null);
              }}
            >
              Borrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
