import * as React from 'react';
import { cn } from '../../utils';
import { PosterCard } from './PosterCard';
import { Skeleton } from '../primitives/Skeleton';
import type { MediaSummary } from '@trak-watch/shared/types';

interface PosterGridProps {
  items: MediaSummary[];
  size?: 'sm' | 'md' | 'lg' | 'xl';
  columns?: { base: number; sm: number; md: number; lg: number; xl: number };
  gap?: number;
  isLoading?: boolean;
  skeletonCount?: number;
  onAddToList?: (media: MediaSummary) => void;
  onRate?: (media: MediaSummary, rating: number) => void;
  onToggleWatched?: (media: MediaSummary) => void;
  onToggleFavorite?: (media: MediaSummary) => void;
  getItemStatus?: (id: number, type: string) => string | undefined;
  getItemFavorite?: (id: number, type: string) => boolean | undefined;
  getItemRating?: (id: number, type: string) => number | undefined;
  className?: string;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
}

const defaultColumns = { base: 2, sm: 3, md: 4, lg: 5, xl: 6 };

export function PosterGrid({
  items,
  size = 'md',
  columns = defaultColumns,
  gap = 4,
  isLoading = false,
  skeletonCount = 12,
  onAddToList,
  onRate,
  onToggleWatched,
  onToggleFavorite,
  getItemStatus,
  getItemFavorite,
  getItemRating,
  className,
  emptyMessage = 'No hay contenido para mostrar',
  emptyAction,
}: PosterGridProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          'grid gap-x-3 gap-y-6',
          `grid-cols-${columns.base} sm:grid-cols-${columns.sm} md:grid-cols-${columns.md} lg:grid-cols-${columns.lg} xl:grid-cols-${columns.xl}`,
          className
        )}
        role="list"
        aria-label="Cargando contenido"
      >
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Skeleton key={i} variant="poster" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="text-6xl mb-4">🎬</div>
        <h3 className="text-lg font-medium text-fg mb-2">{emptyMessage}</h3>
        <p className="text-fg-subtle max-w-sm mb-6">
          Intenta buscar algo diferente o ajusta tus filtros.
        </p>
        {emptyAction}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid gap-x-3 gap-y-6',
        `grid-cols-${columns.base} sm:grid-cols-${columns.sm} md:grid-cols-${columns.md} lg:grid-cols-${columns.lg} xl:grid-cols-${columns.xl}`,
        className
      )}
      role="list"
      aria-label="Lista de películas y series"
    >
      {items.map((media, index) => (
        <PosterCard
          key={`${media.media_type}-${media.tmdb_id}`}
          media={media}
          size={size}
          onAddToList={onAddToList}
          onRate={onRate}
          onToggleWatched={onToggleWatched}
          onToggleFavorite={onToggleFavorite}
          currentStatus={getItemStatus?.(media.tmdb_id, media.media_type) as any}
          isFavorite={getItemFavorite?.(media.tmdb_id, media.media_type)}
          userRating={getItemRating?.(media.tmdb_id, media.media_type)}
          style={{ animationDelay: `${index * 30}ms` }}
          className="animate-in"
        />
      ))}
    </div>
  );
}