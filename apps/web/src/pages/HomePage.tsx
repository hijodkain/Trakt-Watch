'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/features/auth/AuthProvider';
import { PosterGrid, Skeleton } from '@trak-watch/ui/components/media';
import { SectionHeader, Container } from '@trak-watch/ui/components/layout';
import { Button } from '@trak-watch/ui/components/primitives/Button';
import { Search, TrendingUp, Star, Film, Tv } from 'lucide-react';

interface MediaSummary {
  tmdb_id: number;
  imdb_id: string | null;
  media_type: 'movie' | 'tv';
  title: string;
  original_title: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  first_air_date: string | null;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  genres?: Genre[];
  runtime: number | null;
  episode_run_time: number[] | null;
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  status: string;
  tagline: string | null;
}

interface Genre {
  id: number;
  name: string;
}

async function fetchTrending(type: 'movie' | 'tv', timeWindow: 'day' | 'week' = 'week') {
  const { data, error } = await supabase.functions.invoke('tmdb-trending', {
    body: { media_type: type, time_window: timeWindow },
  });
  if (error) throw error;
  return data?.results || [];
}

async function fetchDiscover(type: 'movie' | 'tv', params: Record<string, string>) {
  const { data, error } = await supabase.functions.invoke('tmdb-discover', {
    body: { media_type: type, ...params },
  });
  if (error) throw error;
  return data?.results || [];
}

export function HomePage() {
  const [heroMedia, setHeroMedia] = useState<MediaSummary | null>(null);

  const { data: trendingMovies } = useQuery({
    queryKey: ['media', 'trending', 'movie', 'week'],
    queryFn: () => fetchTrending('movie', 'week'),
    staleTime: 1000 * 60 * 30,
  });

  const { data: trendingTV } = useQuery({
    queryKey: ['media', 'trending', 'tv', 'week'],
    queryFn: () => fetchTrending('tv', 'week'),
    staleTime: 1000 * 60 * 30,
  });

  const { data: popularMovies } = useQuery({
    queryKey: ['media', 'discover', 'movie', { sort_by: 'popularity.desc' }],
    queryFn: () => fetchDiscover('movie', { sort_by: 'popularity.desc' }),
    staleTime: 1000 * 60 * 30,
  });

  const { data: topRatedMovies } = useQuery({
    queryKey: ['media', 'discover', 'movie', { sort_by: 'vote_average.desc', 'vote_count.gte': '500' }],
    queryFn: () => fetchDiscover('movie', { sort_by: 'vote_average.desc', 'vote_count.gte': '500' }),
    staleTime: 1000 * 60 * 60,
  });

  const { data: airingToday } = useQuery({
    queryKey: ['media', 'discover', 'tv', { sort_by: 'popularity.desc', 'air_date.gte': new Date().toISOString().split('T')[0] }],
    queryFn: () => fetchDiscover('tv', { sort_by: 'popularity.desc', 'air_date.gte': new Date().toISOString().split('T')[0] }),
    staleTime: 1000 * 60 * 30,
  });

  // Set hero from trending movies
  useEffect(() => {
    if (trendingMovies && trendingMovies.length > 0) {
      setHeroMedia(trendingMovies[0]);
    }
  }, [trendingMovies]);

  const sections = [
    {
      title: 'Populares esta semana',
      icon: TrendingUp,
      items: trendingMovies || [],
      loading: !trendingMovies,
      action: <Button variant="ghost" size="sm" asChild><a href="/search?type=movie&sort=popularity.desc">Ver todas <span>→</span></a></Button>,
    },
    {
      title: 'Mejor valoradas',
      icon: Star,
      items: topRatedMovies || [],
      loading: !topRatedMovies,
      action: <Button variant="ghost" size="sm" asChild><a href="/search?type=movie&sort=vote_average.desc">Ver todas <span>→</span></a></Button>,
    },
    {
      title: 'En cines / Próximamente',
      icon: Film,
      items: popularMovies || [],
      loading: !popularMovies,
      action: <Button variant="ghost" size="sm" asChild><a href="/search?type=movie&sort=release_date.desc">Ver todas <span>→</span></a></Button>,
    },
    {
      title: 'Series en emisión',
      icon: Tv,
      items: trendingTV || [],
      loading: !trendingTV,
      action: <Button variant="ghost" size="sm" asChild><a href="/search?type=tv&sort=popularity.desc">Ver todas <span>→</span></a></Button>,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
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
                  <Button size="lg" className="gap-2">
                    <Search className="h-5 w-5" />
                    Más info
                  </Button>
                  <Button size="lg" variant="secondary" className="gap-2">
                    <Film className="h-5 w-5" />
                    Ver tráiler
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

      {/* Sections */}
      <main className="pb-16">
        {sections.map((section, index) => (
          <section key={section.title} className="py-8">
            <Container>
              <SectionHeader
                title={section.title}
                action={section.action}
              />
              {section.loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-6 mt-6">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} variant="poster" />
                  ))}
                </div>
              ) : (
                <PosterGrid
                  items={section.items.slice(0, 20)}
                  size="md"
                  columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
                />
              )}
            </Container>
          </section>
        ))}
      </main>
    </div>
  );
}