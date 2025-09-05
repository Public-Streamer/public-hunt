import React, { useState, useEffect } from 'react';
import { Plus, Minus, Edit3, Trash2, Settings, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CustomField {
  key: string;
  label: string;
  value: string | number;
  type: 'text' | 'number';
}

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

interface EnhancedScoreboardControlsProps {
  eventId: string;
}

const TEAM_COLORS = [
  '#ef4444',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#84cc16',
  '#6366f1',
  '#d946ef',
  '#06b6d4',
];

export const EnhancedScoreboardControls: React.FC<
  EnhancedScoreboardControlsProps
> = ({ eventId }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'number'>('text');

  useEffect(() => {
    fetchTeams();
  }, [eventId]);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        'scoreboard-operations',
        {
          body: { action: 'fetch', eventId },
        }
      );

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: 'Error',
        description: 'Failed to load scoreboard data',
        variant: 'destructive',
      });
    }
  };

  const createTeam = async () => {
    if (!newTeamName.trim()) return;

    setLoading(true);
    try {
      const teamColor = TEAM_COLORS[teams.length % TEAM_COLORS.length];

      const { error } = await supabase.functions.invoke(
        'scoreboard-operations',
        {
          body: {
            action: 'create',
            eventId,
            teamName: newTeamName.trim(),
            teamColor,
            customFields: {},
          },
        }
      );

      if (error) throw error;

      setNewTeamName('');
      fetchTeams();
      toast({
        title: 'Success',
        description: `Team "${newTeamName}" created!`,
      });
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: 'Error',
        description: 'Failed to create team',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateScore = async (teamId: string, newScore: number) => {
    try {
      const { error } = await supabase.functions.invoke(
        'scoreboard-operations',
        {
          body: {
            action: 'updateScore',
            teamId,
            score: Math.max(0, newScore),
          },
        }
      );

      if (error) throw error;

      setTeams((prev) =>
        prev.map((team) =>
          team.id === teamId ? { ...team, score: Math.max(0, newScore) } : team
        )
      );
    } catch (error) {
      console.error('Error updating score:', error);
      toast({
        title: 'Error',
        description: 'Failed to update score',
        variant: 'destructive',
      });
    }
  };

  const updateTeam = async (updatedTeam: Team) => {
    try {
      const { error } = await supabase.functions.invoke(
        'scoreboard-operations',
        {
          body: {
            action: 'updateTeam',
            teamId: updatedTeam.id,
            teamName: updatedTeam.team_name,
            score: updatedTeam.score,
            teamColor: updatedTeam.team_color,
            customFields: updatedTeam.custom_fields,
          },
        }
      );

      if (error) throw error;

      setTeams((prev) =>
        prev.map((team) => (team.id === updatedTeam.id ? updatedTeam : team))
      );

      toast({
        title: 'Success',
        description: 'Team updated successfully',
      });
    } catch (error) {
      console.error('Error updating team:', error);
      toast({
        title: 'Error',
        description: 'Failed to update team',
        variant: 'destructive',
      });
    }
  };

  const deleteTeam = async (teamId: string) => {
    try {
      const { error } = await supabase.functions.invoke(
        'scoreboard-operations',
        {
          body: {
            action: 'delete',
            teamId,
          },
        }
      );

      if (error) throw error;

      setTeams((prev) => prev.filter((team) => team.id !== teamId));
      toast({
        title: 'Success',
        description: 'Team deleted',
      });
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete team',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (team: Team) => {
    setEditingTeam({ ...team });
    const fields: CustomField[] = Object.entries(team.custom_fields || {}).map(
      ([key, value]) => ({
        key,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        value: value as string | number,
        type: typeof value === 'number' ? 'number' : 'text',
      })
    );
    setCustomFields(fields);
    setEditDialogOpen(true);
  };

  const addCustomField = () => {
    if (!newFieldLabel.trim()) return;

    const key = newFieldLabel.toLowerCase().replace(/\s+/g, '_');
    const newField: CustomField = {
      key,
      label: newFieldLabel,
      value: newFieldType === 'number' ? 0 : '',
      type: newFieldType,
    };

    setCustomFields((prev) => [...prev, newField]);
    setNewFieldLabel('');
  };

  const removeCustomField = (index: number) => {
    setCustomFields((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCustomField = (index: number, value: string | number) => {
    setCustomFields((prev) =>
      prev.map((field, i) => (i === index ? { ...field, value } : field))
    );
  };

  const saveTeamChanges = () => {
    if (!editingTeam) return;

    const customFieldsObject = customFields.reduce(
      (acc, field) => {
        acc[field.key] = field.value;
        return acc;
      },
      {} as Record<string, any>
    );

    const updatedTeam = {
      ...editingTeam,
      custom_fields: customFieldsObject,
    };

    updateTeam(updatedTeam);
    setEditDialogOpen(false);
    setEditingTeam(null);
    setCustomFields([]);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit3 className="h-5 w-5" />
          Enhanced Scoreboard Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Team */}
        <div className="flex gap-2">
          <Input
            placeholder="Team name..."
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                createTeam();
              }
            }}
            className="flex-1"
          />
          <Button
            onClick={createTeam}
            disabled={loading || !newTeamName.trim()}
            className="h-10 px-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add Team</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* Teams List */}
        <div className="space-y-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border rounded-lg"
              style={{
                borderLeftColor: team.team_color,
                borderLeftWidth: '4px',
              }}
            >
              <div className="flex-1 min-w-0 w-full sm:w-auto">
                <div className="font-medium text-sm sm:text-base">
                  {team.team_name}
                </div>
                <div
                  className="text-2xl font-bold mb-2 sm:mb-0"
                  style={{ color: team.team_color }}
                >
                  {team.score}
                </div>

                {/* Custom Fields Display */}
                {team.custom_fields &&
                  Object.keys(team.custom_fields).length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                      {Object.entries(team.custom_fields).map(
                        ([key, value]) => (
                          <div key={key} className="text-xs">
                            <span className="font-medium text-muted-foreground">
                              {key
                                .replace(/_/g, ' ')
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                              :
                            </span>
                            <span className="ml-1">{value}</span>
                          </div>
                        )
                      )}
                    </div>
                  )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateScore(team.id, team.score - 1)}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>

                  <Input
                    type="number"
                    value={team.score}
                    onChange={(e) =>
                      updateScore(team.id, parseInt(e.target.value) || 0)
                    }
                    className="w-16 h-8 px-2 text-center text-sm"
                    min="0"
                  />

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateScore(team.id, team.score + 1)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex items-center gap-1">
                  <Dialog
                    open={editDialogOpen && editingTeam?.id === team.id}
                    onOpenChange={setEditDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(team)}
                        className="h-8 w-8 p-0"
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          Edit Team: {editingTeam?.team_name}
                        </DialogTitle>
                      </DialogHeader>

                      {editingTeam && (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="teamName">Team Name</Label>
                            <Input
                              id="teamName"
                              value={editingTeam.team_name}
                              onChange={(e) =>
                                setEditingTeam((prev) =>
                                  prev
                                    ? { ...prev, team_name: e.target.value }
                                    : null
                                )
                              }
                            />
                          </div>

                          <div>
                            <Label htmlFor="teamScore">Score</Label>
                            <Input
                              id="teamScore"
                              type="number"
                              value={editingTeam.score}
                              onChange={(e) =>
                                setEditingTeam((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        score: parseInt(e.target.value) || 0,
                                      }
                                    : null
                                )
                              }
                              min="0"
                            />
                          </div>

                          <div>
                            <Label htmlFor="teamColor">Team Color</Label>
                            <div className="grid grid-cols-6 gap-2 mt-2">
                              {TEAM_COLORS.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  className={`w-8 h-8 rounded border-2 ${editingTeam.team_color === color ? 'border-foreground' : 'border-transparent'}`}
                                  style={{ backgroundColor: color }}
                                  onClick={async () => {
                                    if (!editingTeam) return;

                                    // Update local state immediately for instant feedback
                                    setEditingTeam((prev) =>
                                      prev
                                        ? { ...prev, team_color: color }
                                        : null
                                    );

                                    // Update in database for real-time sync across all users
                                    try {
                                      const { error } =
                                        await supabase.functions.invoke(
                                          'scoreboard-operations',
                                          {
                                            body: {
                                              action: 'updateTeam',
                                              teamId: editingTeam.id,
                                              teamName: editingTeam.team_name,
                                              score: editingTeam.score,
                                              teamColor: color,
                                              customFields:
                                                editingTeam.custom_fields,
                                            },
                                          }
                                        );

                                      if (error) throw error;

                                      // Update teams list to reflect change
                                      setTeams((prev) =>
                                        prev.map((team) =>
                                          team.id === editingTeam.id
                                            ? { ...team, team_color: color }
                                            : team
                                        )
                                      );
                                    } catch (error) {
                                      console.error(
                                        'Error updating team color:',
                                        error
                                      );
                                      toast({
                                        title: 'Error',
                                        description:
                                          'Failed to update team color',
                                        variant: 'destructive',
                                      });
                                      // Revert local state on error
                                      setEditingTeam((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              team_color:
                                                editingTeam.team_color,
                                            }
                                          : null
                                      );
                                    }
                                  }}
                                />
                              ))}
                            </div>
                          </div>

                          <div>
                            <Label>Custom Fields</Label>
                            <div className="space-y-2 mt-2">
                              {customFields.map((field, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2"
                                >
                                  <div className="flex-1">
                                    <Label className="text-xs">
                                      {field.label}
                                    </Label>
                                    <Input
                                      type={field.type}
                                      value={field.value}
                                      onChange={(e) =>
                                        updateCustomField(
                                          index,
                                          field.type === 'number'
                                            ? parseInt(e.target.value) || 0
                                            : e.target.value
                                        )
                                      }
                                      className="h-8"
                                    />
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeCustomField(index)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}

                              <div className="flex items-center gap-2 pt-2 border-t">
                                <Input
                                  placeholder="Field name..."
                                  value={newFieldLabel}
                                  onChange={(e) =>
                                    setNewFieldLabel(e.target.value)
                                  }
                                  className="flex-1 h-8"
                                />
                                <select
                                  value={newFieldType}
                                  onChange={(e) =>
                                    setNewFieldType(
                                      e.target.value as 'text' | 'number'
                                    )
                                  }
                                  className="h-8 px-2 border rounded"
                                >
                                  <option value="text">Text</option>
                                  <option value="number">Number</option>
                                </select>
                                <Button
                                  size="sm"
                                  onClick={addCustomField}
                                  disabled={!newFieldLabel.trim()}
                                  className="h-8 px-3"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-4">
                            <Button
                              variant="outline"
                              onClick={() => setEditDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button onClick={saveTeamChanges}>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteTeam(team.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
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
