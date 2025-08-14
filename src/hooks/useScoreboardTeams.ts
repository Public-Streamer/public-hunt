import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseScoreboardTeamsResult {
  hasTeams: boolean;
  teamCount: number;
  loading: boolean;
}

export const useScoreboardTeams = (eventId: string, scoreboardType?: string): UseScoreboardTeamsResult => {
  console.log('[useScoreboardTeams] Hook called with eventId:', eventId, 'scoreboardType:', scoreboardType);
  
  const [hasTeams, setHasTeams] = useState(false);
  const [teamCount, setTeamCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) {
      console.log('[useScoreboardTeams] No eventId provided, skipping');
      setLoading(false);
      return;
    }

    console.log('[useScoreboardTeams] Setting up subscription for eventId:', eventId, 'scoreboardType:', scoreboardType);

    const fetchTeamCount = async () => {
      console.log('[useScoreboardTeams] Fetching initial team count');
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
          console.error('[useScoreboardTeams] Error fetching team count:', error);
          return;
        }

        const teamCount = count || 0;
        console.log('[useScoreboardTeams] Initial team count:', teamCount);
        
        setTeamCount(teamCount);
        setHasTeams(teamCount > 0);
      } catch (error) {
        console.error('[useScoreboardTeams] Error fetching team count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamCount();

    // Set up real-time subscription with unique channel name
    const channelName = `teams-${eventId}-${scoreboardType || 'all'}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_scoreboard',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          console.log('[useScoreboardTeams] Real-time teams update received:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            const newRecord = payload.new as any;
            
            // For INSERT and UPDATE, check if the scoreboard type matches our filter
            if (scoreboardType) {
              if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                if (newRecord?.scoreboard_type !== scoreboardType) {
                  console.log('[useScoreboardTeams] Ignoring event for different scoreboard type:', newRecord?.scoreboard_type, 'vs', scoreboardType);
                  return; // Ignore changes for different scoreboard types
                }
              }
              
              if (payload.eventType === 'DELETE') {
                // For DELETE events, check if the deleted record matches our scoreboard type
                const oldRecord = payload.old as any;
                if (oldRecord?.scoreboard_type !== scoreboardType) {
                  console.log('[useScoreboardTeams] Ignoring DELETE for different scoreboard type:', oldRecord?.scoreboard_type, 'vs', scoreboardType);
                  return;
                }
              }
            }
          }
          
          if (payload.eventType === 'INSERT') {
            console.log('[useScoreboardTeams] Team inserted, updating count');
            setTeamCount(prev => {
              const newCount = prev + 1;
              setHasTeams(newCount > 0);
              return newCount;
            });
          } else if (payload.eventType === 'DELETE') {
            console.log('[useScoreboardTeams] Team deleted, updating count');
            setTeamCount(prev => {
              const newCount = Math.max(0, prev - 1);
              setHasTeams(newCount > 0);
              return newCount;
            });
          }
          // For UPDATE events, team count doesn't change, only team data
        }
      )
      .subscribe();

    return () => {
      console.log('[useScoreboardTeams] Cleaning up subscription for eventId:', eventId, 'scoreboardType:', scoreboardType);
      supabase.removeChannel(channel);
    };
  }, [eventId, scoreboardType]);

  return { hasTeams, teamCount, loading };
};