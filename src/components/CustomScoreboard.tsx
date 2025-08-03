import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { Plus, Settings, Trash2, Edit3, Save, X, Type, Hash, ToggleLeft } from 'lucide-react';
import { toast } from 'sonner';

interface CustomField {
  id: string;
  label: string;
  type: 'score' | 'text' | 'toggle';
  defaultValue?: string | number | boolean;
}

interface CustomTeam {
  id: string;
  team_name: string;
  team_color: string;
  custom_fields: Record<string, any>;
  event_id: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  is_editable?: boolean;
  score?: number;
}

interface CustomScoreboardProps {
  eventId: string;
  isHost: boolean;
}

const TEAM_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

const FIELD_TYPE_ICONS = {
  score: Hash,
  text: Type,
  toggle: ToggleLeft
};

export const CustomScoreboard: React.FC<CustomScoreboardProps> = ({ eventId, isHost }) => {
  console.log('CustomScoreboard - isHost:', isHost);
  const [teams, setTeams] = useState<CustomTeam[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [editingTeam, setEditingTeam] = useState<CustomTeam | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [fieldInputValues, setFieldInputValues] = useState<Record<string, Record<string, any>>>({});
  
  // Scoreboard naming states
  const [scoreboardName, setScoreboardName] = useState('Custom Scoreboard');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  
  // Template field creation states
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<'score' | 'text' | 'toggle'>('score');
  const [newFieldDefault, setNewFieldDefault] = useState<string | number | boolean>('');

  useEffect(() => {
    fetchTeams();
    fetchCustomFields();
    
    // Set up real-time subscription for both hosts and viewers
    const channel = supabase
      .channel(`custom_scoreboard_${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_scoreboard',
          filter: `event_id=eq.${eventId} AND scoreboard_type=eq.custom`
        },
        (payload) => {
          console.log('Custom scoreboard real-time update:', payload);
          fetchTeams();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`
        },
        () => {
          fetchCustomFields(); // Refresh metadata including scoreboard name and fields
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const fetchTeams = async () => {
    try {
      const response = await fetch('https://zmfugicftfwvuudensdo.supabase.co/functions/v1/scoreboard-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptZnVnaWNmdGZ3dnV1ZGVuc2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjU2ODUsImV4cCI6MjA2NzY0MTY4NX0.J8CA_K_oxhcd2wlQf0KvEarwi0ejq0nBgAVMEhQlXE8'
        },
        body: JSON.stringify({
          action: 'fetch',
          eventId,
          scoreboardType: 'custom'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched custom teams:', data);
        setTeams(Array.isArray(data) ? data : data.teams || []);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchCustomFields = async () => {
    try {
      const { data: event } = await supabase
        .from('events')
        .select('metadata')
        .eq('id', eventId)
        .single();

      const fields = event?.metadata?.customFields || [];
      console.log('Fetched custom fields:', fields);
      setCustomFields(fields);
      
      if (event?.metadata?.scoreboardName) {
        setScoreboardName(event.metadata.scoreboardName);
      }
    } catch (error) {
      console.error('Error fetching custom fields:', error);
    }
  };

  const saveCustomFields = async (fields: CustomField[]) => {
    try {
      // Get current metadata and preserve other fields
      const { data: event } = await supabase
        .from('events')
        .select('metadata')
        .eq('id', eventId)
        .single();

      const currentMetadata = event?.metadata || {};
      
      const { error } = await supabase
        .from('events')
        .update({
          metadata: { 
            ...currentMetadata, 
            customFields: fields,
            scoreboardName 
          }
        })
        .eq('id', eventId);

      if (error) throw error;
      
      setCustomFields(fields);
      
      // Apply new fields to all existing teams
      if (teams.length > 0) {
        await applyFieldsToAllTeams(fields);
      }
      
      toast.success('Template updated successfully');
    } catch (error) {
      console.error('Error saving custom fields:', error);
      toast.error('Failed to update template');
    }
  };

  const saveScoreboardName = async (name: string) => {
    try {
      // Get current metadata and preserve other fields
      const { data: event } = await supabase
        .from('events')
        .select('metadata')
        .eq('id', eventId)
        .single();

      const currentMetadata = event?.metadata || {};
      
      const { error } = await supabase
        .from('events')
        .update({
          metadata: { 
            ...currentMetadata, 
            scoreboardName: name 
          }
        })
        .eq('id', eventId);

      if (error) throw error;
      
      setScoreboardName(name);
      toast.success('Scoreboard name updated');
    } catch (error) {
      console.error('Error saving scoreboard name:', error);
      toast.error('Failed to update scoreboard name');
    }
  };

  const startEditingName = () => {
    setTempName(scoreboardName);
    setIsEditingName(true);
  };

  const saveNameChanges = () => {
    if (tempName.trim()) {
      saveScoreboardName(tempName.trim());
    }
    setIsEditingName(false);
  };

  const cancelNameEdit = () => {
    setTempName('');
    setIsEditingName(false);
  };

  const applyFieldsToAllTeams = async (fields: CustomField[]) => {
    try {
      for (const team of teams) {
        const updatedFields = { ...team.custom_fields };
        
        // Add new fields with default values
        fields.forEach(field => {
          if (!(field.id in updatedFields)) {
            updatedFields[field.id] = field.defaultValue || 
              (field.type === 'score' ? 0 : 
               field.type === 'toggle' ? false : '');
          }
        });

        // Remove fields that no longer exist in template
        Object.keys(updatedFields).forEach(fieldId => {
          if (!fields.find(f => f.id === fieldId)) {
            delete updatedFields[fieldId];
          }
        });

        await updateTeam(team.id, { custom_fields: updatedFields });
      }
    } catch (error) {
      console.error('Error applying fields to teams:', error);
    }
  };

  const createTeam = async () => {
    if (!newTeamName.trim()) return;

    setLoading(true);
    try {
      const colorIndex = teams.length % TEAM_COLORS.length;
      const teamColor = TEAM_COLORS[colorIndex];
      
      // Initialize custom fields with default values
      const initialCustomFields: Record<string, any> = {};
      customFields.forEach(field => {
        initialCustomFields[field.id] = field.defaultValue || 
          (field.type === 'score' ? 0 : 
           field.type === 'toggle' ? false : '');
      });

      const response = await fetch('https://zmfugicftfwvuudensdo.supabase.co/functions/v1/scoreboard-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptZnVnaWNmdGZ3dnV1ZGVuc2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjU2ODUsImV4cCI6MjA2NzY0MTY4NX0.J8CA_K_oxhcd2wlQf0KvEarwi0ejq0nBgAVMEhQlXE8'
        },
        body: JSON.stringify({
          action: 'create',
          eventId,
          teamName: newTeamName,
          teamColor,
          customFields: initialCustomFields,
          scoreboardType: 'custom'
        })
      });

      if (response.ok) {
        setNewTeamName('');
        await fetchTeams();
        toast.success('Team added successfully');
      }
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to add team');
    } finally {
      setLoading(false);
    }
  };

  const updateTeam = async (teamId: string, updates: Partial<CustomTeam>) => {
    try {
      const response = await fetch('https://zmfugicftfwvuudensdo.supabase.co/functions/v1/scoreboard-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptZnVnaWNmdGZ3dnV1ZGVuc2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjU2ODUsImV4cCI6MjA2NzY0MTY4NX0.J8CA_K_oxhcd2wlQf0KvEarwi0ejq0nBgAVMEhQlXE8'
        },
        body: JSON.stringify({
          action: 'updateTeam',
          teamId,
          ...updates
        })
      });

      if (response.ok) {
        await fetchTeams();
      }
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Failed to update team');
    }
  };

  const deleteTeam = async (teamId: string) => {
    try {
      const response = await fetch('https://zmfugicftfwvuudensdo.supabase.co/functions/v1/scoreboard-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptZnVnaWNmdGZ3dnV1ZGVuc2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjU2ODUsImV4cCI6MjA2NzY0MTY4NX0.J8CA_K_oxhcd2wlQf0KvEarwi0ejq0nBgAVMEhQlXE8'
        },
        body: JSON.stringify({
          action: 'delete',
          teamId
        })
      });

      if (response.ok) {
        await fetchTeams();
        toast.success('Team deleted');
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
    }
  };

  const addCustomField = () => {
    if (!newFieldLabel.trim()) return;

    const newField: CustomField = {
      id: `field_${Date.now()}`,
      label: newFieldLabel,
      type: newFieldType,
      defaultValue: newFieldType === 'score' ? 0 : 
                   newFieldType === 'toggle' ? false : ''
    };

    const updatedFields = [...customFields, newField];
    saveCustomFields(updatedFields);
    
    setNewFieldLabel('');
    setNewFieldType('score');
    setNewFieldDefault('');
  };

  const removeCustomField = (fieldId: string) => {
    const updatedFields = customFields.filter(f => f.id !== fieldId);
    saveCustomFields(updatedFields);
  };

  const updateTeamField = async (teamId: string, fieldId: string, value: any) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    // Update local state immediately for better UX
    setFieldInputValues(prev => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        [fieldId]: value
      }
    }));

    const updatedFields = {
      ...team.custom_fields,
      [fieldId]: value
    };

    // Update the teams state immediately
    setTeams(prev => prev.map(t => 
      t.id === teamId 
        ? { ...t, custom_fields: updatedFields }
        : t
    ));

    await updateTeam(teamId, { custom_fields: updatedFields });
  };

  const openEditDialog = (team: CustomTeam) => {
    setEditingTeam({ ...team });
    setEditDialogOpen(true);
  };

  const saveTeamChanges = async () => {
    if (!editingTeam) return;

    await updateTeam(editingTeam.id, {
      team_name: editingTeam.team_name,
      team_color: editingTeam.team_color,
      custom_fields: editingTeam.custom_fields
    });

    setEditDialogOpen(false);
    setEditingTeam(null);
    toast.success('Team updated');
  };

  const renderFieldValue = (team: CustomTeam, field: CustomField) => {
    const value = team.custom_fields?.[field.id];
    
    if (field.type === 'toggle') {
      return (
        <div className="flex items-center gap-2">
          <Switch
            checked={Boolean(value)}
            onCheckedChange={(checked) => isHost && updateTeamField(team.id, field.id, checked)}
            disabled={!isHost}
          />
          <span className="text-sm">{value ? 'Yes' : 'No'}</span>
        </div>
      );
    }
    
    if (field.type === 'score') {
      return (
        <div className="flex items-center gap-2">
          {isHost ? (
            <Input
              type="number"
              value={fieldInputValues[team.id]?.[field.id] ?? value ?? 0}
              onChange={(e) => updateTeamField(team.id, field.id, parseInt(e.target.value) || 0)}
              className="w-20"
              min="0"
            />
          ) : (
            <span className="font-bold text-lg">{value || 0}</span>
          )}
        </div>
      );
    }
    
    // Text field
    return (
      <div>
        {isHost ? (
          <Input
            value={fieldInputValues[team.id]?.[field.id] ?? value ?? ''}
            onChange={(e) => {
              console.log('Text field change:', e.target.value, 'isHost:', isHost);
              updateTeamField(team.id, field.id, e.target.value);
            }}
            className="max-w-40"
            placeholder="Enter text..."
          />
        ) : (
          <span className="text-sm">{value || '-'}</span>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') saveNameChanges();
                  if (e.key === 'Escape') cancelNameEdit();
                }}
                className="max-w-xs"
                autoFocus
              />
              <Button size="sm" variant="ghost" onClick={saveNameChanges}>
                <Save className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={cancelNameEdit}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>{scoreboardName}</span>
              {isHost && (
                <Button size="sm" variant="ghost" onClick={startEditingName}>
                  <Edit3 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </CardTitle>
        
        {isHost && (
          <div className="flex gap-2">
            <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Scoreboard Template</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Add new field */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Add New Field</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        placeholder="Field label"
                        value={newFieldLabel}
                        onChange={(e) => setNewFieldLabel(e.target.value)}
                      />
                      <Select value={newFieldType} onValueChange={(value: any) => setNewFieldType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="score">Score (Number)</SelectItem>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="toggle">Toggle (Yes/No)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={addCustomField} disabled={!newFieldLabel.trim()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Existing fields */}
                  <div className="space-y-2">
                    <h4 className="font-semibold">Current Fields</h4>
                    {customFields.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No custom fields added yet</p>
                    ) : (
                      <div className="space-y-2">
                        {customFields.map((field) => {
                          const IconComponent = FIELD_TYPE_ICONS[field.type];
                          return (
                            <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <IconComponent className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{field.label}</span>
                                <Badge variant="outline">{field.type}</Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeCustomField(field.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Add team section */}
        {isHost && (
          <div className="flex gap-2">
            <Input
              placeholder="Enter team name..."
              value={newTeamName}
              onChange={(e) => {
                console.log('Team input change:', e.target.value);
                setNewTeamName(e.target.value);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  createTeam();
                }
              }}
              className="flex-1"
              disabled={loading}
            />
            <Button onClick={createTeam} disabled={loading || !newTeamName.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Team
            </Button>
          </div>
        )}

        {/* Teams display */}
        <div className="space-y-3">
          {teams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isHost ? 'No teams added yet. Add your first team above!' : 'No teams in this scoreboard yet.'}
            </div>
          ) : (
            teams.map((team) => (
              <Card key={team.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: team.team_color }}
                      />
                      <h3 className="font-semibold text-lg">{team.team_name}</h3>
                    </div>
                    
                    {isHost && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(team)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteTeam(team.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                   {/* Custom fields */}
                   {customFields.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {customFields.map((field) => (
                         <div key={field.id} className="space-y-1">
                           <Label className="text-sm font-medium">{field.label}</Label>
                           {renderFieldValue(team, field)}
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="text-sm text-muted-foreground">
                       {(() => {
                         console.log('Custom fields debug:', { customFields, teamCustomFields: team.custom_fields, isHost });
                         return isHost ? 'No template fields defined. Use the Template button to add fields.' : 'No fields to display.';
                       })()}
                     </div>
                   )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Edit team dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Team</DialogTitle>
            </DialogHeader>
            
            {editingTeam && (
              <div className="space-y-4">
                <div>
                  <Label>Team Name</Label>
                  <Input
                    value={editingTeam.team_name}
                    onChange={(e) => setEditingTeam({
                      ...editingTeam,
                      team_name: e.target.value
                    })}
                  />
                </div>

                <div>
                  <Label>Team Color</Label>
                  <div className="flex gap-2 mt-2">
                    {TEAM_COLORS.map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${
                          editingTeam.team_color === color ? 'border-foreground' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setEditingTeam({
                          ...editingTeam,
                          team_color: color
                        })}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveTeamChanges}>
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
