import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Minus, Edit3, Trash2, Settings, X, Save, Target } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CoonHuntTeam {
  id: string;
  team_name: string;
  score: number;
  team_color: string;
  event_id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  custom_fields: {
    strike_points?: number;
    tree_points?: number;
    circle_points?: number;
    minus_points?: number;
    handler_name?: string;
    dog_name?: string;
    warnings_notes?: string;
    [key: string]: any;
  };
  is_editable: boolean;
}

interface CoonHuntScoreboardProps {
  eventId: string;
  isHost?: boolean;
}

const TEAM_COLORS = [
  '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
  '#14b8a6', '#f97316', '#84cc16', '#6366f1', '#d946ef', '#06b6d4'
];

export const CoonHuntScoreboard: React.FC<CoonHuntScoreboardProps> = ({ eventId, isHost = false }) => {
  const [teams, setTeams] = useState<CoonHuntTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTeam, setEditingTeam] = useState<CoonHuntTeam | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [customFields, setCustomFields] = useState<{ key: string; label: string; value: any; type: 'text' | 'number' }[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'number'>('text');
  
  // Local state for input values to prevent constant API calls
  const [localInputValues, setLocalInputValues] = useState<Record<string, Record<string, any>>>({});

  useEffect(() => {
    fetchTeams();
    
    // Set up real-time subscription for both hosts and viewers
    const channel = supabase
      .channel('coon-hunt-scoreboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_scoreboard',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          fetchTeams();
        }
      )
      .subscribe();

    return () => {
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

  const calculateTotalScore = (customFields: any) => {
    const strike = customFields?.strike_points || 0;
    const tree = customFields?.tree_points || 0;
    const circle = customFields?.circle_points || 0;
    const minus = customFields?.minus_points || 0;
    return strike + tree + circle - minus;
  };

  const createTeam = async () => {
    if (!newTeamName.trim()) return;

    setLoading(true);
    try {
      const teamColor = TEAM_COLORS[teams.length % TEAM_COLORS.length];
      const initialFields = {
        strike_points: 0,
        tree_points: 0,
        circle_points: 0,
        minus_points: 0,
        handler_name: '',
        dog_name: '',
        warnings_notes: ''
      };
      
      const { error } = await supabase.functions.invoke('scoreboard-operations', {
        body: {
          action: 'create',
          eventId,
          teamName: newTeamName.trim(),
          teamColor,
          customFields: initialFields
        }
      });

      if (error) throw error;

      setNewTeamName('');
      fetchTeams();
      toast({
        title: "Success",
        description: `Team "${newTeamName}" added to Coon Hunt scoreboard!`,
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

  const updateTeamField = async (teamId: string, field: string, value: any) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    const updatedFields = { ...team.custom_fields, [field]: value };
    const newScore = calculateTotalScore(updatedFields);

    try {
      const { error } = await supabase.functions.invoke('scoreboard-operations', {
        body: {
          action: 'updateTeam',
          teamId,
          teamName: team.team_name,
          score: newScore,
          teamColor: team.team_color,
          customFields: updatedFields
        }
      });

      if (error) throw error;
      
      // Clear local input for this field after successful save
      setLocalInputValues(prev => ({
        ...prev,
        [teamId]: {
          ...prev[teamId],
          [field]: undefined
        }
      }));

      toast({
        title: "Score Updated",
        description: `${field.replace('_points', '').replace('_', ' ')} updated successfully`,
      });
      
    } catch (error) {
      console.error('Error updating team:', error);
      toast({
        title: "Error",
        description: "Failed to update score",
        variant: "destructive",
      });
    }
  };

  // Function to handle local input changes without saving
  const handleFieldChange = (teamId: string, field: string, value: any) => {
    setLocalInputValues(prev => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        [field]: value
      }
    }));
  };

  // Function to get the current value for an input (local or from database)
  const getCurrentFieldValue = (teamId: string, field: string, dbValue: any) => {
    const localValue = localInputValues[teamId]?.[field];
    return localValue !== undefined ? localValue : (dbValue || 0);
  };

  const deleteTeam = async (teamId: string) => {
    try {
      const { error } = await supabase.functions.invoke('scoreboard-operations', {
        body: { action: 'delete', teamId }
      });

      if (error) throw error;

      setTeams(prev => prev.filter(team => team.id !== teamId));
      toast({
        title: "Success",
        description: "Team removed from scoreboard",
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

  const openEditDialog = (team: CoonHuntTeam) => {
    setEditingTeam({ ...team });
    const fields = Object.entries(team.custom_fields || {})
      .filter(([key]) => !['strike_points', 'tree_points', 'circle_points', 'minus_points', 'handler_name', 'dog_name', 'warnings_notes'].includes(key))
      .map(([key, value]) => ({
        key,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: value as string | number,
        type: typeof value === 'number' ? 'number' as const : 'text' as const
      }));
    setCustomFields(fields);
    setEditDialogOpen(true);
  };

  const addCustomField = () => {
    if (!newFieldLabel.trim()) return;

    const key = newFieldLabel.toLowerCase().replace(/\s+/g, '_');
    const newField = {
      key,
      label: newFieldLabel,
      value: newFieldType === 'number' ? 0 : '',
      type: newFieldType
    };

    setCustomFields(prev => [...prev, newField]);
    setNewFieldLabel('');
  };

  const updateCustomField = (index: number, value: string | number) => {
    setCustomFields(prev => prev.map((field, i) => 
      i === index ? { ...field, value } : field
    ));
  };

  const removeCustomField = (index: number) => {
    setCustomFields(prev => prev.filter((_, i) => i !== index));
  };

  const saveTeamChanges = async () => {
    if (!editingTeam) return;

    const customFieldsObject = customFields.reduce((acc, field) => {
      acc[field.key] = field.value;
      return acc;
    }, {} as Record<string, any>);

    const updatedFields = { ...editingTeam.custom_fields, ...customFieldsObject };
    const newScore = calculateTotalScore(updatedFields);

    try {
      const { error } = await supabase.functions.invoke('scoreboard-operations', {
        body: {
          action: 'updateTeam',
          teamId: editingTeam.id,
          teamName: editingTeam.team_name,
          score: newScore,
          teamColor: editingTeam.team_color,
          customFields: updatedFields
        }
      });

      if (error) throw error;

      setTeams(prev => prev.map(team => 
        team.id === editingTeam.id ? { ...team, ...editingTeam, custom_fields: updatedFields, score: newScore } : team
      ));
      
      toast({
        title: "Success",
        description: "Team updated successfully",
      });
    } catch (error) {
      console.error('Error updating team:', error);
      toast({
        title: "Error",
        description: "Failed to update team",
        variant: "destructive",
      });
    }

    setEditDialogOpen(false);
    setEditingTeam(null);
    setCustomFields([]);
  };

  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  if (!isHost && teams.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Host Controls */}
      {isHost && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Coon Hunt Scoreboard Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Team/Dog name..."
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
                className="px-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Team
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scoreboard Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            OMCBA Coon Hunt Scoreboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedTeams.map((team, index) => (
              <div
                key={team.id}
                className="border rounded-lg p-4"
                style={{ borderLeftColor: team.team_color, borderLeftWidth: '4px' }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  {/* Rank & Team Info */}
                  <div className="lg:col-span-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{team.team_name}</div>
                        {team.custom_fields?.dog_name && (
                          <div className="text-xs text-muted-foreground">Dog: {team.custom_fields.dog_name}</div>
                        )}
                        {team.custom_fields?.handler_name && (
                          <div className="text-xs text-muted-foreground">Handler: {team.custom_fields.handler_name}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Score Fields */}
                  <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="text-center">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Strike</div>
                      {isHost ? (
                        <Input
                          type="number"
                          value={getCurrentFieldValue(team.id, 'strike_points', team.custom_fields?.strike_points)}
                          onChange={(e) => handleFieldChange(team.id, 'strike_points', parseInt(e.target.value) || 0)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              updateTeamField(team.id, 'strike_points', parseInt(e.currentTarget.value) || null);
                            }
                          }}
                          onBlur={(e) => updateTeamField(team.id, 'strike_points', parseInt(e.target.value) || null)}
                          className="h-8 text-center"
                          min="0"
                          placeholder="Press Enter to save"
                        />
                      ) : (
                        <div className="text-lg font-bold" style={{ color: team.team_color }}>
                          {team.custom_fields?.strike_points || 0}
                        </div>
                      )}
                    </div>

                    <div className="text-center">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Tree</div>
                      {isHost ? (
                        <Input
                          type="number"
                          value={getCurrentFieldValue(team.id, 'tree_points', team.custom_fields?.tree_points)}
                          onChange={(e) => handleFieldChange(team.id, 'tree_points', parseInt(e.target.value) || 0)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              updateTeamField(team.id, 'tree_points', parseInt(e.currentTarget.value) || 0);
                            }
                          }}
                          onBlur={(e) => updateTeamField(team.id, 'tree_points', parseInt(e.target.value) || 0)}
                          className="h-8 text-center"
                          min="0"
                          placeholder="Press Enter to save"
                        />
                      ) : (
                        <div className="text-lg font-bold" style={{ color: team.team_color }}>
                          {team.custom_fields?.tree_points || 0}
                        </div>
                      )}
                    </div>

                    <div className="text-center">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Circle</div>
                      {isHost ? (
                        <Input
                          type="number"
                          value={getCurrentFieldValue(team.id, 'circle_points', team.custom_fields?.circle_points)}
                          onChange={(e) => handleFieldChange(team.id, 'circle_points', parseInt(e.target.value) || 0)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              updateTeamField(team.id, 'circle_points', parseInt(e.currentTarget.value) || 0);
                            }
                          }}
                          onBlur={(e) => updateTeamField(team.id, 'circle_points', parseInt(e.target.value) || 0)}
                          className="h-8 text-center"
                          min="0"
                          placeholder="Press Enter to save"
                        />
                      ) : (
                        <div className="text-lg font-bold" style={{ color: team.team_color }}>
                          {team.custom_fields?.circle_points || 0}
                        </div>
                      )}
                    </div>

                    <div className="text-center">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Minus</div>
                      {isHost ? (
                        <Input
                          type="number"
                          value={getCurrentFieldValue(team.id, 'minus_points', team.custom_fields?.minus_points)}
                          onChange={(e) => handleFieldChange(team.id, 'minus_points', parseInt(e.target.value) || 0)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              updateTeamField(team.id, 'minus_points', parseInt(e.currentTarget.value) || 0);
                            }
                          }}
                          onBlur={(e) => updateTeamField(team.id, 'minus_points', parseInt(e.target.value) || 0)}
                          className="h-8 text-center"
                          min="0"
                          placeholder="Press Enter to save"
                        />
                      ) : (
                        <div className="text-lg font-bold text-destructive">
                          -{team.custom_fields?.minus_points || 0}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Total Score & Actions */}
                  <div className="lg:col-span-2 flex items-center justify-between">
                    <div className="text-center">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Total</div>
                      <div className="text-2xl font-bold" style={{ color: team.team_color }}>
                        {team.score}
                      </div>
                    </div>
                    
                    {isHost && (
                      <div className="flex items-center gap-1">
                        <Dialog open={editDialogOpen && editingTeam?.id === team.id} onOpenChange={setEditDialogOpen}>
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
                              <DialogTitle>Edit Team: {editingTeam?.team_name}</DialogTitle>
                            </DialogHeader>
                            
                            {editingTeam && (
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="teamName">Team/Dog Name</Label>
                                  <Input
                                    id="teamName"
                                    value={editingTeam.team_name}
                                    onChange={(e) => setEditingTeam(prev => prev ? { ...prev, team_name: e.target.value } : null)}
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor="dogName">Dog Name</Label>
                                  <Input
                                    id="dogName"
                                    value={editingTeam.custom_fields?.dog_name || ''}
                                    onChange={(e) => setEditingTeam(prev => prev ? { 
                                      ...prev, 
                                      custom_fields: { ...prev.custom_fields, dog_name: e.target.value }
                                    } : null)}
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="handlerName">Handler Name</Label>
                                  <Input
                                    id="handlerName"
                                    value={editingTeam.custom_fields?.handler_name || ''}
                                    onChange={(e) => setEditingTeam(prev => prev ? { 
                                      ...prev, 
                                      custom_fields: { ...prev.custom_fields, handler_name: e.target.value }
                                    } : null)}
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="warnings">Warnings/Notes</Label>
                                  <Textarea
                                    id="warnings"
                                    value={editingTeam.custom_fields?.warnings_notes || ''}
                                    onChange={(e) => setEditingTeam(prev => prev ? { 
                                      ...prev, 
                                      custom_fields: { ...prev.custom_fields, warnings_notes: e.target.value }
                                    } : null)}
                                    rows={3}
                                  />
                                </div>
                                
                                <div>
                                  <Label>Team Color</Label>
                                  <div className="grid grid-cols-6 gap-2 mt-2">
                                    {TEAM_COLORS.map((color) => (
                                      <button
                                        key={color}
                                        type="button"
                                        className={`w-8 h-8 rounded border-2 ${editingTeam.team_color === color ? 'border-black' : 'border-gray-300'}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setEditingTeam(prev => prev ? { ...prev, team_color: color } : null)}
                                      />
                                    ))}
                                  </div>
                                </div>
                                
                                <div>
                                  <Label>Additional Custom Fields</Label>
                                  <div className="space-y-2 mt-2">
                                    {customFields.map((field, index) => (
                                      <div key={index} className="flex items-center gap-2">
                                        <div className="flex-1">
                                          <Label className="text-xs">{field.label}</Label>
                                          <Input
                                            type={field.type}
                                            value={field.value}
                                            onChange={(e) => updateCustomField(index, field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
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
                                        onChange={(e) => setNewFieldLabel(e.target.value)}
                                        className="flex-1 h-8"
                                      />
                                      <select
                                        value={newFieldType}
                                        onChange={(e) => setNewFieldType(e.target.value as 'text' | 'number')}
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
                    )}
                  </div>
                </div>

                {/* Warnings/Notes */}
                {team.custom_fields?.warnings_notes && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Warnings/Notes:</div>
                    <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                      {team.custom_fields.warnings_notes}
                    </div>
                  </div>
                )}

                {/* Additional Custom Fields */}
                {Object.entries(team.custom_fields || {})
                  .filter(([key]) => !['strike_points', 'tree_points', 'circle_points', 'minus_points', 'handler_name', 'dog_name', 'warnings_notes'].includes(key))
                  .length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(team.custom_fields || {})
                        .filter(([key]) => !['strike_points', 'tree_points', 'circle_points', 'minus_points', 'handler_name', 'dog_name', 'warnings_notes'].includes(key))
                        .map(([key, value]) => (
                          <div key={key} className="text-xs">
                            <span className="font-medium text-muted-foreground">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                            </span>
                            <span className="ml-1">{value}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {teams.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {isHost ? "No teams yet. Add your first team to get started!" : "No teams in this competition yet."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};