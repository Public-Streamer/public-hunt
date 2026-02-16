import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface LiveViewerCountProps {
  eventId: string;
  className?: string;
}

export const LiveViewerCount: React.FC<LiveViewerCountProps> = ({
  eventId,
  className = '',
}) => {
  const [viewerCount, setViewerCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setError('Event ID is required');
      setIsLoading(false);
      return;
    }

    // Set up real-time subscription for viewer count updates
    const channel = supabase
      .channel(`viewer-count-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`,
        },
        (payload) => {
          const newViewerCount = payload.new.viewer_count || 0;
          setViewerCount(newViewerCount);
          setIsLoading(false);
        }
      )
      .on('presence', { event: 'sync' }, () => {
        // This would be used if we implement presence tracking
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Get initial viewer count from database
          const fetchInitialCount = async () => {
            try {
              const { data, error } = await supabase
                .from('events')
                .select('viewer_count')
                .eq('id', eventId)
                .single();

              if (error) throw error;
              setViewerCount(data?.viewer_count || 0);
            } catch (err) {
              console.error('Error fetching initial viewer count:', err);
              setError('Failed to load viewer count');
            } finally {
              setIsLoading(false);
            }
          };

          fetchInitialCount();
        } else if (status === 'CHANNEL_ERROR') {
          setError('Real-time connection error');
          setIsLoading(false);
        }
      });

    return () => {
      // Clean up subscription on unmount
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-sm text-red-500 ${className}`}>
        {error}
      </div>
    );
  }

  return (
    <Badge variant="secondary" className={className}>
      <Users className="h-3 w-3 mr-1" />
      <span>{viewerCount.toLocaleString()} watching</span>
    </Badge>
  );
};

export default LiveViewerCount;
