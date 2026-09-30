import * as React from 'react';
import { Play, Info } from 'lucide-react';
import { cn } from '../../utils';
import { Button } from '../primitives/Button';
import type { MediaDetail } from '../../types';

interface HeroBannerProps {
  media: MediaDetail;
  onPlayTrailer?: () => void;
  onAddToList?: () => void;
  className?: string;
}

export function HeroBanner({ media, onPlayTrailer, onAddToList, className }: HeroBannerProps) {
  const backdropUrl = media.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${media.backdrop_path}`
    : null;

  const posterUrl = media.poster_path
    ? `https://image.tmdb.org/t/p/w342${media.poster_path}`
    : null;

  const isMovie = media.media_type === 'movie';
  const releaseYear = media.release_date || media.first_air_date
    ? new Date(media.release_date || media.first_air_date!).getFullYear()
    : null;

  const runtime = media.runtime
    ? `${Math.floor(media.runtime / 60)}h ${media.runtime % 60}m`
    : media.episode_run_time?.[0]
    ? `${media.episode_run_time[0]}m`
    : null;

  const genres = media.genres?.slice(0, 3).map((g: { name: string }) => g.name).join(' · ');

  return (
    <div
      className={cn('relative overflow-hidden rounded-2xl', className)}
      style={{ backgroundImage: backdropUrl ? `url(${backdropUrl})` : 'none' }}
      aria-label={`Banner de ${media.title}`}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-bg/95 via-bg/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/10 to-transparent" />

      <div className="relative px-6 py-10 md:px-12 md:py-16 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-end">
          {/* Poster */}
          {posterUrl && (
            <div className="relative w-full md:w-56 flex-shrink-0">
              <img
                src={posterUrl}
                alt={media.title}
                className="w-full aspect-[2/3] object-cover rounded-xl shadow-poster"
                loading="eager"
              />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0 text-center md:text-left">
            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
              {releaseYear && (
                <span className="px-3 py-1 text-sm font-medium bg-bg-elevated/80 backdrop-blur border border-border rounded-full">
                  {releaseYear}
                </span>
              )}
              {media.vote_average > 0 && (
                <span className="flex items-center gap-1 px-3 py-1 text-sm font-medium bg-accent/20 text-accent border border-accent/30 rounded-full">
                  <span className="flex h-3 w-3">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  </span>
                  {media.vote_average.toFixed(1)}
                </span>
              )}
              {media.genres?.[0] && (
                <span className="px-3 py-1 text-sm font-medium bg-bg-elevated/80 backdrop-blur border border-border rounded-full">
                  {media.genres[0].name}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-fg tracking-tight mb-4 line-clamp-2">
              {media.title}
            </h1>

            {/* Original title if different */}
            {media.original_title && media.original_title !== media.title && (
              <p className="text-fg-subtle mb-4">{media.original_title}</p>
            )}

            {/* Tagline */}
            {media.tagline && (
              <p className="text-lg text-fg-muted italic mb-6 max-w-2xl mx-auto md:mx-0">"{media.tagline}"</p>
            )}

            {/* Meta info */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-fg-muted mb-6">
              {runtime && (
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {runtime}
                </span>
              )}
              {genres && (
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                  {genres}
                </span>
              )}
              {media.number_of_seasons && (
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  {media.number_of_seasons} temp.
                </span>
              )}
              {media.number_of_episodes && (
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  {media.number_of_episodes} eps.
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              {onPlayTrailer && media.videos?.some((v: { site: string; iso_639_1: string }) => v.site === 'YouTube' && v.iso_639_1 === 'es') && (
                <Button size="lg" onClick={onPlayTrailer} className="gap-2">
                  <Play className="h-5 w-5" />
                  Ver tráiler
                </Button>
              )}
              {onAddToList && (
                <Button size="lg" variant="secondary" onClick={onAddToList} className="gap-2">
                  <Info className="h-5 w-5" />
                  Más info
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}