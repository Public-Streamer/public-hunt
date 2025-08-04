import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Target, Edit3, Trash2, Save, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// OMCBA Coon Hunt Team Interface - Based on Official Rules
interface CoonHuntTeam {
  id: string;
  team_name: string;
  team_color: string;
  event_id: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  is_editable?: boolean;
  score: number; // Total calculated score
  custom_fields: {
    // Core OMCBA Fields
    handler_name: string;
    dog_name: string;
    registration_number?: string;
    
    // OMCBA Scoring Fields (Rule 6.A)
    strike_points: number;     // First: 100, Second: 75, Third: 50, Fourth: 25
    tree_points: number;       // First: 125, Second: 75, Third: 50, Fourth: 25
    circle_points: number;     // Points when judge cannot confirm coon presence
    minus_points: number;      // Penalties for false trees, babbling, etc.
    
    // Administrative Fields
    warnings_notes?: string;   // Judge warnings, violations, notes
    judge_comments?: string;   // Official judge remarks
    disqualified?: boolean;    // If dog has been scratched (Rule 10)
    
    // Additional custom fields for flexibility
    [key: string]: any;
  };
}

interface CoonHuntScoreboardProps {
  eventId: string;
  isHost: boolean;
}

const TEAM_COLORS = [
  '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
  '#14b8a6', '#f97316', '#84cc16', '#6366f1', '#d946ef', '#06b6d4'
];

export const CoonHuntScoreboard: React.FC<CoonHuntScoreboardProps> = ({ eventId, isHost }) => {
  // State management using the exact same pattern as CustomScoreboard
  const [teams, setTeams] = useState<CoonHuntTeam[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newHandlerName, setNewHandlerName] = useState('');
  const [newDogName, setNewDogName] = useState('');
  
  // Edit dialog state
  const [editingTeam, setEditingTeam] = useState<CoonHuntTeam | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Local input state to prevent constant API calls (critical for stability)
  const [localInputValues, setLocalInputValues] = useState<Record<string, Record<string, any>>>({});
  
  // Scoreboard naming
  const [scoreboardName, setScoreboardName] = useState('OMCBA Coon Hunt Scoreboard');
  const [editingTitle, setEditingTitle] = useState(false);

  // Real-time subscription setup (exact same pattern as CustomScoreboard)
  useEffect(() => {
    console.log('CoonHuntScoreboard mounted for eventId:', eventId);
    fetchTeams();
    fetchScoreboardTitle();
    
    // Real-time subscription with shared channel name pattern
    const channelName = `coon-hunt-scoreboard-${eventId}`;
    console.log('Creating shared channel name:', channelName);
    
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
          console.log('📊 Coon Hunt real-time update received:', payload);
          console.log('Event type:', payload.eventType);
          console.log('Table:', payload.table);
          console.log('New data:', payload.new);
          console.log('Old data:', payload.old);
          
          // Only process Coon Hunt updates
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          
          if (payload.eventType === 'DELETE') {
            console.log('Processing DELETE event for Coon Hunt');
          } else {
            const isCoonHuntUpdate = newRecord?.scoreboard_type === 'coon_hunt' || oldRecord?.scoreboard_type === 'coon_hunt';
            if (!isCoonHuntUpdate) {
              console.log('Ignoring non-Coon Hunt update');
              return;
            }
          }
          
          if (payload.eventType === 'INSERT') {
            console.log('🆕 Adding new Coon Hunt team to state:', payload.new);
            setTeams(prev => {
              const newTeam = payload.new as CoonHuntTeam;
              const exists = prev.find(t => t.id === newTeam.id);
              if (exists) {
                console.log('Team already exists, skipping insert');
                return prev;
              }
              const updated = [...prev, newTeam];
              console.log('Teams after insert:', updated);
              return updated;
            });
          } else if (payload.eventType === 'UPDATE') {
            console.log('🔄 Updating Coon Hunt team in state:', payload.new.id);
            setTeams(prev => {
              const updated = prev.map(team => 
                team.id === payload.new.id ? { ...team, ...payload.new } as CoonHuntTeam : team
              );
              console.log('Teams after update:', updated);
              return updated;
            });
            
            // Clear local input values for this team to ensure real-time updates show immediately
            setLocalInputValues(prev => ({
              ...prev,
              [payload.new.id]: {}
            }));
          } else if (payload.eventType === 'DELETE') {
            console.log('🗑️ Deleting Coon Hunt team from state:', payload.old.id);
            setTeams(prev => {
              const updated = prev.filter(team => team.id !== payload.old.id);
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
          filter: `id=eq.${eventId}`
        },
        (payload) => {
          console.log('Real-time event update received:', payload);
          if (payload.new && payload.new.metadata) {
            const metadata = payload.new.metadata as Record<string, any>;
            const newTitle = metadata?.coonHuntScoreboardName;
            if (newTitle && newTitle !== scoreboardName) {
              setScoreboardName(newTitle);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Coon Hunt subscription status:', status, 'isHost:', isHost, 'eventId:', eventId);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time connection established for', isHost ? 'HOST' : 'VIEWER', 'on event:', eventId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time connection error for', isHost ? 'HOST' : 'VIEWER', 'on event:', eventId);
        }
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('CoonHuntScoreboard cleanup - removing channel');
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('scoreboard-operations', {
        body: {
          action: 'fetch',
          eventId,
          scoreboardType: 'coon_hunt'
        }
      });

      if (error) throw error;
      console.log('Fetched Coon Hunt teams:', data);
      setTeams(Array.isArray(data) ? data : data?.teams || []);
    } catch (error) {
      console.error('Error fetching Coon Hunt teams:', error);
    }
  };

  const fetchScoreboardTitle = async () => {
    try {
      const { data: event } = await supabase
        .from('events')
        .select('metadata')
        .eq('id', eventId)
        .maybeSingle();

      const metadata = event?.metadata as Record<string, any> | null;
      const title = metadata?.coonHuntScoreboardName || 'OMCBA Coon Hunt Scoreboard';
      setScoreboardName(title);
    } catch (error) {
      console.error('Error fetching scoreboard title:', error);
    }
  };

  const updateScoreboardTitle = async (newTitle: string) => {
    try {
      const { data: eventData, error: fetchError } = await supabase
        .from('events')
        .select('metadata')
        .eq('id', eventId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const currentMetadata = (eventData?.metadata as Record<string, any>) || {};
      const updatedMetadata = {
        ...currentMetadata,
        coonHuntScoreboardName: newTitle
      };

      const { error } = await supabase
        .from('events')
        .update({ metadata: updatedMetadata as any })
        .eq('id', eventId);

      if (error) throw error;

      setScoreboardName(newTitle);

      toast({
        title: "Success",
        description: "Scoreboard title updated",
      });
    } catch (error) {
      console.error('Error updating scoreboard title:', error);
      toast({
        title: "Error",
        description: "Failed to update scoreboard title",
        variant: "destructive",
      });
    }
  };

  // OMCBA scoring calculation based on official rules
  const calculateTotalScore = (customFields: CoonHuntTeam['custom_fields']) => {
    const strike = customFields?.strike_points || 0;
    const tree = customFields?.tree_points || 0;
    const circle = customFields?.circle_points || 0;
    const minus = customFields?.minus_points || 0;
    
    // OMCBA Rule: Total = Strike + Tree + Circle - Minus
    return strike + tree + circle - minus;
  };

  const createTeam = async () => {
    if (!newTeamName.trim()) return;

    setLoading(true);
    try {
      const colorIndex = teams.length % TEAM_COLORS.length;
      const teamColor = TEAM_COLORS[colorIndex];
      
      // Initialize with OMCBA-compliant default fields
      const initialCustomFields = {
        handler_name: newHandlerName.trim(),
        dog_name: newDogName.trim(),
        registration_number: '',
        strike_points: 0,
        tree_points: 0,
        circle_points: 0,
        minus_points: 0,
        warnings_notes: '',
        judge_comments: '',
        disqualified: false
      };

      console.log('Creating Coon Hunt team with data:', {
        action: 'create',
        eventId,
        teamName: newTeamName,
        teamColor,
        customFields: initialCustomFields,
        scoreboardType: 'coon_hunt'
      });

      const { data, error } = await supabase.functions.invoke('scoreboard-operations', {
        body: {
          action: 'create',
          eventId,
          teamName: newTeamName,
          teamColor,
          customFields: initialCustomFields,
          scoreboardType: 'coon_hunt'
        }
      });

      if (error) throw error;

      console.log('Coon Hunt team creation response:', data);
      setNewTeamName('');
      setNewHandlerName('');
      setNewDogName('');
      
      // Immediately fetch updated teams to ensure consistency
      await fetchTeams();
      
      toast({
        title: "Success",
        description: `Team "${newTeamName}" added to Coon Hunt scoreboard`,
      });
    } catch (error) {
      console.error('Error creating Coon Hunt team:', error);
      toast({
        title: "Error",
        description: "Failed to add team",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTeam = async (teamId: string, updates: Partial<CoonHuntTeam>) => {
    try {
      const { error } = await supabase.functions.invoke('scoreboard-operations', {
        body: {
          action: 'updateTeam',
          teamId,
          ...updates
        }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating Coon Hunt team:', error);
      toast({
        title: "Error",
        description: "Failed to update team",
        variant: "destructive",
      });
    }
  };

  const deleteTeam = async (teamId: string) => {
    try {
      console.log('🗑️ Deleting Coon Hunt team:', teamId);
      
      const { error } = await supabase.functions.invoke('scoreboard-operations', {
        body: {
          action: 'delete',
          teamId
        }
      });

      if (error) throw error;

      console.log('✅ Coon Hunt team deletion successful, real-time will handle state update');
      
      toast({
        title: "Success",
        description: "Team deleted",
      });
    } catch (error) {
      console.error('Error deleting Coon Hunt team:', error);
      toast({
        title: "Error",
        description: "Failed to delete team",
        variant: "destructive",
      });
    }
  };

  // Local input handling (exact same pattern as CustomScoreboard)
  const handleFieldChange = (teamId: string, fieldId: string, value: any) => {
    setLocalInputValues(prev => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        [fieldId]: value
      }
    }));
  };

  const getCurrentFieldValue = (teamId: string, fieldId: string, dbValue: any) => {
    const localValue = localInputValues[teamId]?.[fieldId];
    if (localValue !== undefined) return localValue;
    
    // Return appropriate default based on field type
    if (fieldId.includes('points') || fieldId === 'score') return dbValue || 0;
    if (fieldId === 'disqualified') return dbValue || false;
    return dbValue || '';
  };

  const updateTeamField = async (teamId: string, fieldId: string, value: any) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) {
      console.error('Team not found for update:', teamId);
      return;
    }

    const updatedFields = {
      ...team.custom_fields,
      [fieldId]: value
    };

    // Recalculate total score
    const newScore = calculateTotalScore(updatedFields);

    console.log('🔄 Updating Coon Hunt team field:', { 
      teamId, 
      fieldId, 
      value, 
      currentFields: team.custom_fields,
      updatedFields, 
      newScore 
    });

    try {
      const { data, error } = await supabase.functions.invoke('scoreboard-operations', {
        body: {
          action: 'updateTeam',
          teamId,
          custom_fields: updatedFields,
          team_name: team.team_name,
          team_color: team.team_color,
          score: newScore
        }
      });

      if (error) {
        console.error('❌ Scoreboard operation error:', error);
        throw error;
      }

      console.log('✅ Coon Hunt team field update response:', data);

      // Update local state immediately
      setTeams(prev => prev.map(t => 
        t.id === teamId 
          ? { ...t, custom_fields: updatedFields, score: newScore }
          : t
      ));

      // Clear local input for this field after successful update
      setLocalInputValues(prev => ({
        ...prev,
        [teamId]: {
          ...prev[teamId],
          [fieldId]: undefined
        }
      }));

      // More specific toast messages
      const fieldName = fieldId === 'registration_number' ? 'Registration Number' :
                       fieldId === 'handler_name' ? 'Handler Name' :
                       fieldId === 'dog_name' ? 'Dog Name' :
                       fieldId === 'warnings_notes' ? 'Warnings/Notes' :
                       fieldId === 'judge_comments' ? 'Judge Comments' :
                       fieldId === 'disqualified' ? 'Team Status' :
                       fieldId.replace('_points', '').replace('_', ' ');

      toast({
        title: "Updated Successfully",
        description: `${fieldName} updated successfully`,
      });
    } catch (error) {
      console.error('❌ Error updating Coon Hunt team field:', error);
      toast({
        title: "Error",
        description: `Failed to update ${fieldId.replace('_', ' ')}`,
        variant: "destructive",
      });
      // Revert optimistic update on error
      fetchTeams();
    }
  };

  const openEditDialog = (team: CoonHuntTeam) => {
    setEditingTeam({ ...team });
    setEditDialogOpen(true);
  };

  const saveTeamChanges = async () => {
    if (!editingTeam) return;

    const newScore = calculateTotalScore(editingTeam.custom_fields);

    try {
      const { error } = await supabase.functions.invoke('scoreboard-operations', {
        body: {
          action: 'updateTeam',
          teamId: editingTeam.id,
          teamName: editingTeam.team_name,
          score: newScore,
          teamColor: editingTeam.team_color,
          customFields: editingTeam.custom_fields
        }
      });

      if (error) throw error;

      setTeams(prev => prev.map(team => 
        team.id === editingTeam.id ? { ...team, ...editingTeam, score: newScore } : team
      ));
      
      toast({
        title: "Success",
        description: "Team updated successfully",
      });
    } catch (error) {
      console.error('Error updating Coon Hunt team:', error);
      toast({
        title: "Error",
        description: "Failed to update team",
        variant: "destructive",
      });
    }

    setEditDialogOpen(false);
    setEditingTeam(null);
  };

  // Sort teams by total score (highest first)
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  // Early return for viewers when no teams
  if (!isHost && teams.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
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
                className={isHost ? "cursor-pointer hover:text-primary" : ""}
                onClick={() => isHost && setEditingTitle(true)}
                title={isHost ? "Click to edit scoreboard name" : undefined}
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
          <Badge variant={isConnected ? "default" : "destructive"} className="ml-2">
            {isConnected ? "Live" : "Connecting..."}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Host Controls - Add Team */}
        {isHost && (
          <div className="border rounded-lg p-3 sm:p-4 space-y-3">
            <h4 className="font-semibold text-sm sm:text-base">Add New Team</h4>
            <div className="flex flex-col space-y-2 sm:space-y-0 sm:grid sm:grid-cols-4 sm:gap-3">
              <Input
                placeholder="Team/Entry name..."
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    createTeam();
                  }
                }}
                disabled={loading}
                className="text-sm"
              />
              <Input
                placeholder="Handler name..."
                value={newHandlerName}
                onChange={(e) => setNewHandlerName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    createTeam();
                  }
                }}
                disabled={loading}
                className="text-sm"
              />
              <Input
                placeholder="Dog name..."
                value={newDogName}
                onChange={(e) => setNewDogName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    createTeam();
                  }
                }}
                disabled={loading}
                className="text-sm"
              />
              <Button 
                onClick={createTeam} 
                disabled={loading || !newTeamName.trim()}
                className="w-full sm:w-auto text-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Team
              </Button>
            </div>
          </div>
        )}

        {/* Teams Display */}
        {teams.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {isHost ? "No teams added yet. Add a team to start scoring." : "No teams in this hunt yet."}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedTeams.map((team, index) => (
              <Card key={team.id} className="relative">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
                    <div className="flex items-start gap-3">
                      <Badge 
                        variant="secondary" 
                        className="text-base sm:text-lg font-bold px-2 sm:px-3 py-1 shrink-0"
                        style={{ backgroundColor: `${team.team_color}20`, color: team.team_color }}
                      >
                        #{index + 1}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-base sm:text-lg break-words">{team.team_name}</h3>
                        <div className="text-xs sm:text-sm space-y-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="text-muted-foreground shrink-0">Handler:</span>
                            {isHost ? (
                              <Input
                                value={getCurrentFieldValue(team.id, 'handler_name', team.custom_fields?.handler_name)}
                                onChange={(e) => handleFieldChange(team.id, 'handler_name', e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    updateTeamField(team.id, 'handler_name', e.currentTarget.value);
                                  }
                                }}
                                onBlur={(e) => updateTeamField(team.id, 'handler_name', e.target.value)}
                                className="h-6 text-xs sm:text-sm flex-1 min-w-0"
                                placeholder="Handler name..."
                              />
                            ) : (
                              <span className="font-medium text-xs sm:text-sm break-words">{team.custom_fields?.handler_name || 'Not set'}</span>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="text-muted-foreground shrink-0">Dog:</span>
                            {isHost ? (
                              <Input
                                value={getCurrentFieldValue(team.id, 'dog_name', team.custom_fields?.dog_name)}
                                onChange={(e) => handleFieldChange(team.id, 'dog_name', e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    updateTeamField(team.id, 'dog_name', e.currentTarget.value);
                                  }
                                }}
                                onBlur={(e) => updateTeamField(team.id, 'dog_name', e.target.value)}
                                className="h-6 text-xs sm:text-sm flex-1 min-w-0"
                                placeholder="Dog name..."
                              />
                            ) : (
                              <span className="font-medium text-xs sm:text-sm break-words">{team.custom_fields?.dog_name || 'Not set'}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-4 sm:gap-2">
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold">{team.score}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Total Score</div>
                      </div>
                      
                      {isHost && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(team)} className="h-8 w-8 p-0">
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => deleteTeam(team.id)} className="h-8 w-8 p-0">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* OMCBA Scoring Grid */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {/* Strike Points */}
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm font-medium block">Strike Points</Label>
                      {isHost ? (
                        <Input
                          type="number"
                          value={getCurrentFieldValue(team.id, 'strike_points', team.custom_fields?.strike_points)}
                          onChange={(e) => handleFieldChange(team.id, 'strike_points', parseInt(e.target.value) || 0)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              updateTeamField(team.id, 'strike_points', parseInt(e.currentTarget.value) || 0);
                            }
                          }}
                          onBlur={(e) => updateTeamField(team.id, 'strike_points', parseInt(e.target.value) || 0)}
                          className="text-center font-bold text-sm sm:text-base h-10 sm:h-11"
                          min="0"
                          max="400"
                          placeholder="0"
                        />
                      ) : (
                        <div className="text-center font-bold text-base sm:text-lg p-2 sm:p-3 bg-muted rounded h-10 sm:h-11 flex items-center justify-center">
                          {team.custom_fields?.strike_points || 0}
                        </div>
                      )}
                    </div>

                    {/* Tree Points */}
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm font-medium block">Tree Points</Label>
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
                          className="text-center font-bold text-sm sm:text-base h-10 sm:h-11"
                          min="0"
                          max="500"
                          placeholder="0"
                        />
                      ) : (
                        <div className="text-center font-bold text-base sm:text-lg p-2 sm:p-3 bg-muted rounded h-10 sm:h-11 flex items-center justify-center">
                          {team.custom_fields?.tree_points || 0}
                        </div>
                      )}
                    </div>

                    {/* Circle Points */}
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm font-medium block">Circle Points</Label>
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
                          className="text-center font-bold text-sm sm:text-base h-10 sm:h-11"
                          min="0"
                          max="500"
                          placeholder="0"
                        />
                      ) : (
                        <div className="text-center font-bold text-base sm:text-lg p-2 sm:p-3 bg-muted rounded h-10 sm:h-11 flex items-center justify-center">
                          {team.custom_fields?.circle_points || 0}
                        </div>
                      )}
                    </div>

                    {/* Minus Points */}
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm font-medium text-destructive block">Minus Points</Label>
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
                          className="text-center font-bold border-destructive text-sm sm:text-base h-10 sm:h-11"
                          min="0"
                          max="1000"
                          placeholder="0"
                        />
                      ) : (
                        <div className="text-center font-bold text-base sm:text-lg p-2 sm:p-3 bg-destructive/10 text-destructive rounded h-10 sm:h-11 flex items-center justify-center">
                          {team.custom_fields?.minus_points || 0}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Viewer-only sections for warnings/notes and judge comments */}
                  {!isHost && team.custom_fields?.warnings_notes && (
                    <div className="mt-4 space-y-2">
                      <Label className="text-xs sm:text-sm font-medium text-yellow-800">Warnings/Notes:</Label>
                      <div className="p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-xs sm:text-sm text-yellow-700 break-words">{team.custom_fields.warnings_notes}</p>
                      </div>
                    </div>
                  )}

                  {!isHost && team.custom_fields?.judge_comments && (
                    <div className="mt-4 space-y-2">
                      <Label className="text-xs sm:text-sm font-medium text-blue-800">Judge Comments:</Label>
                      <div className="p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-xs sm:text-sm text-blue-700 break-words">{team.custom_fields.judge_comments}</p>
                      </div>
                    </div>
                  )}

                  {/* Viewer-only team status */}
                  {!isHost && (
                    <div className="mt-4 flex items-center gap-2">
                      <Label className="text-xs sm:text-sm font-medium">Team Status:</Label>
                      {team.custom_fields?.disqualified ? (
                        <Badge variant="destructive" className="text-xs">
                          Scratched/Disqualified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Team Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Edit Team: {editingTeam?.team_name}</DialogTitle>
            </DialogHeader>
            
            {editingTeam && (
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Team/Entry Name</Label>
                    <Input
                      value={editingTeam.team_name}
                      onChange={(e) => setEditingTeam(prev => prev ? { ...prev, team_name: e.target.value } : null)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Team Color</Label>
                    <div className="flex flex-wrap gap-2">
                      {TEAM_COLORS.map(color => (
                        <div
                          key={color}
                          className={`w-8 h-8 rounded cursor-pointer border-2 ${editingTeam.team_color === color ? 'border-foreground' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setEditingTeam(prev => prev ? { ...prev, team_color: color } : null)}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Handler & Dog Info - Real-time Editable */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Handler Name</Label>
                    <Input
                      value={editingTeam.custom_fields?.handler_name || ''}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setEditingTeam(prev => prev ? { 
                          ...prev, 
                          custom_fields: { ...prev.custom_fields, handler_name: newValue }
                        } : null);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const newValue = e.currentTarget.value;
                          updateTeamField(editingTeam.id, 'handler_name', newValue);
                        }
                      }}
                      onBlur={(e) => {
                        const newValue = e.target.value;
                        updateTeamField(editingTeam.id, 'handler_name', newValue);
                      }}
                      className="text-sm"
                      placeholder="Handler name..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Dog Name</Label>
                    <Input
                      value={editingTeam.custom_fields?.dog_name || ''}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setEditingTeam(prev => prev ? { 
                          ...prev, 
                          custom_fields: { ...prev.custom_fields, dog_name: newValue }
                        } : null);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const newValue = e.currentTarget.value;
                          updateTeamField(editingTeam.id, 'dog_name', newValue);
                        }
                      }}
                      onBlur={(e) => {
                        const newValue = e.target.value;
                        updateTeamField(editingTeam.id, 'dog_name', newValue);
                      }}
                      className="text-sm"
                      placeholder="Dog name..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Registration Number</Label>
                    <Input
                      value={editingTeam.custom_fields?.registration_number || ''}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setEditingTeam(prev => prev ? { 
                          ...prev, 
                          custom_fields: { ...prev.custom_fields, registration_number: newValue }
                        } : null);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const newValue = e.currentTarget.value;
                          updateTeamField(editingTeam.id, 'registration_number', newValue);
                        }
                      }}
                      onBlur={(e) => {
                        const newValue = e.target.value;
                        updateTeamField(editingTeam.id, 'registration_number', newValue);
                      }}
                      className="text-sm"
                      placeholder="Registration number..."
                    />
                  </div>
                </div>

                {/* Scoring - Real-time Editable */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Strike Points</Label>
                    <Input
                      type="number"
                      value={editingTeam.custom_fields?.strike_points || 0}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value) || 0;
                        setEditingTeam(prev => prev ? { 
                          ...prev, 
                          custom_fields: { ...prev.custom_fields, strike_points: newValue }
                        } : null);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const newValue = parseInt(e.currentTarget.value) || 0;
                          updateTeamField(editingTeam.id, 'strike_points', newValue);
                        }
                      }}
                      onBlur={(e) => {
                        const newValue = parseInt(e.target.value) || 0;
                        updateTeamField(editingTeam.id, 'strike_points', newValue);
                      }}
                      min="0"
                      max="400"
                      className="text-sm text-center font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Tree Points</Label>
                    <Input
                      type="number"
                      value={editingTeam.custom_fields?.tree_points || 0}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value) || 0;
                        setEditingTeam(prev => prev ? { 
                          ...prev, 
                          custom_fields: { ...prev.custom_fields, tree_points: newValue }
                        } : null);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const newValue = parseInt(e.currentTarget.value) || 0;
                          updateTeamField(editingTeam.id, 'tree_points', newValue);
                        }
                      }}
                      onBlur={(e) => {
                        const newValue = parseInt(e.target.value) || 0;
                        updateTeamField(editingTeam.id, 'tree_points', newValue);
                      }}
                      min="0"
                      max="500"
                      className="text-sm text-center font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Circle Points</Label>
                    <Input
                      type="number"
                      value={editingTeam.custom_fields?.circle_points || 0}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value) || 0;
                        setEditingTeam(prev => prev ? { 
                          ...prev, 
                          custom_fields: { ...prev.custom_fields, circle_points: newValue }
                        } : null);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const newValue = parseInt(e.currentTarget.value) || 0;
                          updateTeamField(editingTeam.id, 'circle_points', newValue);
                        }
                      }}
                      onBlur={(e) => {
                        const newValue = parseInt(e.target.value) || 0;
                        updateTeamField(editingTeam.id, 'circle_points', newValue);
                      }}
                      min="0"
                      max="500"
                      className="text-sm text-center font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-destructive">Minus Points</Label>
                    <Input
                      type="number"
                      value={editingTeam.custom_fields?.minus_points || 0}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value) || 0;
                        setEditingTeam(prev => prev ? { 
                          ...prev, 
                          custom_fields: { ...prev.custom_fields, minus_points: newValue }
                        } : null);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const newValue = parseInt(e.currentTarget.value) || 0;
                          updateTeamField(editingTeam.id, 'minus_points', newValue);
                        }
                      }}
                      onBlur={(e) => {
                        const newValue = parseInt(e.target.value) || 0;
                        updateTeamField(editingTeam.id, 'minus_points', newValue);
                      }}
                      min="0"
                      max="1000"
                      className="text-sm text-center font-bold border-destructive"
                    />
                  </div>
                </div>

                {/* Notes & Comments - Real-time Editable */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-yellow-800">Warnings/Notes</Label>
                    <Textarea
                      value={editingTeam.custom_fields?.warnings_notes || ''}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setEditingTeam(prev => prev ? { 
                          ...prev, 
                          custom_fields: { ...prev.custom_fields, warnings_notes: newValue }
                        } : null);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          const newValue = e.currentTarget.value;
                          updateTeamField(editingTeam.id, 'warnings_notes', newValue);
                        }
                      }}
                      onBlur={(e) => {
                        const newValue = e.target.value;
                        updateTeamField(editingTeam.id, 'warnings_notes', newValue);
                      }}
                      placeholder="Judge warnings, rule violations, notes... (Press Enter to save)"
                      rows={3}
                      className="text-sm resize-none border-yellow-200 bg-yellow-50/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-blue-800">Judge Comments</Label>
                    <Textarea
                      value={editingTeam.custom_fields?.judge_comments || ''}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setEditingTeam(prev => prev ? { 
                          ...prev, 
                          custom_fields: { ...prev.custom_fields, judge_comments: newValue }
                        } : null);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          const newValue = e.currentTarget.value;
                          updateTeamField(editingTeam.id, 'judge_comments', newValue);
                        }
                      }}
                      onBlur={(e) => {
                        const newValue = e.target.value;
                        updateTeamField(editingTeam.id, 'judge_comments', newValue);
                      }}
                      placeholder="Official judge remarks... (Press Enter to save)"
                      rows={2}
                      className="text-sm resize-none border-blue-200 bg-blue-50/50"
                    />
                  </div>
                </div>

                {/* Team Status - Real-time Editable */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Scratched/Disqualified:</Label>
                    <input
                      type="checkbox"
                      checked={editingTeam.custom_fields?.disqualified || false}
                      onChange={(e) => {
                        const newValue = e.target.checked;
                        setEditingTeam(prev => prev ? { 
                          ...prev, 
                          custom_fields: { ...prev.custom_fields, disqualified: newValue }
                        } : null);
                        // Immediately update the database
                        updateTeamField(editingTeam.id, 'disqualified', newValue);
                      }}
                      className="rounded border-gray-300 text-destructive focus:ring-destructive"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="flex-1 sm:flex-none text-sm">
                      <X className="h-4 w-4 mr-2" />
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};