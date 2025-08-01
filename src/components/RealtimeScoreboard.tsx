import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Team {
  id: string;
  team_name: string;
  score: number;
  team_color: string;
  event_id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface RealtimeScoreboardProps {
  eventId: string;
}

export const RealtimeScoreboard: React.FC<RealtimeScoreboardProps> = ({ eventId }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log('[Scoreboard] Setting up realtime for event:', eventId);
    
    // Initial fetch
    fetchTeams();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('scoreboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_scoreboard',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          console.log('[Scoreboard] Realtime update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            setTeams(prev => [...prev, payload.new as Team]);
          } else if (payload.eventType === 'UPDATE') {
            setTeams(prev => prev.map(team => 
              team.id === payload.new.id ? payload.new as Team : team
            ));
          } else if (payload.eventType === 'DELETE') {
            setTeams(prev => prev.filter(team => team.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('[Scoreboard] Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('[Scoreboard] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('scoreboard-operations', {
        body: { action: 'fetch', eventId }
      });

      if (error) throw error;
      
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  // Sort teams by score (highest first)
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  if (teams.length === 0) {
    return null; // Don't show anything if no teams exist
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Live Scoreboard
          {isConnected && (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-auto" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedTeams.map((team, index) => (
            <div
              key={team.id}
              className="flex items-center gap-3 p-3 rounded-lg border transition-all duration-300"
              style={{ 
                borderLeftColor: team.team_color, 
                borderLeftWidth: '4px',
                backgroundColor: index === 0 ? 'hsl(var(--accent))' : 'transparent'
              }}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold">
                {index + 1}
              </div>
              
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2">
                  {team.team_name}
                  {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                </div>
              </div>
              
              <div 
                className="text-2xl font-bold"
                style={{ color: team.team_color }}
              >
                {team.score}
              </div>
            </div>
          ))}
        </div>
        
        {!isConnected && (
          <div className="text-center mt-4 text-sm text-muted-foreground">
            Connecting to live updates...
          </div>
        )}
      </CardContent>
    </Card>
  );
};