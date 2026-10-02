'use client';

import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PosterGrid, Skeleton } from '@trak-watch/ui/components/media';
import { SectionHeader, Container } from '@trak-watch/ui/components/layout';
import { Button } from '@trak-watch/ui/components/primitives/Button';
import { Search, TrendingUp, Star, Film, Tv } from 'lucide-react';
import type { MediaSummary } from '@/types';
import { discoverMedia, getTrending, isTmdbConfigured } from '@/lib/tmdb';
import { AddToListDialog } from '@/components/lists/AddToListDialog';

export function HomePage() {
  const [heroMedia, setHeroMedia] = useState<MediaSummary | null>(null);
  const [addMedia, setAddMedia] = useState<MediaSummary | null>(null);
  const configured = isTmdbConfigured();

  const { data: trendingMovies } = useQuery({
    queryKey: ['media', 'trending', 'movie', 'week'],
    queryFn: () => getTrending('movie', 'week'),
    staleTime: 1000 * 60 * 30,
    enabled: configured,
    retry: 1,
  });

  const { data: trendingTV } = useQuery({
    queryKey: ['media', 'trending', 'tv', 'week'],
    queryFn: () => getTrending('tv', 'week'),
    staleTime: 1000 * 60 * 30,
    enabled: configured,
    retry: 1,
  });

  const { data: popularMovies } = useQuery({
    queryKey: ['media', 'discover', 'movie', 'popularity'],
    queryFn: () => discoverMedia('movie', { sort_by: 'popularity.desc' }),
    staleTime: 1000 * 60 * 30,
    enabled: configured,
    retry: 1,
  });

  const { data: topRatedMovies } = useQuery({
    queryKey: ['media', 'discover', 'movie', 'top-rated'],
    queryFn: () => discoverMedia('movie', { sort_by: 'vote_average.desc', 'vote_count.gte': '500' }),
    staleTime: 1000 * 60 * 60,
    enabled: configured,
    retry: 1,
  });

  useEffect(() => {
    if (trendingMovies && trendingMovies.length > 0) {
      setHeroMedia(trendingMovies[0]);
    }
  }, [trendingMovies]);

  if (!configured) {
    return (
      <div className="min-h-screen">
        <main className="py-16">
          <Container className="max-w-2xl text-center">
            <h1 className="text-3xl font-bold text-fg mb-4">Falta configurar TMDB</h1>
            <p className="text-fg-muted mb-6">
              Define <code className="bg-bg-elevated px-1.5 py-0.5 rounded text-sm">VITE_TMDB_READ_ACCESS_TOKEN</code> en
              Vercel y redespliega para ver tendencias, búsqueda y detalles.
            </p>
            <Button asChild>
              <NavLink to="/lists">Ir a mis listas</NavLink>
            </Button>
          </Container>
        </main>
      </div>
    );
  }

  const sections = [
    {
      title: 'Populares esta semana',
      icon: TrendingUp,
      items: trendingMovies || [],
      loading: !trendingMovies,
    },
    {
      title: 'Mejor valoradas',
      icon: Star,
      items: topRatedMovies || [],
      loading: !topRatedMovies,
    },
    {
      title: 'En cines / Populares',
      icon: Film,
      items: popularMovies || [],
      loading: !popularMovies,
    },
    {
      title: 'Series en tendencia',
      icon: Tv,
      items: trendingTV || [],
      loading: !trendingTV,
    },
  ];

  return (
    <div className="min-h-screen">
      {heroMedia ? (
        <section className="relative min-h-[50vh] lg:min-h-[60vh] flex items-end">
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: heroMedia.backdrop_path
                ? `url(https://image.tmdb.org/t/p/w1280${heroMedia.backdrop_path})`
                : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-bg/95 via-bg/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/10 to-transparent" />
          </div>

          <Container className="relative z-10 pb-12 lg:pb-20">
            <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-end">
              <div className="relative w-full lg:w-48 flex-shrink-0">
                {heroMedia.poster_path && (
                  <img
                    src={`https://image.tmdb.org/t/p/w342${heroMedia.poster_path}`}
                    alt={heroMedia.title}
                    className="w-full aspect-[2/3] object-cover rounded-xl shadow-poster"
                    loading="eager"
                  />
                )}
              </div>

              <div className="flex-1 text-center lg:text-left max-w-2xl">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-4">
                  <span className="px-3 py-1 text-sm font-medium bg-bg-elevated/80 backdrop-blur border border-border rounded-full">
                    {heroMedia.release_date ? new Date(heroMedia.release_date).getFullYear() : '—'}
                  </span>
                  {heroMedia.vote_average > 0 && (
                    <span className="flex items-center gap-1 px-3 py-1 text-sm font-medium bg-accent/20 text-accent border border-accent/30 rounded-full">
                      <Star className="h-3 w-3 fill-current" />
                      {heroMedia.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>

                <h1 className="text-4xl lg:text-6xl font-bold text-fg tracking-tight mb-4 line-clamp-2">
                  {heroMedia.title}
                </h1>

                {heroMedia.overview && (
                  <p className="text-lg text-fg-muted mb-6 max-w-2xl mx-auto lg:mx-0 line-clamp-3">
                    {heroMedia.overview}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                  <Button size="lg" className="gap-2" asChild>
                    <NavLink to={`/media/${heroMedia.media_type}/${heroMedia.tmdb_id}`}>
                      <Search className="h-5 w-5" />
                      Más info
                    </NavLink>
                  </Button>
                  <Button size="lg" variant="secondary" className="gap-2" onClick={() => setAddMedia(heroMedia)}>
                    <Film className="h-5 w-5" />
                    Añadir a lista
                  </Button>
                </div>
              </div>
            </div>
          </Container>
        </section>
      ) : (
        <section className="min-h-[40vh] flex items-center justify-center bg-bg">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-accent border-t-transparent" />
        </section>
      )}

      <main className="pb-16">
        {sections.map((section) => (
          <section key={section.title} className="py-8">
            <Container>
              <SectionHeader title={section.title} />
              {section.loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-6 mt-6">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} variant="poster" />
                  ))}
                </div>
              ) : (
                <PosterGrid
                  items={section.items.slice(0, 18)}
                  size="md"
                  columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
                  onAddToList={setAddMedia}
                />
              )}
            </Container>
          </section>
        ))}
      </main>

      <AddToListDialog open={addMedia !== null} onClose={() => setAddMedia(null)} media={addMedia} />
    </div>
  );
}
