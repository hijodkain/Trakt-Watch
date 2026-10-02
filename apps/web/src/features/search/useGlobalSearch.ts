'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { searchMedia } from '@/lib/tmdb';
import type { MediaSummary } from '@/types';

interface UseGlobalSearchReturn {
  results: MediaSummary[];
  isLoading: boolean;
  search: (query: string) => void;
  clearSearch: () => void;
}

export function useGlobalSearch(): UseGlobalSearchReturn {
  const [results, setResults] = useState<MediaSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const seqRef = useRef(0);

  const search = useCallback((q: string) => {
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
    const seq = ++seqRef.current;

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      try {
        const data = await searchMedia(q, 1, controller.signal);
        if (seqRef.current === seq) {
          setResults(data.results.slice(0, 8));
        }
      } catch (error) {
        if ((error as Error)?.name !== 'AbortError') {
          console.error('Search error:', error);
        }
        if (seqRef.current === seq) {
          setResults([]);
        }
      } finally {
        if (seqRef.current === seq) {
          setIsLoading(false);
        }
      }
    }, 300);
  }, []);

  const clearSearch = useCallback(() => {
    seqRef.current++;
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
