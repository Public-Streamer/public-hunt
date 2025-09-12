import { useState, useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { viewerCountService } from '@/lib/viewerCountService';

interface UseViewerCountOptions {
  eventId?: string;
  refreshInterval?: number;
  enableRealtime?: boolean;
}

interface UseViewerCountResult {
  viewerCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Simple hook to get viewer count for an event
 * This is a fallback for components that don't need real-time updates
 */
export function useViewerCount({
  eventId,
  refreshInterval = 30000, // 30 seconds
  enableRealtime = false
}: UseViewerCountOptions = {}): UseViewerCountResult {
  const [viewerCount, setViewerCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchViewerCount = async (): Promise<void> => {
    if (!eventId) return;

    try {
      setIsLoading(true);
      setError(null);

      const supabase = supabaseBrowser();
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('viewer_count')
        .eq('id', eventId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      setViewerCount(data?.viewer_count || 0);
    } catch (err) {
      console.error('Error fetching viewer count:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setViewerCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and periodic refresh
  useEffect(() => {
    if (!eventId) return;

    fetchViewerCount();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchViewerCount, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [eventId, refreshInterval]);

  // Real-time updates via database changes
  useEffect(() => {
    if (!eventId || !enableRealtime) return;

    const supabase = supabaseBrowser();
    
    const channel = supabase
      .channel(`viewer_count:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`
        },
        (payload) => {
          const newViewerCount = payload.new?.viewer_count || 0;
          setViewerCount(newViewerCount);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, enableRealtime]);

  return {
    viewerCount,
    isLoading,
    error,
    refresh: fetchViewerCount
  };
}

/**
 * Hook to update viewer count for an event (for streamers/hosts)
 */
export function useViewerCountUpdater(eventId: string) {
  const updateViewerCount = (participantCount: number, streamerCount = 0) => {
    viewerCountService.queueUpdate(eventId, participantCount, streamerCount);
  };

  const flushUpdates = async () => {
    await viewerCountService.flushQueue();
  };

  return {
    updateViewerCount,
    flushUpdates
  };
}