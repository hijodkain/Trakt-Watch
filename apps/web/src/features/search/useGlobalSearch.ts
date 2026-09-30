'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/features/auth/AuthProvider';

interface SearchResult {
  id: number;
  title: string;
  name: string;
  media_type: 'movie' | 'tv';
  poster_path: string | null;
  release_date: string | null;
  first_air_date: string | null;
  vote_average: number;
  genre_ids: number[];
}

interface UseGlobalSearchReturn {
  results: SearchResult[];
  isLoading: boolean;
  search: (query: string) => void;
  clearSearch: () => void;
}

export function useGlobalSearch(): UseGlobalSearchReturn {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const search = useCallback((q: string) => {
    setQuery(q);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!q.trim() || q.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(async () => {
      abortControllerRef.current = new AbortController();
      
      try {
        const { data, error } = await supabase.functions.invoke('tmdb-search', {
          body: { query: q, language: 'es', page: 1 },
          headers: { 'Content-Type': 'application/json' },
        });

        if (!abortControllerRef.current?.signal.aborted) {
          if (error) {
            console.error('Search error:', error);
            setResults([]);
          } else {
            setResults(data?.results || []);
          }
          setIsLoading(false);
        }
      } catch (error) {
        if (!abortControllerRef.current?.signal.aborted) {
          console.error('Search error:', error);
          setResults([]);
          setIsLoading(false);
        }
      }
    }, 300);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsLoading(false);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { results, isLoading, search, clearSearch };
}