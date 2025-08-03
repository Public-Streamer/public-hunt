import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award } from 'lucide-react';
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
  custom_fields: Record<string, any>;
  is_editable: boolean;
}

interface EnhancedRealtimeScoreboardProps {
  eventId: string;
}

export const EnhancedRealtimeScoreboard: React.FC<EnhancedRealtimeScoreboardProps> = ({ eventId }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log('[Enhanced Scoreboard] Setting up realtime for event:', eventId);
    
    fetchTeams();
    
    const channel = supabase
      .channel('enhanced-scoreboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_scoreboard',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          console.log('[Enhanced Scoreboard] Realtime update received:', payload);
          
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
        console.log('[Enhanced Scoreboard] Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('[Enhanced Scoreboard] Cleaning up realtime subscription');
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

  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 1:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 2:
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return null;
    }
  };

  if (teams.length === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Trophy className="h-5 w-5" />
          Live Scoreboard
          {isConnected && (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-auto" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 sm:space-y-3">
          {sortedTeams.map((team, index) => (
            <div
              key={team.id}
              className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border transition-all duration-300 ${
                index === 0 ? 'bg-accent/20 border-l-4' : 'border-l-4'
              }`}
              style={{ 
                borderLeftColor: team.team_color,
                backgroundColor: index === 0 ? 'hsl(var(--accent) / 0.1)' : 'transparent'
              }}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-muted text-xs sm:text-sm font-bold">
                  {index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium flex items-center gap-2 text-sm sm:text-base">
                    <span className="truncate">{team.team_name}</span>
                    {getRankIcon(index)}
                  </div>
                </div>
                
                <div 
                  className="text-lg sm:text-xl font-bold"
                  style={{ color: team.team_color }}
                >
                  {team.score}
                </div>
              </div>
              
              {/* Custom Fields Display */}
              {team.custom_fields && Object.keys(team.custom_fields).length > 0 && (
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-2 sm:mt-0 sm:ml-11 text-xs">
                  {Object.entries(team.custom_fields).map(([key, value]) => (
                    <div key={key} className="flex flex-col xs:flex-row xs:items-center gap-1">
                      <span className="font-medium text-muted-foreground">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                      </span>
                      <span className="font-medium" style={{ color: team.team_color }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
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