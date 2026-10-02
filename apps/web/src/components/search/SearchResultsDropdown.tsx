'use client';

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Film, Tv, Search, ExternalLink } from 'lucide-react';
import { cn } from '@trak-watch/ui/utils';
import { Skeleton } from '@trak-watch/ui/components/primitives/Skeleton';
import type { MediaSummary } from '@/types';

interface SearchResultsDropdownProps {
  results: MediaSummary[];
  isLoading: boolean;
  query: string;
  onClose: () => void;
}

export function SearchResultsDropdown({ results, isLoading, query, onClose }: SearchResultsDropdownProps) {
  if (!query && results.length === 0 && !isLoading) {
    return null;
  }

  const displayResults = results.slice(0, 8);

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-bg-elevated border border-border rounded-xl shadow-poster overflow-hidden animate-in fade-in-200 slide-in-from-top-2">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-fg-subtle" />
          <span className="text-sm font-medium text-fg">Resultados para &ldquo;{query}&rdquo;</span>
        </div>
        {results.length > 8 && (
          <NavLink
            to={`/search?q=${encodeURIComponent(query)}`}
            className="text-xs text-accent hover:underline flex items-center gap-1"
            onClick={onClose}
          >
            Ver todos
            <ExternalLink className="h-3 w-3" />
          </NavLink>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="poster" className="h-24" />
          ))}
        </div>
      )}

      {/* Results */}
      {!isLoading && displayResults.length > 0 && (
        <div className="max-h-[50vh] overflow-y-auto">
          {displayResults.map((item, index) => (
            <NavLink
              key={`${item.media_type}-${item.tmdb_id}`}
              to={`/media/${item.media_type}/${item.tmdb_id}`}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 hover:bg-bg-card transition-colors border-b border-border/50 last:border-0',
                index === 0 && 'rounded-t-none'
              )}
              onClick={onClose}
            >
              <div className="relative w-14 h-21 flex-shrink-0 rounded-md overflow-hidden">
                {item.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-border to-border-light flex items-center justify-center">
                    {item.media_type === 'movie' ? <Film className="h-6 w-6 text-fg-subtle" /> : <Tv className="h-6 w-6 text-fg-subtle" />}
                  </div>
                )}
                {item.vote_average > 0 && (
                  <span className="absolute bottom-1 right-1 bg-black/80 backdrop-blur text-xs font-bold text-yellow-400 px-1.5 py-0.5 rounded">
                    {item.vote_average.toFixed(1)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-fg truncate">{item.title}</p>
                {item.original_title && item.original_title !== item.title && (
                  <p className="text-xs text-fg-subtle truncate">{item.original_title}</p>
                )}
                <div className="flex items-center gap-2 mt-0.5 text-xs text-fg-subtle">
                  <span className="flex items-center gap-1">
                    {item.media_type === 'movie' ? <Film className="h-3 w-3" /> : <Tv className="h-3 w-3" />}
                    {item.media_type === 'movie' ? 'Película' : 'Serie'}
                  </span>
                  {(item.release_date || item.first_air_date) && (
                    <span>{new Date(item.release_date || item.first_air_date!).getFullYear()}</span>
                  )}
                </div>
              </div>
            </NavLink>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && displayResults.length === 0 && query && (
        <div className="p-8 text-center">
          <Search className="h-12 w-12 text-fg-subtle mx-auto mb-3" />
          <p className="text-fg-muted">No se encontraron resultados para &ldquo;{query}&rdquo;</p>
          <p className="text-xs text-fg-subtle mt-1">Intenta con otros términos de búsqueda</p>
        </div>
      )}

      {/* Recent searches footer */}
      {!isLoading && displayResults.length === 0 && !query && (
        <div className="p-4 border-t border-border">
          <p className="text-xs text-fg-subtle mb-2">Búsquedas recientes</p>
          <div className="flex flex-wrap gap-2">
            {[]} {/* TODO: Load from localStorage */}
          </div>
        </div>
      )}
    </div>
  );
}