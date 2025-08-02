import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Minus, Edit3, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
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

interface ScoreboardControlsProps {
  eventId: string;
}

const TEAM_COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
];

export const ScoreboardControls: React.FC<ScoreboardControlsProps> = ({ eventId }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTeams();
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
      toast({
        title: "Error",
        description: "Failed to load scoreboard data",
        variant: "destructive",
      });
    }
  };

  const createTeam = async () => {
    if (!newTeamName.trim()) return;

    setLoading(true);
    try {
      const teamColor = TEAM_COLORS[teams.length % TEAM_COLORS.length];
      
      const { error } = await supabase.functions.invoke('scoreboard-operations', {
        body: {
          action: 'create',
          eventId,
          teamName: newTeamName.trim(),
          teamColor
        }
      });

      if (error) throw error;

      setNewTeamName('');
      fetchTeams(); // Refresh the list
      toast({
        title: "Success",
        description: `Team "${newTeamName}" created!`,
      });
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateScore = async (teamId: string, newScore: number) => {
    try {
      const { error } = await supabase.functions.invoke('scoreboard-operations', {
        body: {
          action: 'updateScore',
          teamId,
          score: Math.max(0, newScore)
        }
      });

      if (error) throw error;
      
      // Update local state immediately for better UX
      setTeams(prev => prev.map(team => 
        team.id === teamId ? { ...team, score: Math.max(0, newScore) } : team
      ));
    } catch (error) {
      console.error('Error updating score:', error);
      toast({
        title: "Error",
        description: "Failed to update score",
        variant: "destructive",
      });
    }
  };

  const deleteTeam = async (teamId: string) => {
    try {
      const { error } = await supabase.functions.invoke('scoreboard-operations', {
        body: {
          action: 'delete',
          teamId
        }
      });

      if (error) throw error;

      setTeams(prev => prev.filter(team => team.id !== teamId));
      toast({
        title: "Success",
        description: "Team deleted",
      });
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({
        title: "Error",
        description: "Failed to delete team",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit3 className="h-5 w-5" />
          Scoreboard Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Team */}
        <div className="flex gap-2">
          <Input
            placeholder="Team name..."
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && createTeam()}
            className="flex-1"
          />
          <Button 
            onClick={createTeam} 
            disabled={loading || !newTeamName.trim()}
            className="h-9 px-3 text-sm sm:h-10 sm:px-4 sm:text-base"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Add Team</span>
            <span className="xs:hidden">Add</span>
          </Button>
        </div>

        {/* Teams List */}
        <div className="space-y-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className="flex  items-center gap-3 p-3 border rounded-lg"
              style={{ borderLeftColor: team.team_color, borderLeftWidth: '4px' }}
            >
              <div className="flex-1">
                <div className="font-medium">{team.team_name}</div>
                <div className="text-2xl font-bold" style={{ color: team.team_color }}>
                  {team.score}
                </div>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2 flex-col md:flex-row">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateScore(team.id, team.score - 1)}
                  className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                >
                  <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                
                <Input
                  type="number"
                  value={team.score}
                  onChange={(e) => updateScore(team.id, parseInt(e.target.value) || 0)}
                  className="w-16 sm:w-20 h-8 px-1 sm:px-3 text-center text-sm"
                  min="0"
                />
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateScore(team.id, team.score + 1)}
                  className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteTeam(team.id)}
                  className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {teams.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No teams yet. Create your first team to get started!
          </div>
        )}
      </CardContent>
    </Card>
  );
};