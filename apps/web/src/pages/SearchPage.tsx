'use client';

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Container, SectionHeader } from '@trak-watch/ui/components/layout';
import { PosterGrid, Skeleton } from '@trak-watch/ui/components/media';
import { Badge } from '@trak-watch/ui/components/primitives/Badge';
import { useQuery } from '@tanstack/react-query';
import { Film, Tv, Star } from 'lucide-react';
import type { MediaSummary } from '@/types';
import { isTmdbConfigured, searchMedia, yearOf } from '@/lib/tmdb';
import { AddToListDialog } from '@/components/lists/AddToListDialog';

export function SearchPage() {
  const searchParams = new URLSearchParams(window.location.search);
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const [addMedia, setAddMedia] = useState<MediaSummary | null>(null);
  const configured = isTmdbConfigured();

  const { data, isLoading, error } = useQuery({
    queryKey: ['media', 'search', query, page],
    queryFn: () => searchMedia(query, page),
    enabled: query.length >= 2 && configured,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const results = data?.results || [];

  return (
    <div className="min-h-screen">
      <main className="py-8">
        <Container>
          <SectionHeader
            title={query ? `Resultados para "${query}"` : 'Buscar'}
            description={data ? `${data.total_results} resultados` : ''}
          />

          {!configured ? (
            <div className="text-center py-16">
              <p className="text-fg-muted">
                Configura <code className="bg-bg-elevated px-1.5 py-0.5 rounded text-sm">VITE_TMDB_READ_ACCESS_TOKEN</code> para
                buscar películas y series.
              </p>
            </div>
          ) : query.length < 2 ? (
            <div className="text-center py-16">
              <p className="text-fg-muted">Introduce al menos 2 caracteres para buscar</p>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-6 mt-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} variant="poster" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-400">Error al buscar. Inténtalo de nuevo.</p>
            </div>
          ) : results.length > 0 ? (
            <>
              <PosterGrid
                items={results}
                size="md"
                columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
                onAddToList={setAddMedia}
              />
              <div className="mt-8 space-y-2">
                <h2 className="text-lg font-bold text-fg">¿Cuál es la correcta? Detalle por opción</h2>
                {results.slice(0, 10).map((item) => {
                  const year = yearOf(item);
                  return (
                    <NavLink
                      key={`${item.media_type}-${item.tmdb_id}`}
                      to={`/media/${item.media_type}/${item.tmdb_id}`}
                      className="flex items-center gap-4 p-3 rounded-xl bg-bg-elevated border border-border hover:border-accent transition-colors"
                    >
                      {item.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
                          alt={item.title}
                          className="w-12 h-[72px] object-cover rounded-md flex-shrink-0"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-12 h-[72px] rounded-md bg-bg-card flex items-center justify-center flex-shrink-0">
                          {item.media_type === 'movie' ? <Film className="h-5 w-5 text-fg-subtle" /> : <Tv className="h-5 w-5 text-fg-subtle" />}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-fg truncate">{item.title}</p>
                        {item.original_title && item.original_title !== item.title && (
                          <p className="text-xs text-fg-subtle truncate">{item.original_title}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-fg-subtle">
                          <Badge variant="secondary" size="sm">
                            {item.media_type === 'movie' ? 'Película' : 'Serie'}
                          </Badge>
                          {year && <span>{year}</span>}
                          {item.vote_average > 0 && (
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {item.vote_average.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </NavLink>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-fg-muted">No se encontraron resultados para "{query}"</p>
            </div>
          )}
        </Container>
      </main>

      <AddToListDialog open={addMedia !== null} onClose={() => setAddMedia(null)} media={addMedia} />
    </div>
  );
}
