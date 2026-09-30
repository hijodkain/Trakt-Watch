'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, SectionHeader, Grid } from '@trak-watch/ui/components/layout';
import { PosterGrid, Skeleton } from '@trak-watch/ui/components/media';
import { Button } from '@trak-watch/ui/components/primitives/Button';
import { Input } from '@trak-watch/ui/components/primitives/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@trak-watch/ui/components/primitives/Dialog';
import { supabase } from '@/features/auth/AuthProvider';
import { Plus, Edit, Trash2, Eye, Lock, Heart, Check, Clock } from 'lucide-react';

interface List {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  type: 'watchlist' | 'watched' | 'favorites' | 'custom';
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

async function fetchLists() {
  const { data, error } = await supabase.functions.invoke('lists-get', {
    body: {},
  });
  if (error) throw error;
  return data?.lists || [];
}

async function createList(input: { name: string; description?: string; type?: string; is_public?: boolean }) {
  const { data, error } = await supabase.functions.invoke('lists-create', {
    body: input,
  });
  if (error) throw error;
  return data?.list;
}

async function deleteList(id: string) {
  const { error } = await supabase.functions.invoke('lists-delete', {
    body: { id },
  });
  if (error) throw error;
}

export function ListsPage() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [newListType, setNewListType] = useState<'watchlist' | 'watched' | 'favorites' | 'custom'>('custom');
  const [newListPublic, setNewListPublic] = useState(false);

  const { data: lists, isLoading } = useQuery({
    queryKey: ['lists'],
    queryFn: fetchLists,
  });

  const createMutation = useMutation({
    mutationFn: createList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      setShowCreateDialog(false);
      setNewListName('');
      setNewListDescription('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });

  const typeIcons: Record<string, React.ReactNode> = {
    watchlist: <Eye className="h-5 w-5" />,
    watched: <Check className="h-5 w-5" />,
    favorites: <Heart className="h-5 w-5" />,
    custom: <Clock className="h-5 w-5" />,
  };

  const typeLabels: Record<string, string> = {
    watchlist: 'Por ver',
    watched: 'Vistas',
    favorites: 'Favoritas',
    custom: 'Personalizada',
  };

  return (
    <div className="min-h-screen">
      <main className="py-8">
        <Container>
          <SectionHeader
            title="Mis Listas"
            action={
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva lista
              </Button>
            }
          />

          {isLoading ? (
            <Grid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={6}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} variant="poster" className="h-48" />
              ))}
            </Grid>
          ) : lists && lists.length > 0 ? (
            <Grid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={6}>
              {lists.map((list: List) => (
                <div key={list.id} className="group relative bg-bg-elevated border border-border rounded-xl overflow-hidden transition-all hover:shadow-poster-hover">
                  <div className="aspect-[2/3] bg-gradient-to-br from-border to-border-light relative overflow-hidden">
                    {list.item_count && list.item_count > 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-6xl font-bold text-fg/10">{list.item_count}</span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-fg-subtle">
                        <span className="text-4xl">📋</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 backdrop-blur">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 backdrop-blur text-red-400" onClick={() => deleteMutation.mutate(list.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {typeIcons[list.type]}
                        <span className="text-xs font-medium text-fg-muted capitalize">{typeLabels[list.type]}</span>
                      </div>
                      {list.is_public && (
                        <Lock className="h-4 w-4 text-fg-subtle" aria-label="Lista pública" />
                      )}
                    </div>
                    <h3 className="font-semibold text-fg truncate">{list.name}</h3>
                    {list.description && (
                      <p className="text-sm text-fg-muted mt-1 line-clamp-2">{list.description}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between text-xs text-fg-subtle">
                      <span>{list.item_count || 0} elementos</span>
                      <span>{new Date(list.created_at).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                </div>
              ))}
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

      {/* Create List Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear nueva lista</DialogTitle>
            <DialogDescription>Organiza tus películas y series favoritas</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ name: newListName, description: newListDescription, type: newListType, is_public: newListPublic }); }}>
            <div className="space-y-4 py-4">
              <Input
                label="Nombre"
                placeholder="Ej: Películas de terror, Series para ver en fin de semana..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                required
                maxLength={100}
              />
              <Input
                label="Descripción (opcional)"
                placeholder="Breve descripción de la lista..."
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
                maxLength={500}
              />
              <div>
                <label className="block text-sm font-medium text-fg mb-2">Tipo</label>
                <select
                  value={newListType}
                  onChange={(e) => setNewListType(e.target.value as any)}
                  className="w-full px-4 py-2.5 text-sm text-fg bg-bg-elevated border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="custom">Personalizada</option>
                  <option value="watchlist">Por ver</option>
                  <option value="watched">Vistas</option>
                  <option value="favorites">Favoritas</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newListPublic}
                  onChange={(e) => setNewListPublic(e.target.checked)}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                <span className="text-sm text-fg">Lista pública (visible para otros usuarios)</span>
              </label>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                Crear lista
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}