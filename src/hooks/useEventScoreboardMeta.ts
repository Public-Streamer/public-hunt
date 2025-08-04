import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseEventScoreboardMetaResult {
  selectedGameType: string | null;
  scoreboardName: string | null;
  loading: boolean;
}

export const useEventScoreboardMeta = (eventId: string): UseEventScoreboardMetaResult => {
  const [selectedGameType, setSelectedGameType] = useState<string | null>(null);
  const [scoreboardName, setScoreboardName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;

    const fetchEventMeta = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('metadata')
          .eq('id', eventId)
          .single();

        if (error) {
          console.error('Error fetching event metadata:', error);
          return;
        }

        const metadata = data?.metadata as Record<string, any> || {};
        setSelectedGameType(metadata.selectedGameType || null);
        setScoreboardName(metadata.scoreboardName || null);
      } catch (error) {
        console.error('Error fetching event metadata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventMeta();

    // Set up real-time subscription for scoreboard metadata changes
    const channel = supabase
      .channel(`event-scoreboard-meta-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`
        },
        (payload) => {
          console.log('[useEventScoreboardMeta] Event metadata update:', payload);
          
          if (payload.new && payload.old) {
            const oldMetadata = payload.old.metadata as Record<string, any> || {};
            const newMetadata = payload.new.metadata as Record<string, any> || {};
            
            // Check if scoreboard-related metadata changed
            const oldGameType = oldMetadata.selectedGameType;
            const newGameType = newMetadata.selectedGameType;
            const oldScoreboardName = oldMetadata.scoreboardName;
            const newScoreboardName = newMetadata.scoreboardName;
            
            if (oldGameType !== newGameType) {
              console.log('[useEventScoreboardMeta] Game type changed:', oldGameType, '->', newGameType);
              setSelectedGameType(newGameType || null);
            }
            
            if (oldScoreboardName !== newScoreboardName) {
              console.log('[useEventScoreboardMeta] Scoreboard name changed:', oldScoreboardName, '->', newScoreboardName);
              setScoreboardName(newScoreboardName || null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  return { selectedGameType, scoreboardName, loading };
};