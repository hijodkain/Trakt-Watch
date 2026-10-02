'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { Container, SectionHeader } from '@trak-watch/ui/components/layout';
import { PosterGrid } from '@trak-watch/ui/components/media';
import { Button } from '@trak-watch/ui/components/primitives/Button';
import { Input } from '@trak-watch/ui/components/primitives/Input';
import { Badge } from '@trak-watch/ui/components/primitives/Badge';
import { useLists, type ListFilters } from '@/features/lists/store';
import { getGenres } from '@/lib/tmdb';
import type { Genre, ItemStatus, ListItem, MediaSummary } from '@/types';
import { Edit, Check, X, Plus, Trash2, Star } from 'lucide-react';

const STATUS_LABELS: Record<ItemStatus, string> = {
  pendientes: 'Pendiente',
  favoritas: 'Favorita',
  siguiendo: 'Siguiendo',
  'seguir-viendo': 'Seguir viendo',
  vistas: 'Vista',
};

function toSummary(item: ListItem): MediaSummary {
  return {
    tmdb_id: item.tmdb_id,
    imdb_id: item.imdb_id,
    media_type: item.media_type,
    title: item.title || `TMDB ${item.tmdb_id}`,
    original_title: item.original_title || item.title || '',
    overview: item.overview || null,
    poster_path: item.poster_path || null,
    backdrop_path: item.backdrop_path || null,
    release_date: item.release_date || null,
    first_air_date: item.first_air_date || null,
    vote_average: item.vote_average || 0,
    vote_count: 0,
    genre_ids: item.genre_ids || [],
    genres: item.genres,
    runtime: null,
    episode_run_time: null,
    number_of_seasons: null,
    number_of_episodes: null,
    status: item.status,
    tagline: null,
  };
}

export function ListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lists, items, renameList, updateItem, removeItem } = useLists();

  const list = lists.find((l) => l.id === id);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const [filters, setFilters] = useState<ListFilters>({ mediaType: 'all' });
  const [genres, setGenres] = useState<Genre[]>([]);

  useEffect(() => {
    let alive = true;
    Promise.all([getGenres('movie').catch(() => [] as Genre[]), getGenres('tv').catch(() => [] as Genre[])]).then(
      ([gm, gt]) => {
        if (!alive) return;
        const seen = new Map<number, Genre>();
        for (const g of [...gm, ...gt]) if (!seen.has(g.id)) seen.set(g.id, g);
        setGenres([...seen.values()].sort((a, b) => a.name.localeCompare(b.name, 'es')));
      }
    );
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (list && !editing) {
      setEditName(list.name);
      setEditDescription(list.description || '');
    }
  }, [list?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const listItems = useMemo(
    () => items.filter((i) => i.list_id === list?.id).sort((a, b) => a.sort_order - b.sort_order),
    [items, list?.id]
  );

  const filtered = useMemo(() => {
    if (!list) return [];
    const { filteredItems } = useLists.getState();
    // Si la lista trae presets y el usuario no filtró, se aplican los presets.
    const effective: ListFilters = {
      ...filters,
      providers:
        filters.providers && filters.providers.length > 0
          ? filters.providers
          : list.presetProviders && list.presetProviders.length > 0
            ? list.presetProviders
            : filters.providers,
      genres:
        filters.genres && filters.genres.length > 0
          ? filters.genres
          : list.presetGenres && list.presetGenres.length > 0
            ? list.presetGenres
            : filters.genres,
    };
    return filteredItems(list.id, effective);
  }, [list, items, filters]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const summaries = filtered.map(toSummary);

  return (
    <div className="min-h-screen">
      <main className="py-8 pb-16">
        <Container>
          <div className="flex flex-col lg:flex-row gap-8 mb-8">
            <div className="flex-1">
              {editing ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    renameList(list.id, { name: editName, description: editDescription });
                    setEditing(false);
                  }}
                  className="space-y-4"
                >
                  <Input
                    label="Nombre"
                    value={editName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
                    required
                  />
                  <Input
                    label="Descripción"
                    value={editDescription}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditDescription(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button type="submit" className="gap-2">
                      <Check className="h-4 w-4" />
                      Guardar
                    </Button>
                    <Button variant="secondary" type="button" onClick={() => setEditing(false)}>
                      <X className="h-4 w-4" />
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4 gap-4">
                    <h1 className="text-3xl font-bold text-fg">{list.name}</h1>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditing(true);
                        setEditName(list.name);
                        setEditDescription(list.description || '');
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                  {list.description && <p className="text-fg-muted mb-4">{list.description}</p>}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-fg-muted">
                    <span>{filtered.length} elementos</span>
                    {list.presetProviders && <Badge variant="secondary">{list.presetProviders[0]}</Badge>}
                    {list.media !== 'mixed' && (
                      <Badge variant="secondary">{list.media === 'movie' ? 'Películas' : 'Series'}</Badge>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-col gap-2 lg:w-64">
              <Button variant="secondary" className="gap-2 justify-center" asChild>
                <NavLink to={`/search?list=${list.id}`}>
                  <Plus className="h-4 w-4" />
                  Añadir contenido
                </NavLink>
              </Button>
            </div>
          </div>

          <div className="mb-6 p-4 rounded-xl bg-bg-elevated border border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <Input
              label="Texto"
              placeholder="Filtrar por título..."
              value={filters.text || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters((f) => ({ ...f, text: e.target.value }))}
            />
            <div>
              <label className="block text-sm font-medium text-fg mb-1.5">Tipo</label>
              <select
                value={filters.mediaType || 'all'}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFilters((f) => ({ ...f, mediaType: e.target.value as ListFilters['mediaType'] }))
                }
                className="w-full px-4 py-2.5 text-sm text-fg bg-bg border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="all">Pelis y series</option>
                <option value="movie">Películas</option>
                <option value="tv">Series</option>
              </select>
            </div>
            <Input
              label="Proveedor"
              placeholder="Ej: Netflix, Max..."
              value={(filters.providers || []).join(', ')}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFilters((f) => ({
                  ...f,
                  providers: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                }))
              }
            />
            <div>
              <label className="block text-sm font-medium text-fg mb-1.5">Género</label>
              <select
                value={filters.genres?.[0] || ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFilters((f) => ({
                    ...f,
                    genres: e.target.value ? [parseInt(e.target.value)] : [],
                  }))
                }
                className="w-full px-4 py-2.5 text-sm text-fg bg-bg border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Todos</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Año desde"
              type="number"
              placeholder="1990"
              value={filters.yearFrom || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFilters((f) => ({ ...f, yearFrom: e.target.value ? parseInt(e.target.value) : null }))
              }
            />
            <Input
              label="Nota mínima"
              type="number"
              min={0}
              max={10}
              step={0.5}
              placeholder="7"
              value={filters.minRating ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFilters((f) => ({ ...f, minRating: e.target.value ? parseFloat(e.target.value) : null }))
              }
            />
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-fg">Contenido ({filtered.length})</h2>
            </div>

            {filtered.length > 0 ? (
              <>
                <PosterGrid
                  items={summaries}
                  size="md"
                  columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
                />
                <div className="mt-8 space-y-2">
                  <h3 className="text-lg font-bold text-fg">Gestionar</h3>
                  {filtered.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-bg-elevated border border-border"
                    >
                      <NavLink
                        to={`/media/${item.media_type}/${item.tmdb_id}`}
                        className="font-medium text-fg hover:text-accent truncate flex-1"
                      >
                        {item.title || `TMDB ${item.tmdb_id}`}
                      </NavLink>
                      <div className="flex items-center gap-2">
                        <select
                          value={item.status}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            updateItem(item.id, { status: e.target.value as ItemStatus })
                          }
                          className="px-3 py-1.5 text-sm bg-bg border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                          aria-label="Estado"
                        >
                          {(Object.keys(STATUS_LABELS) as ItemStatus[]).map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                        <select
                          value={item.rating || ''}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            updateItem(item.id, { rating: e.target.value ? parseInt(e.target.value) : null })
                          }
                          className="px-3 py-1.5 text-sm bg-bg border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                          aria-label="Nota"
                        >
                          <option value="">Sin nota</option>
                          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                            <option key={n} value={n}>
                              {n} ★
                            </option>
                          ))}
                        </select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-400"
                          onClick={() => removeItem(item.id)}
                          aria-label="Quitar de la lista"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-fg mb-2">
                  {listItems.length === 0 ? 'Esta lista está vacía' : 'Nada coincide con los filtros'}
                </h3>
                <p className="text-fg-muted mb-6">Busca películas o series y añádelas a esta lista</p>
                <Button variant="secondary" asChild>
                  <NavLink to={`/search?list=${list.id}`}>Buscar contenido</NavLink>
                </Button>
              </div>
            )}
          </div>

          <SectionHeader title="" />
          <p className="text-xs text-fg-subtle flex items-center gap-1">
            <Star className="h-3 w-3" /> Consejo: usa los filtros de proveedor, año o género para ver solo lo que buscas sin
            duplicar listas.
          </p>
        </Container>
      </main>
    </div>
  );
}
