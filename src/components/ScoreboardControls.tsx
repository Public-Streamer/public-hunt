import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Minus, Edit3, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
      const response = await fetch('/functions/v1/scoreboard-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetch', eventId })
      });

      if (!response.ok) throw new Error('Failed to fetch teams');
      
      const data = await response.json();
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
      
      const response = await fetch('/functions/v1/scoreboard-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          eventId,
          teamName: newTeamName.trim(),
          teamColor
        })
      });

      if (!response.ok) throw new Error('Failed to create team');

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
      const response = await fetch('/functions/v1/scoreboard-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateScore',
          teamId,
          score: Math.max(0, newScore)
        })
      });

      if (!response.ok) throw new Error('Failed to update score');
      
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
      const response = await fetch('/functions/v1/scoreboard-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          teamId
        })
      });

      if (!response.ok) throw new Error('Failed to delete team');

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
          <Button onClick={createTeam} disabled={loading || !newTeamName.trim()}>
            <Plus className="h-4 w-4" />
            Add Team
          </Button>
        </div>

        {/* Teams List */}
        <div className="space-y-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className="flex items-center gap-3 p-3 border rounded-lg"
              style={{ borderLeftColor: team.team_color, borderLeftWidth: '4px' }}
            >
              <div className="flex-1">
                <div className="font-medium">{team.team_name}</div>
                <div className="text-2xl font-bold" style={{ color: team.team_color }}>
                  {team.score}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateScore(team.id, team.score - 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                
                <Input
                  type="number"
                  value={team.score}
                  onChange={(e) => updateScore(team.id, parseInt(e.target.value) || 0)}
                  className="w-20 text-center"
                  min="0"
                />
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateScore(team.id, team.score + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteTeam(team.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
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