import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseScoreboardTeamsResult {
  hasTeams: boolean;
  teamCount: number;
  loading: boolean;
}

export const useScoreboardTeams = (eventId: string, scoreboardType?: string): UseScoreboardTeamsResult => {
  const [hasTeams, setHasTeams] = useState(false);
  const [teamCount, setTeamCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;

    const fetchTeamCount = async () => {
      try {
        let query = supabase
          .from('event_scoreboard')
          .select('id', { count: 'exact' })
          .eq('event_id', eventId);

        if (scoreboardType) {
          query = query.eq('scoreboard_type', scoreboardType);
        }

        const { count, error } = await query;

        if (error) {
          console.error('Error fetching team count:', error);
          return;
        }

        const currentCount = count || 0;
        setTeamCount(currentCount);
        setHasTeams(currentCount > 0);
      } catch (error) {
        console.error('Error fetching team count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamCount();

    // Set up real-time subscription to track team count changes
    const channel = supabase
      .channel(`team-count-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_scoreboard',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          console.log('[useScoreboardTeams] Team count change:', payload);
          
          // Only process events for the specified scoreboard type (if provided)
          if (scoreboardType) {
            const newRecord = payload.new as any;
            const oldRecord = payload.old as any;
            
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              if (newRecord?.scoreboard_type !== scoreboardType) {
                return; // Ignore changes for different scoreboard types
              }
            }
            
            if (payload.eventType === 'DELETE') {
              // For DELETE events, always decrement count since filter ensures it matches our event
              setTeamCount(prev => {
                const newCount = Math.max(0, prev - 1);
                setHasTeams(newCount > 0);
                console.log('[useScoreboardTeams] DELETE - new count:', newCount);
                return newCount;
              });
              return;
            }
          }
          
          if (payload.eventType === 'INSERT') {
            setTeamCount(prev => {
              const newCount = prev + 1;
              setHasTeams(newCount > 0);
              console.log('[useScoreboardTeams] INSERT - new count:', newCount);
              return newCount;
            });
          }
          // For UPDATE, count doesn't change, just refresh to be safe
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, scoreboardType]);

  return { hasTeams, teamCount, loading };
};