import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseEventScoreboardMetaResult {
  selectedGameType: string | null;
  scoreboardName: string | null;
  loading: boolean;
}

export const useEventScoreboardMeta = (eventId: string): UseEventScoreboardMetaResult => {
  console.log('[useEventScoreboardMeta] Hook called with eventId:', eventId);
  
  const [selectedGameType, setSelectedGameType] = useState<string | null>(null);
  const [scoreboardName, setScoreboardName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) {
      console.log('[useEventScoreboardMeta] No eventId provided, skipping');
      setLoading(false);
      return;
    }

    console.log('[useEventScoreboardMeta] Setting up optimized subscription for eventId:', eventId);

    const fetchEventMeta = async () => {
      console.log('[useEventScoreboardMeta] Fetching initial event metadata');
      try {
        const { data, error } = await supabase
          .from('events')
          .select('metadata')
          .eq('id', eventId)
          .single();

        if (error) {
          console.error('[useEventScoreboardMeta] Error fetching event metadata:', error);
          return;
        }

        const metadata = data?.metadata as Record<string, any> || {};
        console.log('[useEventScoreboardMeta] Initial metadata:', metadata);
        
        setSelectedGameType(metadata.selectedGameType || null);
        setScoreboardName(metadata.scoreboardName || null);
      } catch (error) {
        console.error('[useEventScoreboardMeta] Error fetching event metadata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventMeta();

    // Set up real-time subscription with debouncing for scoreboard metadata changes only
    let debounceTimer: NodeJS.Timeout;
    const channel = supabase
      .channel(`scoreboard-meta-${eventId}-${Date.now()}`) // Unique channel name with timestamp
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`
        },
        (payload) => {
          console.log('[useEventScoreboardMeta] Real-time metadata update received:', payload);
          
          // Debounce rapid updates to prevent unnecessary re-renders
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            if (payload.new && payload.old) {
              const oldMetadata = payload.old.metadata as Record<string, any> || {};
              const newMetadata = payload.new.metadata as Record<string, any> || {};
              
              // Check if ONLY scoreboard-related metadata changed
              const oldGameType = oldMetadata.selectedGameType;
              const newGameType = newMetadata.selectedGameType;
              const oldScoreboardName = oldMetadata.scoreboardName;
              const newScoreboardName = newMetadata.scoreboardName;
              
              // Only update if scoreboard metadata actually changed
              if (oldGameType !== newGameType) {
                console.log('[useEventScoreboardMeta] Game type changed:', oldGameType, '->', newGameType);
                setSelectedGameType(prevType => prevType === newGameType ? prevType : (newGameType || null));
              }
              
              if (oldScoreboardName !== newScoreboardName) {
                console.log('[useEventScoreboardMeta] Scoreboard name changed:', oldScoreboardName, '->', newScoreboardName);
                setScoreboardName(prevName => prevName === newScoreboardName ? prevName : (newScoreboardName || null));
              }
            }
          }, 100); // 100ms debounce
        }
      )
      .subscribe();

    return () => {
      console.log('[useEventScoreboardMeta] Cleaning up subscription for eventId:', eventId);
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  return { selectedGameType, scoreboardName, loading };
};