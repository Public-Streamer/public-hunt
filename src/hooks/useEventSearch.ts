import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  id: string;
  slug: string | null;
  title: string;
  thumbnail: string | null;
  channelName: string | null;
}

interface UseEventSearchOptions {
  limit?: number;
  enabled?: boolean;
}

export function useEventSearch(query: string, options: UseEventSearchOptions = {}) {
  const { limit = 8, enabled = true } = options;
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<Map<string, SearchResult[]>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  const searchEvents = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !enabled) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    // Check cache first
    if (cache.has(searchQuery)) {
      setResults(cache.get(searchQuery)!);
      setIsLoading(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: searchError } = await supabase
        .from('events')
        .select(`
          id,
          slug,
          name,
          media_urls,
          channels (
            name
          )
        `)
        .or(`name.ilike.%${searchQuery}%,channels.name.ilike.%${searchQuery}%`)
        .limit(limit);

      if (searchError) {
        throw new Error(searchError.message);
      }

      const searchResults: SearchResult[] = (data || []).map(event => ({
        id: event.id,
        slug: event.slug,
        title: event.name,
        thumbnail: event.media_urls?.[0] || null,
        channelName: event.channels?.name || null,
      }));

      // Cache the results
      setCache(prev => new Map(prev).set(searchQuery, searchResults));
      setResults(searchResults);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError('Failed to search events');
        setResults([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [limit, enabled, cache]);

  useEffect(() => {
    searchEvents(query);
  }, [query, searchEvents]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    results,
    isLoading,
    error,
    clearCache: () => setCache(new Map()),
  };
}