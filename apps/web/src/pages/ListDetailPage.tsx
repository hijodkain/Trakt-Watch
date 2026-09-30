'use client';

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, SectionHeader } from '@trak-watch/ui/components/layout';
import { PosterGrid, Skeleton } from '@trak-watch/ui/components/media';
import { Button } from '@trak-watch/ui/components/primitives/Button';
import { Input } from '@trak-watch/ui/components/primitives/Input';
import { Badge } from '@trak-watch/ui/components/primitives/Badge';
import { supabase } from '@/features/auth/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Eye, Check, Heart, X, ArrowUpDown, Film, Tv, Star } from 'lucide-react';

interface List {
  id: string;
  name: string;
  description: string | null;
  type: string;
  is_public: boolean;
  sort_order: number;
}

interface ListItem {
  id: string;
  list_id: string;
  tmdb_id: number;
  imdb_id: string | null;
  media_type: 'movie' | 'tv';
  status: string;
  rating: number | null;
  notes: string | null;
  added_at: string;
  watched_at: string | null;
  sort_order: number;
  title?: string;
  release_date?: string | null;
  first_air_date?: string | null;
}

async function fetchList(id: string) {
  const { data, error } = await supabase.functions.invoke('lists-get-one', { body: { id } });
  if (error) throw error;
  return data?.list;
}

async function fetchListItems(listId: string) {
  const { data, error } = await supabase.functions.invoke('list-items-get', { body: { list_id: listId } });
  if (error) throw error;
  return data?.items || [];
}

async function updateItem(itemId: string, input: Partial<ListItem>) {
  const { data, error } = await supabase.functions.invoke('list-items-update', { body: { id: itemId, ...input } });
  if (error) throw error;
  return data?.item;
}

async function removeItem(itemId: string) {
  const { error } = await supabase.functions.invoke('list-items-delete', { body: { id: itemId } });
  if (error) throw error;
}

async function reorderItems(listId: string, itemIds: string[]) {
  const { error } = await supabase.functions.invoke('list-items-reorder', { body: { list_id: listId, item_ids: itemIds } });
  if (error) throw error;
}

export function ListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPublic, setEditPublic] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const isNew = id === 'new';
  const listId = isNew ? null : id;

  const { data: list, isLoading: listLoading } = useQuery({
    queryKey: ['lists', id],
    queryFn: () => fetchList(id!),
    enabled: !isNew,
  });

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['lists', id, 'items'],
    queryFn: () => fetchListItems(id!),
    enabled: !isNew,
  });

  const updateMutation = useMutation({
    mutationFn: ({ itemId, input }: { itemId: string; input: Partial<ListItem> }) => updateItem(itemId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists', id, 'items'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists', id, 'items'] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (itemIds: string[]) => reorderItems(id!, itemIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists', id, 'items'] });
    },
  });

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;
    
    const itemIds = (items || []).map((item: ListItem) => item.id);
    const fromIndex = itemIds.indexOf(draggedItem);
    const toIndex = itemIds.indexOf(targetId);
    
    if (fromIndex === -1 || toIndex === -1) return;
    
    const newIds = [...itemIds];
    newIds.splice(fromIndex, 1);
    newIds.splice(toIndex, 0, draggedItem);
    
    reorderMutation.mutate(newIds);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  if (isNew) {
    return (
      <div className="min-h-screen">
        <main className="py-8">
          <Container className="max-w-2xl">
            <SectionHeader title="Crear nueva lista" />
            <div className="text-center py-16">
              <p className="text-fg-muted mb-6">Página de creación de lista en desarrollo</p>
              <Button onClick={() => navigate('/lists')}>Volver a listas</Button>
            </div>
          </Container>
        </main>
      </div>
    );
  }

  if (listLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <p className="text-red-400 mb-4">Lista no encontrada</p>
          <Button onClick={() => navigate('/lists')}>Volver a listas</Button>
        </div>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    to_watch: 'Por ver',
    watching: 'Viendo',
    watched: 'Vista',
    dropped: 'Abandonada',
  };

  const statusColors: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'outline'> = {
    to_watch: 'default',
    watching: 'success',
    watched: 'outline',
    dropped: 'destructive',
  };

  return (
    <div className="min-h-screen">
      {/* List Header */}
      <header className="relative h-64 lg:h-80 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/20 to-transparent z-10" />
        {list.type !== 'custom' && (
          <div className="absolute top-4 left-4 z-20">
            <Badge variant="default" className="text-lg px-3 py-1">
              {list.type === 'watchlist' && <Eye className="h-4 w-4 mr-1" />} 
              {list.type === 'watched' && <Check className="h-4 w-4 mr-1" />}
              {list.type === 'favorites' && <Heart className="h-4 w-4 mr-1" />}
              {list.type === 'watchlist' ? 'Por ver' : list.type === 'watched' ? 'Vistas' : 'Favoritas'}
            </Badge>
          </div>
        )}
        {list.is_public && (
          <div className="absolute top-4 right-4 z-20">
            <Badge variant="outline">Pública</Badge>
          </div>
        )}
      </header>

      <main className="py-8 -mt-16 lg:-mt-20 pb-16 relative z-20">
        <Container>
          {/* List Info */}
          <div className="flex flex-col lg:flex-row gap-8 mb-8">
            <div className="flex-1">
              {editing ? (
                <form onSubmit={(e) => { e.preventDefault(); setEditing(false); }} className="space-y-4">
                  <Input
                    label="Nombre"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                  <Input
                    label="Descripción"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editPublic}
                      onChange={(e) => setEditPublic(e.target.checked)}
                      className="rounded border-border text-accent focus:ring-accent"
                    />
                    <span className="text-sm text-fg">Lista pública</span>
                  </label>
                  <div className="flex gap-2">
                    <Button type="submit" className="gap-2">
                      <Check className="h-4 w-4" />
                      Guardar
                    </Button>
                    <Button variant="secondary" type="button" onClick={() => { setEditing(false); setEditName(list.name); setEditDescription(list.description || ''); setEditPublic(list.is_public); }}>
                      <X className="h-4 w-4" />
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold text-fg">{list.name}</h1>
                    <Button variant="secondary" onClick={() => { setEditing(true); setEditName(list.name); setEditDescription(list.description || ''); setEditPublic(list.is_public); }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                  {list.description && <p className="text-fg-muted mb-4">{list.description}</p>}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-fg-muted">
                    <span className="flex items-center gap-1">
                      {list.type === 'watchlist' && <Eye className="h-4 w-4" />}
                      {list.type === 'watched' && <Check className="h-4 w-4" />}
                      {list.type === 'favorites' && <Heart className="h-4 w-4" />}
                      {list.type === 'custom' && <Film className="h-4 w-4" />}
                      {list.type === 'watchlist' ? 'Por ver' : list.type === 'watched' ? 'Vistas' : list.type === 'favorites' ? 'Favoritas' : 'Personalizada'}
                    </span>
                    {list.is_public && <Badge variant="secondary">Pública</Badge>}
                    <span>{items?.length || 0} elementos</span>
                    <span>Creada: {new Date(list.created_at).toLocaleDateString('es-ES')}</span>
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-col gap-2 lg:w-64">
              <Button variant="secondary" className="gap-2 justify-center" asChild>
                <a href={`/search?list=${list.id}`}>
                  <Plus className="h-4 w-4" />
                  Añadir contenido
                </a>
              </Button>
              {list.type === 'custom' && (
                <Button variant="secondary" className="gap-2 justify-center">
                  <ArrowUpDown className="h-4 w-4" />
                  Reordenar
                </Button>
              )}
            </div>
          </div>

          {/* Items Grid */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-fg">Contenido ({items?.length || 0})</h2>
              <div className="flex items-center gap-2">
                <select className="px-3 py-1.5 text-sm bg-bg-elevated border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent">
                  <option value="added_at">Orden: Añadidos</option>
                  <option value="title">Título</option>
                  <option value="rating">Rating</option>
                  <option value="release_date">Fecha estreno</option>
                </select>
              </div>
            </div>

            {itemsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} variant="poster" />
                ))}
              </div>
            ) : items && items.length > 0 ? (
              <PosterGrid
                items={items.map((item: ListItem) => ({
                  tmdb_id: item.tmdb_id,
                  imdb_id: item.imdb_id,
                  media_type: item.media_type,
                  title: item.title || '', // Would need to fetch from TMDB
                  poster_path: null,
                  release_date: item.release_date,
                  first_air_date: item.first_air_date,
                  vote_average: 0,
                  genre_ids: [],
                }))}
                size="md"
                columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
              />
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-fg mb-2">Esta lista está vacía</h3>
                <p className="text-fg-muted mb-6">Busca películas o series y añádelas a esta lista</p>
                <Button variant="secondary" asChild>
                  <a href={`/search?list=${list.id}`}>Buscar contenido</a>
                </Button>
              </div>
            )}
          </div>
        </Container>
      </main>
    </div>
  );
}