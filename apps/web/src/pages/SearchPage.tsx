'use client';

import React from 'react';
import { Container, SectionHeader } from '@trak-watch/ui/components/layout';
import { PosterGrid, Skeleton } from '@trak-watch/ui/components/media';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/features/auth/AuthProvider';

interface MediaSummary {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  release_date: string | null;
  first_air_date: string | null;
  vote_average: number;
  genre_ids: number[];
}

async function searchMedia(query: string, page = 1) {
  const { data, error } = await supabase.functions.invoke('tmdb-search', {
    body: { query, language: 'es', page },
  });
  if (error) throw error;
  return data?.results || [];
}

export function SearchPage() {
  const searchParams = new URLSearchParams(window.location.search);
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const { data: results, isLoading, error } = useQuery({
    queryKey: ['media', 'search', query, page],
    queryFn: () => searchMedia(query, page),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="min-h-screen">
      <main className="py-8">
        <Container>
          <SectionHeader
            title={`Resultados para "${query}"`}
            description={results ? `${results.length} resultados` : ''}
          />
          
          {query.length < 2 ? (
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
          ) : results && results.length > 0 ? (
            <PosterGrid
              items={results}
              size="md"
              columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
            />
          ) : (
            <div className="text-center py-16">
              <p className="text-fg-muted">No se encontraron resultados para "{query}"</p>
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}