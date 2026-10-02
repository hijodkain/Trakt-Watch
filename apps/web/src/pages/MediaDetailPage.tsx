'use client';

import React, { useState } from 'react';
import { Container } from '@trak-watch/ui/components/layout';
import { PosterGrid } from '@trak-watch/ui/components/media';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Star, Clock, Film, Tv, Play, Plus, X } from 'lucide-react';
import { Badge } from '@trak-watch/ui/components/primitives/Badge';
import { Button } from '@trak-watch/ui/components/primitives/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@trak-watch/ui/components/primitives/Dialog';
import type { MediaSummary } from '@/types';
import { getDetails, getWatchProviders, isTmdbConfigured, pickSpanishTrailer, yearOf } from '@/lib/tmdb';
import { AddToListDialog } from '@/components/lists/AddToListDialog';

export function MediaDetailPage() {
  const { type, id } = useParams<{ type: 'movie' | 'tv'; id: string }>();
  const mediaType = type === 'tv' ? 'tv' : 'movie';
  const mediaId = parseInt(id || '0');
  const [showTrailer, setShowTrailer] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const configured = isTmdbConfigured();

  const { data: media, isLoading, error } = useQuery({
    queryKey: ['media', 'detail', mediaType, mediaId],
    queryFn: () => getDetails(mediaType, mediaId),
    enabled: !!mediaId && configured,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  const { data: providers } = useQuery({
    queryKey: ['media', 'providers', mediaType, mediaId],
    queryFn: () => getWatchProviders(mediaType, mediaId),
    enabled: !!mediaId && configured,
    staleTime: 1000 * 60 * 60,
    retry: 0,
  });

  if (!configured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-4">
        <p className="text-fg-muted text-center">
          Configura <code className="bg-bg-elevated px-1.5 py-0.5 rounded text-sm">VITE_TMDB_READ_ACCESS_TOKEN</code> para
          ver los detalles.
        </p>
      </div>
    );
  }

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

  const releaseYear = yearOf(media);
  const runtime = media.runtime
    ? `${Math.floor(media.runtime / 60)}h ${media.runtime % 60}m`
    : media.episode_run_time?.[0]
      ? `${media.episode_run_time[0]}m`
      : null;

  const trailer = pickSpanishTrailer(media.videos || []);
  const directors = (media.credits?.crew || []).filter((c) => c.job === 'Director').slice(0, 2);
  const cast = (media.credits?.cast || []).slice(0, 8);
  const videosEs = (media.videos || []).filter((v) => v.site === 'YouTube' && v.iso_639_1 === 'es').slice(0, 6);
  const recommendations: MediaSummary[] = (media.recommendations || []).slice(0, 12);

  return (
    <div className="min-h-screen">
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
                {media.genres?.[0] && <Badge variant="secondary">{media.genres[0].name}</Badge>}
                <Badge variant="secondary">{mediaType === 'movie' ? 'Película' : 'Serie'}</Badge>
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
                {media.number_of_seasons != null && (
                  <span className="flex items-center gap-1">
                    <Tv className="h-4 w-4" />
                    {media.number_of_seasons} temp.
                  </span>
                )}
                {media.number_of_episodes != null && (
                  <span className="flex items-center gap-1">
                    <Film className="h-4 w-4" />
                    {media.number_of_episodes} eps.
                  </span>
                )}
                {directors.length > 0 && <span>Dir. {directors.map((d) => d.name).join(', ')}</span>}
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                {trailer && (
                  <Button size="lg" className="gap-2" onClick={() => setShowTrailer(true)}>
                    <Play className="h-5 w-5" />
                    Ver tráiler {trailer.iso_639_1 === 'es' ? 'en español' : ''}
                  </Button>
                )}
                <Button size="lg" variant="secondary" className="gap-2" onClick={() => setShowAdd(true)}>
                  <Plus className="h-5 w-5" />
                  Añadir a lista
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <main className="pb-16">
        <Container>
          <section className="py-8">
            <h2 className="text-2xl font-bold text-fg mb-4">Sinopsis</h2>
            <p className="text-fg-muted leading-relaxed max-w-4xl">
              {media.overview || 'No hay sinopsis disponible en español.'}
            </p>
          </section>

          {media.genres && media.genres.length > 0 && (
            <section className="py-4">
              <h2 className="text-xl font-bold text-fg mb-3">Géneros</h2>
              <div className="flex flex-wrap gap-2">
                {media.genres.map((genre) => (
                  <Badge key={genre.id} variant="secondary">
                    {genre.name}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {providers && providers.length > 0 && (
            <section className="py-4">
              <h2 className="text-xl font-bold text-fg mb-3">Dónde ver</h2>
              <div className="flex flex-wrap gap-2">
                {providers.map((p) => (
                  <Badge key={p} variant="secondary">
                    {p}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {cast.length > 0 && (
            <section className="py-4">
              <h2 className="text-xl font-bold text-fg mb-3">Reparto</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {cast.map((c) => (
                  <div key={c.id} className="text-center">
                    {c.profile_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w185${c.profile_path}`}
                        alt={c.name}
                        className="w-full aspect-[2/3] object-cover rounded-lg"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full aspect-[2/3] rounded-lg bg-bg-card flex items-center justify-center text-2xl">
                        🎭
                      </div>
                    )}
                    <p className="text-xs font-medium text-fg mt-1 truncate">{c.name}</p>
                    <p className="text-xs text-fg-subtle truncate">{c.character}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {videosEs.length > 0 && (
            <section className="py-8">
              <h2 className="text-2xl font-bold text-fg mb-4">Videos en español</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {videosEs.map((video) => (
                  <div
                    key={video.key}
                    className="group relative aspect-video rounded-xl overflow-hidden bg-bg-card cursor-pointer"
                    onClick={() => window.open(`https://www.youtube.com/watch?v=${video.key}`, '_blank')}
                  >
                    <img
                      src={`https://img.youtube.com/vi/${video.key}/maxresdefault.jpg`}
                      alt={video.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/50 group-hover:bg-black/70 transition-colors flex items-center justify-center">
                      <Play className="h-10 w-10 text-white/80 group-hover:text-white transition-colors" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-sm font-medium text-white truncate">{video.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {recommendations.length > 0 && (
            <section className="py-8">
              <h2 className="text-2xl font-bold text-fg mb-4">Te puede interesar</h2>
              <PosterGrid items={recommendations} size="md" columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }} />
            </section>
          )}
        </Container>
      </main>

      <Dialog open={showTrailer} onOpenChange={(v) => !v && setShowTrailer(false)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="flex items-center justify-between">
              Tráiler
              <button onClick={() => setShowTrailer(false)} aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </DialogTitle>
          </DialogHeader>
          {trailer && (
            <div className="aspect-video w-full">
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0`}
                title={trailer.name}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AddToListDialog open={showAdd} onClose={() => setShowAdd(false)} media={media} />
    </div>
  );
}
