import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const useParticipantCount = (eventId: string | null) => {
  const [participantCount, setParticipantCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setIsLoading(false);
      return;
    }

    const fetchParticipantCount = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Subscribe to real-time updates
        const channel = supabase
          .channel(`participant-count-${eventId}`, {
            config: {
              presence: {
                key: `event-${eventId}`,
              },
            },
          })
          .on('presence', { event: 'sync' }, () => {
            const presenceState = channel.presenceState();
            const count = Object.keys(presenceState).length;
            setParticipantCount(count);
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              // Get initial count from database
              const { data, error: dbError } = await supabase
                .from('events')
                .select('viewer_count')
                .eq('id', eventId)
                .single();

              if (data) {
                setParticipantCount(data.viewer_count || 0);
              }

              // Track this client in presence
              await channel.track({
                online_at: new Date().toISOString(),
              });
            }
          });

        return () => {
          channel.unsubscribe();
        };
      } catch (err) {
        console.error('Error setting up participant count:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      }
    };

    fetchParticipantCount();

    return () => {
      // Cleanup will be handled by the channel.unsubscribe in the effect
    };
  }, [eventId]);

  return { participantCount, isLoading, error };
};
