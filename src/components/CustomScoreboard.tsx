import React, { useState, useEffect } from 'react';
import {
  Plus,
  Settings,
  Trash2,
  Edit3,
  Save,
  X,
  Type,
  Hash,
  ToggleLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#f97316',
  '#6366f1',
];

const FIELD_TYPE_ICONS = {
  score: Hash,
  text: Type,
  toggle: ToggleLeft,
};

export const CustomScoreboard: React.FC<CustomScoreboardProps> = ({
  eventId,
  isHost,
}) => {
  console.log('CustomScoreboard - isHost:', isHost);
  const [teams, setTeams] = useState<CustomTeam[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [editingTeam, setEditingTeam] = useState<CustomTeam | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  // Local state for input values to prevent constant API calls
  const [localInputValues, setLocalInputValues] = useState<
    Record<string, Record<string, any>>
  >({});

  // Scoreboard naming states
  const [scoreboardName, setScoreboardName] = useState('Leaderboard');
  const [editingTitle, setEditingTitle] = useState(false);

  // Template field creation states
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<'score' | 'text' | 'toggle'>(
    'score'
  );
  const [newFieldDefault, setNewFieldDefault] = useState<
    string | number | boolean
  >('');

  useEffect(() => {
    console.log('CustomScoreboard mounted for eventId:', eventId);
    fetchTeams();
    fetchCustomFields();

    // Set up real-time subscription for both hosts and streamers
    console.log(
      'Setting up real-time subscription for eventId:',
      eventId,
      'isHost:',
      isHost
    );
    const channelName = `custom-scoreboard-${eventId}`;
    console.log('Creating shared channel name:', channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_scoreboard',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          console.log('📊 Leaderboard real-time update received:', payload);
          console.log('Event type:', payload.eventType);
          console.log('Table:', payload.table);
          console.log('New data:', payload.new);
          console.log('Old data:', payload.old);

          // Only process Leaderboard updates
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;

          // For DELETE events, we only have limited data in 'old' record
          // Since we're filtering by event_id in the subscription, we can assume these are relevant
          if (payload.eventType === 'DELETE') {
            console.log('Processing DELETE event for Leaderboard');
          } else {
            // For INSERT/UPDATE, check scoreboard_type
            const isCustomUpdate =
              newRecord?.scoreboard_type === 'custom' ||
              oldRecord?.scoreboard_type === 'custom';
            if (!isCustomUpdate) {
              console.log('Ignoring non-Leaderboard update');
              return;
            }
          }

          if (payload.eventType === 'INSERT') {
            console.log('🆕 Adding new team to state:', payload.new);
            setTeams((prev) => {
              const newTeam = payload.new as CustomTeam;
              console.log('Current teams before insert:', prev);
              console.log('Adding team:', newTeam);
              // Check if team already exists to prevent duplicates
              const exists = prev.find((t) => t.id === newTeam.id);
              if (exists) {
                console.log('Team already exists, skipping insert');
                return prev;
              }
              const updated = [...prev, newTeam];
              console.log('Teams after insert:', updated);
              return updated;
            });
          } else if (payload.eventType === 'UPDATE') {
            console.log('🔄 Updating team in state:', payload.new.id);
            setTeams((prev) => {
              const updated = prev.map((team) =>
                team.id === payload.new.id
                  ? ({ ...team, ...payload.new } as CustomTeam)
                  : team
              );
              console.log('Teams after update:', updated);
              return updated;
            });

            // Clear local input values for this team to ensure real-time updates show immediately
            setLocalInputValues((prev) => ({
              ...prev,
              [payload.new.id]: {},
            }));
          } else if (payload.eventType === 'DELETE') {
            console.log('🗑️ Deleting team from state:', payload.old.id);
            setTeams((prev) => {
              const updated = prev.filter((team) => team.id !== payload.old.id);
              console.log('Teams after delete:', updated);
              return updated;
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`,
        },
        (payload) => {
          console.log('Real-time event update received:', payload);
          // Only update title from real-time if it's different from current local state
          if (payload.new && payload.new.metadata) {
            const metadata = payload.new.metadata as Record<string, any>;
            const newTitle = metadata?.scoreboardName;
            if (newTitle && newTitle !== scoreboardName) {
              setScoreboardName(newTitle);
            }
            // Also update custom fields if they changed
            const newFields = metadata?.customFields;
            if (
              newFields &&
              JSON.stringify(newFields) !== JSON.stringify(customFields)
            ) {
              setCustomFields(newFields);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(
          '📡 Leaderboard subscription status:',
          status,
          'isHost:',
          isHost,
          'eventId:',
          eventId
        );
        if (status === 'SUBSCRIBED') {
          console.log(
            '✅ Real-time connection established for',
            isHost ? 'HOST' : 'STREAMER',
            'on event:',
            eventId
          );
        } else if (status === 'CHANNEL_ERROR') {
          console.error(
            '❌ Real-time connection error for',
            isHost ? 'HOST' : 'STREAMER',
            'on event:',
            eventId
          );
        }
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('CustomScoreboard cleanup - removing channel');
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        'scoreboard-operations',
        {
          body: {
            action: 'fetch',
            eventId,
            scoreboardType: 'custom',
          },
        }
      );

      if (error) throw error;
      console.log('Fetched custom teams:', data);
      setTeams(Array.isArray(data) ? data : data?.teams || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchCustomFields = async () => {
    try {
      const { data: event } = await supabase
        .from('events') // FIXME: it should not be events..
        .select('metadata')
        .eq('id', eventId)
        .single();

      const metadata = event?.metadata as Record<string, any> | null;
      const fields = metadata?.customFields || [];
      console.log('Fetched custom fields:', fields);
      setCustomFields(fields);

      const title = metadata?.scoreboardName || 'Leaderboard';
      setScoreboardName(title);
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

      const currentMetadata = (event?.metadata as Record<string, any>) || {};

      const { error } = await supabase
        .from('events')
        .update({
          metadata: {
            ...currentMetadata,
            customFields: fields as any,
            scoreboardName,
          } as any,
        })
        .eq('id', eventId);

      if (error) throw error;

      setCustomFields(fields);

      // Apply new fields to all existing teams
      if (teams.length > 0) {
        await applyFieldsToAllTeams(fields);
      }

      toast({
        title: 'Success',
        description: 'Template updated successfully',
      });
    } catch (error) {
      console.error('Error saving custom fields:', error);
      toast({
        title: 'Error',
        description: 'Failed to update template',
        variant: 'destructive',
      });
    }
  };

  const updateScoreboardTitle = async (newTitle: string) => {
    try {
      const { data: eventData, error: fetchError } = await supabase
        .from('events')
        .select('metadata')
        .eq('id', eventId)
        .single();

      if (fetchError) throw fetchError;

      const currentMetadata = (eventData.metadata as Record<string, any>) || {};
      const updatedMetadata = {
        ...currentMetadata,
        scoreboardName: newTitle,
      };

      const { error } = await supabase
        .from('events')
        .update({ metadata: updatedMetadata as any })
        .eq('id', eventId);

      if (error) throw error;

      // Update local state immediately to prevent flicker
      setScoreboardName(newTitle);

      toast({
        title: 'Success',
        description: 'Scoreboard title updated',
      });
    } catch (error) {
      console.error('Error updating scoreboard title:', error);
      // Don't refetch, just keep the current state
      toast({
        title: 'Error',
        description: 'Failed to update scoreboard title',
        variant: 'destructive',
      });
    }
  };

  const applyFieldsToAllTeams = async (fields: CustomField[]) => {
    try {
      for (const team of teams) {
        const updatedFields = { ...team.custom_fields };

        // Add new fields with default values
        fields.forEach((field) => {
          if (!(field.id in updatedFields)) {
            updatedFields[field.id] =
              field.defaultValue ||
              (field.type === 'score'
                ? 0
                : field.type === 'toggle'
                  ? false
                  : '');
          }
        });

        // Remove fields that no longer exist in template
        Object.keys(updatedFields).forEach((fieldId) => {
          if (!fields.find((f) => f.id === fieldId)) {
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
      customFields.forEach((field) => {
        initialCustomFields[field.id] =
          field.defaultValue ||
          (field.type === 'score' ? 0 : field.type === 'toggle' ? false : '');
      });

      console.log('Creating team with data:', {
        action: 'create',
        eventId,
        teamName: newTeamName,
        teamColor,
        customFields: initialCustomFields,
        scoreboardType: 'custom',
      });

      const { data, error } = await supabase.functions.invoke(
        'scoreboard-operations',
        {
          body: {
            action: 'create',
            eventId,
            teamName: newTeamName,
            teamColor,
            customFields: initialCustomFields,
            scoreboardType: 'custom',
          },
        }
      );

      if (error) throw error;

      console.log('Team creation response:', data);
      setNewTeamName('');

      // Immediately fetch updated teams to ensure consistency
      await fetchTeams();

      toast({
        title: 'Success',
        description: 'Team added successfully',
      });
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: 'Error',
        description: 'Failed to add team',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTeam = async (teamId: string, updates: Partial<CustomTeam>) => {
    try {
      const { error } = await supabase.functions.invoke(
        'scoreboard-operations',
        {
          body: {
            action: 'updateTeam',
            teamId,
            ...updates,
          },
        }
      );

      if (error) throw error;
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
      console.log('🗑️ Deleting team:', teamId);

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

      console.log(
        '✅ Team deletion successful, real-time will handle state update'
      );

      // Don't update local state here - let real-time handle it
      // This prevents conflicts with the real-time DELETE event

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

  const addCustomField = () => {
    if (!newFieldLabel.trim()) return;

    const newField: CustomField = {
      id: `field_${Date.now()}`,
      label: newFieldLabel,
      type: newFieldType,
      defaultValue:
        newFieldType === 'score' ? 0 : newFieldType === 'toggle' ? false : '',
    };

    const updatedFields = [...customFields, newField];
    saveCustomFields(updatedFields);

    setNewFieldLabel('');
    setNewFieldType('score');
    setNewFieldDefault('');
  };

  const removeCustomField = (fieldId: string) => {
    const updatedFields = customFields.filter((f) => f.id !== fieldId);
    saveCustomFields(updatedFields);
  };

  // Function to handle local input changes without saving
  const handleFieldChange = (teamId: string, fieldId: string, value: any) => {
    setLocalInputValues((prev) => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        [fieldId]: value,
      },
    }));
  };

  // Function to get the current value for an input (local or from database)
  const getCurrentFieldValue = (
    teamId: string,
    fieldId: string,
    dbValue: any
  ) => {
    const localValue = localInputValues[teamId]?.[fieldId];
    return localValue !== undefined
      ? localValue
      : dbValue ||
          (customFields.find((f) => f.id === fieldId)?.type === 'score'
            ? 0
            : '');
  };

  const updateTeamField = async (
    teamId: string,
    fieldId: string,
    value: any
  ) => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;

    const updatedFields = {
      ...team.custom_fields,
      [fieldId]: value,
    };

    console.log('Updating team field:', {
      teamId,
      fieldId,
      value,
      updatedFields,
    });

    try {
      // Update database first
      const { data, error } = await supabase.functions.invoke(
        'scoreboard-operations',
        {
          body: {
            action: 'updateTeam',
            teamId,
            custom_fields: updatedFields,
            team_name: team.team_name,
            team_color: team.team_color,
            score: team.score || 0,
          },
        }
      );

      if (error) throw error;

      console.log('Team field update response:', data);

      // Update local state immediately
      setTeams((prev) =>
        prev.map((t) =>
          t.id === teamId ? { ...t, custom_fields: updatedFields } : t
        )
      );

      // Clear local input for this field after successful update
      setLocalInputValues((prev) => ({
        ...prev,
        [teamId]: {
          ...prev[teamId],
          [fieldId]: undefined,
        },
      }));

      toast({
        title: 'Success',
        description: 'Field updated',
      });
    } catch (error) {
      console.error('Error updating team field:', error);
      toast({
        title: 'Error',
        description: 'Failed to update field',
        variant: 'destructive',
      });
      // Revert optimistic update on error
      fetchTeams();
    }
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
      custom_fields: editingTeam.custom_fields,
    });

    setEditDialogOpen(false);
    setEditingTeam(null);
    toast({
      title: 'Success',
      description: 'Team updated',
    });
  };

  const renderFieldValue = (team: CustomTeam, field: CustomField) => {
    const value = team.custom_fields?.[field.id];

    if (field.type === 'toggle') {
      return (
        <div className="flex items-center gap-2">
          <Switch
            checked={Boolean(value)}
            onCheckedChange={(checked) =>
              isHost && updateTeamField(team.id, field.id, checked)
            }
            disabled={!isHost}
          />
          <span className="text-sm font-bold">{value ? 'Yes' : 'No'}</span>
        </div>
      );
    }

    if (field.type === 'score') {
      return (
        <div className="flex items-center gap-2">
          {isHost ? (
            <Input
              type="number"
              value={getCurrentFieldValue(team.id, field.id, value)}
              onChange={(e) =>
                handleFieldChange(
                  team.id,
                  field.id,
                  parseInt(e.target.value) || 0
                )
              }
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  updateTeamField(
                    team.id,
                    field.id,
                    parseInt(e.currentTarget.value) || 0
                  );
                }
              }}
              onBlur={(e) =>
                updateTeamField(
                  team.id,
                  field.id,
                  parseInt(e.target.value) || 0
                )
              }
              className="w-20"
              min="0"
              placeholder="Press Enter to save"
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
            value={getCurrentFieldValue(team.id, field.id, value)}
            onChange={(e) =>
              handleFieldChange(team.id, field.id, e.target.value)
            }
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                updateTeamField(team.id, field.id, e.currentTarget.value);
              }
            }}
            onBlur={(e) => updateTeamField(team.id, field.id, e.target.value)}
            className="max-w-40"
            placeholder="Enter text..."
          />
        ) : (
          <span className="text-sm font-bold">{value || '-'}</span>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {isHost && editingTitle ? (
              <Input
                value={scoreboardName}
                onChange={(e) => setScoreboardName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    updateScoreboardTitle(scoreboardName);
                    setEditingTitle(false);
                  }
                }}
                onBlur={() => {
                  updateScoreboardTitle(scoreboardName);
                  setEditingTitle(false);
                }}
                className="h-8 text-lg font-semibold"
                placeholder="Press Enter to save"
                autoFocus
              />
            ) : (
              <span
                className={isHost ? 'cursor-pointer hover:text-primary' : ''}
                onClick={() => isHost && setEditingTitle(true)}
                title={isHost ? 'Click to edit scoreboard name' : undefined}
              >
                {scoreboardName}
              </span>
            )}
            {isHost && !editingTitle && (
              <div title="Edit scoreboard name">
                <Edit3
                  className="h-4 w-4 ml-2 cursor-pointer hover:text-primary"
                  onClick={() => setEditingTitle(true)}
                />
              </div>
            )}
          </CardTitle>
          {/* Connection status indicator */}
          <Badge
            variant={isConnected ? 'default' : 'destructive'}
            className="ml-2"
          >
            {isConnected ? 'Live' : 'Connecting...'}
          </Badge>
        </div>

        {isHost && (
          <div className="flex gap-2">
            <Dialog
              open={templateDialogOpen}
              onOpenChange={setTemplateDialogOpen}
            >
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
                      <Select
                        value={newFieldType}
                        onValueChange={(value: any) => setNewFieldType(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="score">Score (Number)</SelectItem>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="toggle">
                            Toggle (Yes/No)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={addCustomField}
                        disabled={!newFieldLabel.trim()}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Existing fields */}
                  <div className="space-y-2">
                    <h4 className="font-semibold">Current Fields</h4>
                    {customFields.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        No custom fields added yet
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {customFields.map((field) => {
                          const IconComponent = FIELD_TYPE_ICONS[field.type];
                          return (
                            <div
                              key={field.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <IconComponent className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {field.label}
                                </span>
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
            <Button
              onClick={createTeam}
              disabled={loading || !newTeamName.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Team
            </Button>
          </div>
        )}

        {/* Teams display */}
        <div className="space-y-3">
          {teams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isHost
                ? 'No teams added yet. Add your first team above!'
                : 'No teams in this scoreboard yet.'}
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
                      <h3 className="font-semibold text-lg">
                        {team.team_name}
                      </h3>
                    </div>

                    {isHost && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(team)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTeam(team.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Template-based custom fields */}
                  {customFields.length > 0 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {customFields.map((field) => (
                          <div key={field.id} className="space-y-1">
                            <Label className="text-sm font-medium">
                              {field.label}
                            </Label>
                            {renderFieldValue(team, field)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Team-specific custom fields */}
                  {team.custom_fields &&
                    Object.entries(team.custom_fields).filter(
                      ([fieldId]) => !customFields.find((f) => f.id === fieldId)
                    ).length > 0 && (
                      <div className="space-y-3 mt-4 pt-4 border-t border-muted/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(team.custom_fields)
                            .filter(
                              ([fieldId]) =>
                                !customFields.find((f) => f.id === fieldId)
                            )
                            .map(([fieldId, value]) => {
                              // For team-specific fields, the field metadata should include the label
                              const fieldMeta =
                                typeof value === 'object' &&
                                value !== null &&
                                'label' in value
                                  ? value
                                  : null;
                              const fieldLabel =
                                fieldMeta?.label ||
                                fieldId
                                  .replace(/^team_field_/, '')
                                  .replace(/_/g, ' ');
                              const actualValue =
                                fieldMeta?.value !== undefined
                                  ? fieldMeta.value
                                  : value;
                              const fieldType =
                                fieldMeta?.type ||
                                (typeof actualValue === 'boolean'
                                  ? 'toggle'
                                  : typeof actualValue === 'number'
                                    ? 'score'
                                    : 'text');

                              return (
                                <div key={fieldId} className="space-y-1">
                                  <Label className="text-sm font-medium">
                                    {fieldLabel}
                                  </Label>
                                  {fieldType === 'toggle' ? (
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={Boolean(actualValue)}
                                        onCheckedChange={(checked) =>
                                          isHost &&
                                          updateTeamField(
                                            team.id,
                                            fieldId,
                                            fieldMeta
                                              ? { ...fieldMeta, value: checked }
                                              : checked
                                          )
                                        }
                                        disabled={!isHost}
                                      />
                                      <span className="text-sm font-bold">
                                        {actualValue ? 'Yes' : 'No'}
                                      </span>
                                    </div>
                                  ) : fieldType === 'score' ? (
                                    <div className="flex items-center gap-2">
                                      {isHost ? (
                                        <Input
                                          type="number"
                                          value={getCurrentFieldValue(
                                            team.id,
                                            fieldId,
                                            actualValue
                                          )}
                                          onChange={(e) =>
                                            handleFieldChange(
                                              team.id,
                                              fieldId,
                                              parseInt(e.target.value) || 0
                                            )
                                          }
                                          onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              const newValue =
                                                parseInt(
                                                  e.currentTarget.value
                                                ) || 0;
                                              updateTeamField(
                                                team.id,
                                                fieldId,
                                                fieldMeta
                                                  ? {
                                                      ...fieldMeta,
                                                      value: newValue,
                                                    }
                                                  : newValue
                                              );
                                            }
                                          }}
                                          onBlur={(e) => {
                                            const newValue =
                                              parseInt(e.target.value) || 0;
                                            updateTeamField(
                                              team.id,
                                              fieldId,
                                              fieldMeta
                                                ? {
                                                    ...fieldMeta,
                                                    value: newValue,
                                                  }
                                                : newValue
                                            );
                                          }}
                                          className="w-20"
                                          min="0"
                                          placeholder="Press Enter to save"
                                        />
                                      ) : (
                                        <span className="font-bold text-lg">
                                          {actualValue || 0}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <div>
                                      {isHost ? (
                                        <Input
                                          value={getCurrentFieldValue(
                                            team.id,
                                            fieldId,
                                            actualValue
                                          )}
                                          onChange={(e) =>
                                            handleFieldChange(
                                              team.id,
                                              fieldId,
                                              e.target.value
                                            )
                                          }
                                          onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              const newValue =
                                                e.currentTarget.value;
                                              updateTeamField(
                                                team.id,
                                                fieldId,
                                                fieldMeta
                                                  ? {
                                                      ...fieldMeta,
                                                      value: newValue,
                                                    }
                                                  : newValue
                                              );
                                            }
                                          }}
                                          onBlur={(e) => {
                                            const newValue = e.target.value;
                                            updateTeamField(
                                              team.id,
                                              fieldId,
                                              fieldMeta
                                                ? {
                                                    ...fieldMeta,
                                                    value: newValue,
                                                  }
                                                : newValue
                                            );
                                          }}
                                          className="max-w-40"
                                          placeholder="Enter text..."
                                        />
                                      ) : (
                                        <span className="text-sm font-bold">
                                          {actualValue || '-'}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                  {/* Empty state when no fields exist */}
                  {customFields.length === 0 &&
                    (!team.custom_fields ||
                      Object.entries(team.custom_fields).filter(
                        ([fieldId]) =>
                          !customFields.find((f) => f.id === fieldId)
                      ).length === 0) && (
                      <div className="text-sm text-muted-foreground">
                        {isHost
                          ? 'No template fields defined. Use the Template button to add fields.'
                          : 'No fields to display.'}
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
                    onChange={(e) =>
                      setEditingTeam({
                        ...editingTeam,
                        team_name: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Team Color</Label>
                  <div className="flex gap-2 mt-2">
                    {TEAM_COLORS.map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${
                          editingTeam.team_color === color
                            ? 'border-foreground'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={async () => {
                          if (!editingTeam) return;

                          // Update local state immediately for instant feedback
                          setEditingTeam({
                            ...editingTeam,
                            team_color: color,
                          });

                          // Update in database for real-time sync across all users
                          try {
                            await updateTeam(editingTeam.id, {
                              team_name: editingTeam.team_name,
                              team_color: color,
                              custom_fields: editingTeam.custom_fields,
                            });
                          } catch (error) {
                            console.error('Error updating team color:', error);
                            toast({
                              title: 'Error',
                              description: 'Failed to update team color',
                              variant: 'destructive',
                            });
                            // Revert local state on error
                            setEditingTeam({
                              ...editingTeam,
                              team_color: editingTeam.team_color,
                            });
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Template-based custom fields (read-only display) */}
                {customFields.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-base font-medium">
                      Template Fields (Read-only)
                    </Label>
                    <div className="bg-muted/30 p-3 rounded-lg space-y-2">
                      {customFields.map((field) => (
                        <div
                          key={field.id}
                          className="flex justify-between items-center"
                        >
                          <Label className="text-sm font-medium">
                            {field.label}
                          </Label>
                          <div className="text-sm text-muted-foreground">
                            {field.type === 'toggle'
                              ? editingTeam.custom_fields?.[field.id]
                                ? 'Yes'
                                : 'No'
                              : editingTeam.custom_fields?.[field.id] ||
                                (field.type === 'score' ? '0' : '-')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Team-specific custom fields */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Team-Specific Fields
                  </Label>

                  {/* Show existing team-specific fields */}
                  {editingTeam &&
                    Object.entries(editingTeam.custom_fields || {})
                      .filter(
                        ([fieldId]) =>
                          !customFields.find((f) => f.id === fieldId)
                      )
                      .map(([fieldId, value]) => {
                        // For team-specific fields, the field metadata should include the label
                        const fieldMeta =
                          typeof value === 'object' &&
                          value !== null &&
                          'label' in value
                            ? value
                            : null;
                        const fieldType =
                          fieldMeta?.type ||
                          (typeof (fieldMeta?.value || value) === 'boolean'
                            ? 'toggle'
                            : typeof (fieldMeta?.value || value) === 'number'
                              ? 'score'
                              : 'text');
                        const fieldLabel =
                          fieldMeta?.label ||
                          fieldId
                            .replace(/^team_field_/, '')
                            .replace(/_/g, ' ');
                        const actualValue =
                          fieldMeta?.value !== undefined
                            ? fieldMeta.value
                            : value;

                        return (
                          <div
                            key={fieldId}
                            className="space-y-1 p-3 border rounded-lg"
                          >
                            <div className="flex justify-between items-center">
                              <Label className="text-sm font-medium">
                                {fieldLabel}
                              </Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const updatedFields = {
                                    ...editingTeam.custom_fields,
                                  };
                                  delete updatedFields[fieldId];
                                  setEditingTeam({
                                    ...editingTeam,
                                    custom_fields: updatedFields,
                                  });
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            {fieldType === 'toggle' ? (
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={Boolean(actualValue)}
                                  onCheckedChange={(checked) =>
                                    setEditingTeam({
                                      ...editingTeam,
                                      custom_fields: {
                                        ...editingTeam.custom_fields,
                                        [fieldId]: fieldMeta
                                          ? { ...fieldMeta, value: checked }
                                          : checked,
                                      },
                                    })
                                  }
                                />
                                <span className="text-sm">
                                  {actualValue ? 'Yes' : 'No'}
                                </span>
                              </div>
                            ) : fieldType === 'score' ? (
                              <Input
                                type="number"
                                value={actualValue || 0}
                                onChange={(e) =>
                                  setEditingTeam({
                                    ...editingTeam,
                                    custom_fields: {
                                      ...editingTeam.custom_fields,
                                      [fieldId]: fieldMeta
                                        ? {
                                            ...fieldMeta,
                                            value:
                                              parseInt(e.target.value) || 0,
                                          }
                                        : parseInt(e.target.value) || 0,
                                    },
                                  })
                                }
                                min="0"
                                className="w-full"
                              />
                            ) : (
                              <Input
                                type="text"
                                value={actualValue || ''}
                                onChange={(e) =>
                                  setEditingTeam({
                                    ...editingTeam,
                                    custom_fields: {
                                      ...editingTeam.custom_fields,
                                      [fieldId]: fieldMeta
                                        ? {
                                            ...fieldMeta,
                                            value: e.target.value,
                                          }
                                        : e.target.value,
                                    },
                                  })
                                }
                                className="w-full"
                                placeholder="Enter text..."
                              />
                            )}
                          </div>
                        );
                      })}

                  {/* Add new team-specific field */}
                  <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 space-y-3">
                    <Label className="text-sm font-medium">Add New Field</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        placeholder="Field name"
                        value={newFieldLabel}
                        onChange={(e) => setNewFieldLabel(e.target.value)}
                      />
                      <Select
                        value={newFieldType}
                        onValueChange={(value: any) => setNewFieldType(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="score">Score (Number)</SelectItem>
                          <SelectItem value="toggle">
                            Toggle (Yes/No)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => {
                          if (!newFieldLabel.trim() || !editingTeam) return;

                          const fieldId = `team_field_${Date.now()}`;
                          const defaultValue =
                            newFieldType === 'score'
                              ? 0
                              : newFieldType === 'toggle'
                                ? false
                                : '';

                          // Store team-specific field with metadata including label and type
                          const fieldData = {
                            label: newFieldLabel,
                            type: newFieldType,
                            value: defaultValue,
                          };

                          setEditingTeam({
                            ...editingTeam,
                            custom_fields: {
                              ...editingTeam.custom_fields,
                              [fieldId]: fieldData,
                            },
                          });

                          setNewFieldLabel('');
                          setNewFieldType('text');
                        }}
                        disabled={!newFieldLabel.trim()}
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={saveTeamChanges}>Save Changes</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
