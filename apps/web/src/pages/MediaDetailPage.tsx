'use client';

import React from 'react';
import { Container, SectionHeader } from '@trak-watch/ui/components/layout';
import { PosterGrid, Skeleton } from '@trak-watch/ui/components/media';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/features/auth/AuthProvider';
import { useParams } from 'react-router-dom';
import { Star, Clock, Calendar, Film, Tv } from 'lucide-react';
import { Badge } from '@trak-watch/ui/components/primitives/Badge';
import { Button } from '@trak-watch/ui/components/primitives/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@trak-watch/ui/components/primitives/Dialog';

interface MediaDetail {
  tmdb_id: number;
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
  genres: { id: number; name: string }[];
  runtime: number | null;
  episode_run_time: number[] | null;
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  status: string;
  tagline: string | null;
  videos: { results: any[] };
  images: { backdrops: any[]; logos: any[]; posters: any[] };
}

async function fetchMediaDetail(type: 'movie' | 'tv', id: number) {
  const { data, error } = await supabase.functions.invoke('tmdb-detail', {
    body: { media_type: type, id },
  });
  if (error) throw error;
  return data;
}

export function MediaDetailPage() {
  const { type, id } = useParams<{ type: 'movie' | 'tv'; id: string }>();
  const mediaType = type || 'movie';
  const mediaId = parseInt(id || '0');

  const { data: media, isLoading, error } = useQuery({
    queryKey: ['media', 'detail', mediaType, mediaId],
    queryFn: () => fetchMediaDetail(mediaType, mediaId),
    enabled: !!mediaId,
    staleTime: 1000 * 60 * 30,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-accent border-t-transparent" />
      </div>
    );
  }

  if (error || !media) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <p className="text-red-400 mb-4">No se pudo cargar la información</p>
          <Button variant="secondary" onClick={() => window.history.back()}>
            Volver
          </Button>
        </div>
      </div>
    );
  }

  const isMovie = media.media_type === 'movie';
  const releaseYear = media.release_date || media.first_air_date 
    ? new Date(media.release_date || media.first_air_date!).getFullYear() 
    : null;

  const runtime = media.runtime 
    ? `${Math.floor(media.runtime / 60)}h ${media.runtime % 60}m`
    : media.episode_run_time?.[0]
    ? `${media.episode_run_time[0]}m`
    : null;

  const trailer = media.videos?.results?.find(
    (v: any) => v.site === 'YouTube' && v.iso_639_1 === 'es' && v.type === 'Trailer'
  );

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-[50vh] lg:min-h-[60vh] flex items-end">
        <div 
          className="absolute inset-0 z-0"
          style={{ 
            backgroundImage: media.backdrop_path 
              ? `url(https://image.tmdb.org/t/p/w1280${media.backdrop_path})` 
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
              {media.poster_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w342${media.poster_path}`}
                  alt={media.title}
                  className="w-full aspect-[2/3] object-cover rounded-xl shadow-poster"
                  loading="eager"
                />
              )}
            </div>
            
            <div className="flex-1 text-center lg:text-left max-w-2xl">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-4">
                {releaseYear && (
                  <Badge variant="secondary" className="bg-bg-elevated/80 backdrop-blur border border-border">
                    {releaseYear}
                  </Badge>
                )}
                {media.vote_average > 0 && (
                  <Badge variant="default" className="gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    {media.vote_average.toFixed(1)}
                  </Badge>
                )}
                {media.genres?.[0] && (
                  <Badge variant="secondary">{media.genres[0].name}</Badge>
                )}
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-fg tracking-tight mb-4 line-clamp-2">
                {media.title}
              </h1>
              
              {media.original_title && media.original_title !== media.title && (
                <p className="text-fg-subtle mb-4">{media.original_title}</p>
              )}
              
              {media.tagline && (
                <p className="text-lg text-fg-muted italic mb-6 max-w-2xl mx-auto lg:mx-0">"{media.tagline}"</p>
              )}
              
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-fg-muted mb-6">
                {runtime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {runtime}
                  </span>
                )}
                {media.number_of_seasons && (
                  <span className="flex items-center gap-1">
                    <Tv className="h-4 w-4" />
                    {media.number_of_seasons} temp.
                  </span>
                )}
                {media.number_of_episodes && (
                  <span className="flex items-center gap-1">
                    <Film className="h-4 w-4" />
                    {media.number_of_episodes} eps.
                  </span>
                )}
                {media.status && (
                  <Badge variant="secondary" className="text-xs">
                    {media.status}
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                {trailer && (
                  <Button size="lg" className="gap-2" onClick={() => window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank')}>
                    <Film className="h-5 w-5" />
                    Ver tráiler
                  </Button>
                )}
                <Button size="lg" variant="secondary" className="gap-2">
                  <Star className="h-5 w-5" />
                  Añadir a lista
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Details */}
      <main className="pb-16">
        <Container>
          <section className="py-8">
            <h2 className="text-2xl font-bold text-fg mb-6">Sinopsis</h2>
            <p className="text-fg-muted leading-relaxed max-w-4xl">
              {media.overview || 'No hay sinopsis disponible.'}
            </p>
          </section>

          {media.genres && media.genres.length > 0 && (
            <section className="py-8">
              <h2 className="text-2xl font-bold text-fg mb-4">Géneros</h2>
              <div className="flex flex-wrap gap-2">
                {media.genres.map((genre: any) => (
                  <Badge key={genre.id} variant="secondary">{genre.name}</Badge>
                ))}
              </div>
            </section>
          )}

          {media.videos?.results && media.videos.results.length > 0 && (
            <section className="py-8">
              <h2 className="text-2xl font-bold text-fg mb-4">Videos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {media.videos.results
                  .filter((v: any) => v.site === 'YouTube')
                  .slice(0, 6)
                  .map((video: any) => (
                    <div key={video.key} className="group relative aspect-video rounded-xl overflow-hidden bg-bg-card">
                      <a href={`https://www.youtube.com/watch?v=${video.key}`} target="_blank" rel="noopener noreferrer">
                        <img
                          src={`https://img.youtube.com/vi/${video.key}/maxresdefault.jpg`}
                          alt={video.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/70 transition-colors flex items-center justify-center">
                          <Film className="h-10 w-10 text-white/80 group-hover:text-white transition-colors" />
                        </div>
                      </a>
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-sm font-medium text-white truncate">{video.name}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}
        </Container>
      </main>
    </div>
  );
}