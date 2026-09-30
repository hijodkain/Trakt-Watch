import * as React from 'react';
import { Plus, Check, Heart, Eye, Star } from 'lucide-react';
import { cn } from '../../utils';
import { Button } from '../primitives/Button';
import { Badge } from '../primitives/Badge';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../primitives/Tooltip';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../primitives/DropdownMenu';
import type { MediaSummary, MediaType, ItemStatus } from '../../types';

interface PosterCardProps {
  media: MediaSummary;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'compact';
  onAddToList?: (media: MediaSummary) => void;
  onRate?: (media: MediaSummary, rating: number) => void;
  onToggleWatched?: (media: MediaSummary) => void;
  onToggleFavorite?: (media: MediaSummary) => void;
  currentStatus?: ItemStatus;
  isFavorite?: boolean;
  userRating?: number;
  showActions?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const sizeClasses = {
  sm: 'w-24',
  md: 'w-32',
  lg: 'w-40',
  xl: 'w-48',
};

const aspectRatios: Record<MediaType, string> = {
  movie: 'aspect-[2/3]',
  tv: 'aspect-[2/3]',
};

export function PosterCard({
  media,
  size = 'md',
  variant = 'default',
  onAddToList,
  onRate,
  onToggleWatched,
  onToggleFavorite,
  currentStatus,
  isFavorite,
  userRating,
  showActions = true,
  className,
  style,
}: PosterCardProps) {
  const posterUrl = media.poster_path
    ? `https://image.tmdb.org/t/p/w500${media.poster_path}`
    : null;

  const isMovie = media.media_type === 'movie';
  const releaseYear = media.release_date || media.first_air_date
    ? new Date(media.release_date || media.first_air_date!).getFullYear()
    : null;

  const statusLabels: Record<ItemStatus, string> = {
    to_watch: 'Por ver',
    watching: 'Viendo',
    watched: 'Vista',
    dropped: 'Abandonada',
  };

  const statusColors: Record<ItemStatus, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
    to_watch: 'default',
    watching: 'success',
    watched: 'secondary',
    dropped: 'destructive',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'group relative flex flex-col poster-card',
              sizeClasses[size],
              variant === 'compact' && 'flex-row items-start gap-3',
              className
            )}
            style={style}
          >
            <div className={cn('relative overflow-hidden rounded-xl', aspectRatios[media.media_type])}>
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={media.title}
                  className="poster-image w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-border to-border-light flex items-center justify-center">
                  <span className="text-4xl">🎬</span>
                </div>
              )}

              {/* Rating badge */}
              {media.vote_average > 0 && (
                <div className="absolute top-2 left-2 z-10">
                  <Badge variant="default" className="bg-black/80 backdrop-blur text-xs font-bold">
                    {media.vote_average.toFixed(1)}
                  </Badge>
                </div>
              )}

              {/* Media type badge */}
              <div className="absolute top-2 right-2 z-10">
                <Badge
                  variant="secondary"
                  className="bg-black/80 backdrop-blur text-xs px-1.5 py-0.5"
                >
                  {isMovie ? '🎬' : '📺'}
                </Badge>
              </div>

              {/* Overlay with actions */}
              {showActions && (
                <div className="poster-overlay flex flex-col items-center justify-end p-4">
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {onAddToList && (
                      <TooltipContent side="top" align="center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-full bg-black/80 backdrop-blur text-fg hover:bg-accent hover:text-fg"
                          onClick={e => { e.stopPropagation(); onAddToList(media); }}
                          aria-label="Añadir a lista"
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                      </TooltipContent>
                    )}
                    {onToggleWatched && (
                      <TooltipContent side="top" align="center">
                        <Button
                          variant={currentStatus === 'watched' ? 'primary' : 'ghost'}
                          size="icon"
                          className="h-10 w-10 rounded-full bg-black/80 backdrop-blur text-fg hover:bg-accent hover:text-fg"
                          onClick={e => { e.stopPropagation(); onToggleWatched(media); }}
                          aria-label={currentStatus === 'watched' ? 'Marcar como no vista' : 'Marcar como vista'}
                        >
                          <Check className="h-5 w-5" />
                        </Button>
                      </TooltipContent>
                    )}
                    {onToggleFavorite && (
                      <TooltipContent side="top" align="center">
                        <Button
                          variant={isFavorite ? 'primary' : 'ghost'}
                          size="icon"
                          className="h-10 w-10 rounded-full bg-black/80 backdrop-blur text-fg hover:bg-red-500 hover:text-white"
                          onClick={e => { e.stopPropagation(); onToggleFavorite(media); }}
                          aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                        >
                          <Heart className={cn('h-5 w-5', isFavorite && 'fill-current text-red-500')} />
                        </Button>
                      </TooltipContent>
                    )}
                  </div>
                </div>
              )}

              {/* User rating */}
              {userRating && (
                <div className="absolute bottom-2 left-2 right-2 flex justify-center gap-0.5">
                  {Array.from({ length: 10 }, (_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-3 w-3',
                        i < userRating ? 'fill-yellow-400 text-yellow-400' : 'text-border'
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            {variant !== 'compact' && (
              <div className="mt-2 flex-1 min-w-0">
                <h3 className="font-medium text-sm text-fg truncate line-clamp-1" title={media.title}>
                  {media.title}
                </h3>
                <div className="flex items-center gap-1 mt-0.5 text-xs text-fg-subtle">
                  {releaseYear && <span>{releaseYear}</span>}
                  {releaseYear && media.vote_average > 0 && <span>·</span>}
                  {media.vote_average > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {media.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>
                {currentStatus && (
                  <Badge
                    variant={statusColors[currentStatus]}
                    size="sm"
                    className="mt-1.5"
                  >
                    {statusLabels[currentStatus]}
                  </Badge>
                )}
              </div>
            )}

            {variant === 'compact' && (
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-fg truncate" title={media.title}>
                  {media.title}
                </h3>
                <div className="flex items-center gap-1 mt-0.5 text-xs text-fg-subtle">
                  {releaseYear && <span>{releaseYear}</span>}
                  {releaseYear && media.vote_average > 0 && <span>·</span>}
                  {media.vote_average > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {media.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </TooltipTrigger>
      </Tooltip>
    </TooltipProvider>
  );
}