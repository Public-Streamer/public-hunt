import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Target, Edit3, Trash2, Save as SaveIcon, X, ChevronDown, ChevronUp, Dot } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// OMCBA Coon Hunt Team Interface - Based on Official Rules
interface CoonHuntTeam {
  id: string;
  team_id: string;
  teamName: string;
  team_name: string;
  team_color: string;
  event_id: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  is_editable?: boolean;
  score: number;
  custom_fields: {
    handler_name: string;
    dog_name: string;
    registration_number?: string;

    strike_points: number;
    tree_points: number;
    circle_points: number;
    minus_points: number;

    warnings_notes?: string;
    judge_comments?: string;
    disqualified?: boolean;

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

type Sign = 'plus' | 'minus';

export const CoonHuntScoreboard: React.FC<CoonHuntScoreboardProps> = ({ eventId, isHost }) => {
  const [teams, setTeams] = useState<CoonHuntTeam[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  // Edit dialog
  const [editingTeam, setEditingTeam] = useState<CoonHuntTeam | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<CoonHuntTeam | null>(null);

  // Local input state to batch-save later
  // For strike/tree we keep two keys: <field>_value (magnitude) and <field>_sign ('plus'|'minus')
  const [localInputValues, setLocalInputValues] = useState<Record<string, Record<string, any>>>({});

  // Scoreboard naming
  const [scoreboardName, setScoreboardName] = useState('Coonhound Scoreboard');
  const [editingTitle, setEditingTitle] = useState(false);

  // Viewer collapses
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTeams();
    fetchScoreboardTitle();

    const channelName = `coon-hunt-scoreboard-${eventId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_scoreboard', filter: `event_id=eq.${eventId}` },
        (payload) => {
          const n = payload.new as any;
          const o = payload.old as any;
          if (payload.eventType !== 'DELETE') {
            const isCoonHunt = n?.scoreboard_type === 'coon_hunt' || o?.scoreboard_type === 'coon_hunt';
            if (!isCoonHunt) return;
          }
          if (payload.eventType === 'INSERT') {
            setTeams(prev => (prev.find(t => t.id === n.id) ? prev : [...prev, n]));
          } else if (payload.eventType === 'UPDATE') {
            setTeams(prev => prev.map(t => (t.id === n.id ? { ...t, ...n } : t)));
            setLocalInputValues(prev => ({ ...prev, [n.id]: {} })); // clear pending for this team
          } else if (payload.eventType === 'DELETE') {
            setTeams(prev => prev.filter(t => t.id !== o.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'events', filter: `id=eq.${eventId}` },
        (payload) => {
          const metadata = payload.new?.metadata as Record<string, any> | undefined;
          const newTitle = metadata?.coonHuntScoreboardName;
          if (newTitle && newTitle !== scoreboardName) setScoreboardName(newTitle);
        }
      )
      .subscribe((status) => setIsConnected(status === 'SUBSCRIBED'));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('scoreboard-operations', {
        body: { action: 'fetch', eventId, scoreboardType: 'coon_hunt' }
      });
      if (error) throw error;
      setTeams(Array.isArray(data) ? data : data?.teams || []);
    } catch (error) {
      console.error('Error fetching Coon Hunt teams:', error);
    }
  };

  const fetchScoreboardTitle = async () => {
    try {
      const { data: event } = await supabase
        .from('events').select('metadata').eq('id', eventId).maybeSingle();
      const metadata = event?.metadata as Record<string, any> | null;
      setScoreboardName(metadata?.coonHuntScoreboardName || 'Coonhound Scoreboard');
    } catch (error) {
      console.error('Error fetching scoreboard title:', error);
    }
  };

  const updateScoreboardTitle = async (newTitle: string) => {
    try {
      const { data: eventData, error: fetchError } = await supabase
        .from('events').select('metadata').eq('id', eventId).maybeSingle();
      if (fetchError) throw fetchError;

      const currentMetadata = (eventData?.metadata as Record<string, any>) || {};
      const updatedMetadata = { ...currentMetadata, coonHuntScoreboardName: newTitle };

      const { error } = await supabase
        .from('events').update({ metadata: updatedMetadata as any }).eq('id', eventId);
      if (error) throw error;

      setScoreboardName(newTitle);
      toast({ title: 'Success', description: 'Scoreboard title updated' });
    } catch (error) {
      console.error('Error updating scoreboard title:', error);
      toast({ title: 'Error', description: 'Failed to update scoreboard title', variant: 'destructive' });
    }
  };

  // Total = (±strike) + (±tree) - minus ; circle not counted (consistent with your current logic)
  const calculateTotalScore = (cf: CoonHuntTeam['custom_fields']) => {
    const strike = Number(cf?.strike_points || 0);
    const tree = Number(cf?.tree_points || 0);
    const minus = Number(cf?.minus_points || 0);
    return strike + tree - minus;
  };

  const createTeam = async () => {
    if (!newTeamName.trim()) return;
    setLoading(true);
    try {
      const teamColor = TEAM_COLORS[teams.length % TEAM_COLORS.length];
      const initialCustomFields = {
        handler_name: '',
        dog_name: '',
        registration_number: '',
        strike_points: 0,
        tree_points: 0,
        circle_points: 0,
        minus_points: 0,
        warnings_notes: '',
        judge_comments: '',
        disqualified: false
      };

      const { error } = await supabase.functions.invoke('scoreboard-operations', {
        body: { action: 'create', eventId, teamName: newTeamName, teamColor, customFields: initialCustomFields, scoreboardType: 'coon_hunt' }
      });
      if (error) throw error;

      setNewTeamName('');
      await fetchTeams();
      toast({ title: 'Success', description: `Team "${newTeamName}" added` });
    } catch (error) {
      console.error('Error creating Coon Hunt team:', error);
      toast({ title: 'Error', description: 'Failed to add team', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const deleteTeam = async (teamId: string) => {
    try {
      const { error } = await supabase.functions.invoke('scoreboard-operations', {
        body: { action: 'delete', teamId }
      });
      if (error) throw error;
      toast({ title: 'Success', description: 'Team deleted' });
    } catch (error) {
      console.error('Error deleting Coon Hunt team:', error);
      toast({ title: 'Error', description: 'Failed to delete team', variant: 'destructive' });
    }
  };

  // ---------- Helpers for +/- logic (strike & tree) ----------
  const getSignedDisplay = (team: CoonHuntTeam, field: 'strike_points' | 'tree_points') => {
    const tId = team.id;
    const pending = localInputValues[tId] || {};
    const valKey = `${field}_value`;
    const signKey = `${field}_sign`;

    let sign: Sign;
    let magnitude: number;

    if (pending[valKey] !== undefined || pending[signKey] !== undefined) {
      // Use local pending
      const rawMag = Number(pending[valKey] ?? 0);
      const rawSign = (pending[signKey] as Sign) || (rawMag < 0 ? 'minus' : 'plus');
      sign = rawSign;
      magnitude = Math.abs(rawMag);
    } else {
      // Derive from DB
      const dbVal = Number(team.custom_fields?.[field] || 0);
      sign = dbVal < 0 ? 'minus' : 'plus';
      magnitude = Math.abs(dbVal);
    }
    return { magnitude, sign };
  };

  const setSignedMagnitude = (teamId: string, field: 'strike_points' | 'tree_points', magnitude: number) => {
    const valKey = `${field}_value`;
    setLocalInputValues(prev => ({ ...prev, [teamId]: { ...(prev[teamId] || {}), [valKey]: magnitude } }));
  };

  const setSignedSign = (teamId: string, field: 'strike_points' | 'tree_points', sign: Sign) => {
    const signKey =  `${field}_sign`;
    setLocalInputValues(prev => ({ ...prev, [teamId]: { ...(prev[teamId] || {}), [signKey]: sign } }));
  };

  // Generic local field change (other fields)
  const handleFieldChange = (teamId: string, fieldId: string, value: any) => {
    setLocalInputValues(prev => ({ ...prev, [teamId]: { ...(prev[teamId] || {}), [fieldId]: value } }));
  };

  const teamHasPending = (teamId: string) => {
    const pending = localInputValues[teamId];
    return !!pending && Object.keys(pending).length > 0;
  };

  // Assemble updated fields with sign validation for strike/tree
  const buildUpdatedFields = (team: CoonHuntTeam, pending: Record<string, any>) => {
    const cf = { ...team.custom_fields };
  
    // STRIKE
    if (pending['strike_points_value'] !== undefined || pending['strike_points_sign'] !== undefined) {
      if (pending['strike_points_value'] === undefined) {
        throw new Error('Enter a Strike Points value.');
      }
      const s: 'plus' | 'minus' = (pending['strike_points_sign'] ?? 'plus');
      const mag = Number(pending['strike_points_value'] || 0);
      cf.strike_points = (s === 'minus' ? -1 : 1) * mag;
    }
  
    // TREE
    if (pending['tree_points_value'] !== undefined || pending['tree_points_sign'] !== undefined) {
      if (pending['tree_points_value'] === undefined) {
        throw new Error('Enter a Tree Points value.');
      }
      const s: 'plus' | 'minus' = (pending['tree_points_sign'] ?? 'plus');
      const mag = Number(pending['tree_points_value'] || 0);
      cf.tree_points = (s === 'minus' ? -1 : 1) * mag;
    }
  
    // Other simple fields (circle/minus/notes/judge/disqualified/etc.)
    Object.entries(pending).forEach(([k, v]) => {
      if (k.endsWith('_value') || k.endsWith('_sign')) return; // handled above
      if (k === 'minus_points' || k === 'circle_points') {
        cf[k] = Number(v || 0);
      } else {
        (cf as any)[k] = v;
      }
    });
  
    return cf;
  };
  

  // Save one team
  const saveTeamPending = async (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    const pending = localInputValues[teamId] || {};
    if (Object.keys(pending).length === 0) return;

    let updatedFields: CoonHuntTeam['custom_fields'];
    try {
      updatedFields = buildUpdatedFields(team, pending);
    } catch (e: any) {
      toast({ title: 'Missing sign', description: e.message, variant: 'destructive' });
      return;
    }

    const newScore = calculateTotalScore(updatedFields);

    try {
      const { error } = await supabase.functions.invoke('scoreboard-operations', {
        body: {
          action: 'updateTeam',
          teamId: team.id,
          custom_fields: updatedFields,
          team_name: team.team_name,
          team_color: team.team_color,
          score: newScore
        }
      });
      if (error) throw error;

      setTeams(prev => prev.map(t => (t.id === team.id ? { ...t, custom_fields: updatedFields, score: newScore } : t)));
      setLocalInputValues(prev => ({ ...prev, [teamId]: {} }));
      toast({ title: 'Saved', description: `Saved changes for "${team.team_name}"` });
    } catch (error) {
      console.error('Error saving team changes:', error);
      toast({ title: 'Error', description: 'Failed to save changes', variant: 'destructive' });
      fetchTeams();
    }
  };

  const hasAnyPending = useMemo(() => Object.values(localInputValues).some(obj => obj && Object.keys(obj).length > 0), [localInputValues]);

  // Save all
  const saveAllPending = async () => {
    const entries = Object.entries(localInputValues).filter(([, v]) => v && Object.keys(v).length > 0);
    if (entries.length === 0) return;

    try {
      for (const [teamId, changes] of entries) {
        const team = teams.find(t => t.id === teamId);
        if (!team) continue;

        let updatedFields: CoonHuntTeam['custom_fields'];
        try {
          updatedFields = buildUpdatedFields(team, changes);
        } catch (e: any) {
          toast({ title: 'Missing sign', description: `Team "${team?.team_name}": ${e.message}`, variant: 'destructive' });
          return; // stop batch to let host fix
        }

        const newScore = calculateTotalScore(updatedFields);
        const { error } = await supabase.functions.invoke('scoreboard-operations', {
          body: { action: 'updateTeam', teamId, custom_fields: updatedFields, team_name: team.team_name, team_color: team.team_color, score: newScore }
        });
        if (error) throw error;

        setTeams(prev => prev.map(t => (t.id === teamId ? { ...t, custom_fields: updatedFields, score: newScore } : t)));
      }

      setLocalInputValues({});
      toast({ title: 'Saved', description: `Saved ${entries.length} team${entries.length > 1 ? 's' : ''}` });
    } catch (error) {
      console.error('Error saving all changes:', error);
      toast({ title: 'Error', description: 'Failed to save all changes', variant: 'destructive' });
      fetchTeams();
    }
  };

  const openEditDialog = (team: CoonHuntTeam) => {
    setEditingTeam(team);
    setEditingDraft(JSON.parse(JSON.stringify(team)));
    setEditDialogOpen(true);
  };
  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setEditingTeam(null);
    setEditingDraft(null);
  };

  const saveTeamChangesFromDialog = async () => {
    if (!editingDraft) return;

    // no strike/tree in dialog, only notes/status/name/color; keep numeric as-is
    const cf = {
      ...editingDraft.custom_fields,
      strike_points: Number(editingDraft.custom_fields?.strike_points || 0),
      tree_points: Number(editingDraft.custom_fields?.tree_points || 0),
      circle_points: Number(editingDraft.custom_fields?.circle_points || 0),
      minus_points: Number(editingDraft.custom_fields?.minus_points || 0),
    };

    const newScore = calculateTotalScore(cf);

    try {
      const { error } = await supabase.functions.invoke('scoreboard-operations', {
        body: {
          action: 'updateTeam',
          teamId: editingDraft.id,
          custom_fields: cf,
          team_name: editingDraft.team_name,
          team_color: editingDraft.team_color,
          score: newScore,
        },
      });
      if (error) throw error;

      setTeams(prev => prev.map(t => (t.id === editingDraft.id ? { ...t, ...editingDraft, custom_fields: cf, score: newScore } : t)));
      toast({ title: 'Success', description: 'Team updated successfully' });
      closeEditDialog();
    } catch (error) {
      console.error('Error updating Coon Hunt team:', error);
      toast({ title: 'Error', description: 'Failed to update team', variant: 'destructive' });
    }
  };

  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
  const toggleTeamExpanded = (teamId: string) => setExpandedTeams(prev => { const s = new Set(prev); s.has(teamId) ? s.delete(teamId) : s.add(teamId); return s; });
  const isTeamExpanded = (teamId: string) => expandedTeams.has(teamId);

  if (!isHost && teams.length === 0) return null;

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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); updateScoreboardTitle(scoreboardName); setEditingTitle(false); }
                }}
                onBlur={() => { updateScoreboardTitle(scoreboardName); setEditingTitle(false); }}
                className="h-8 text-lg font-semibold"
                placeholder="Press Enter to save"
                autoFocus
              />
            ) : (
              <span className={isHost ? 'cursor-pointer hover:text-primary' : ''} onClick={() => isHost && setEditingTitle(true)} title={isHost ? 'Click to edit scoreboard name' : undefined}>
                {scoreboardName}
              </span>
            )}
            {isHost && !editingTitle && (
              <div title="Edit scoreboard name">
                <Edit3 className="h-4 w-4 ml-2 cursor-pointer hover:text-primary" onClick={() => setEditingTitle(true)} />
              </div>
            )}
          </CardTitle>
          <Badge variant={isConnected ? 'default' : 'destructive'} className="ml-2">
            {isConnected ? 'Live' : 'Connecting...'}
          </Badge>
        </div>

        {isHost && hasAnyPending && (
          <Button size="sm" onClick={saveAllPending} className="gap-2">
            <SaveIcon className="h-4 w-4" />
            Save All
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Host Controls - Add Team */}
        {isHost && (
          <div className="border rounded-lg p-3 sm:p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h4 className="font-semibold text-sm sm:text-base">Add New Team</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Team/Entry name..."
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); createTeam(); } }}
                  disabled={loading}
                  className="text-sm"
                />
                <Button onClick={createTeam} disabled={loading || !newTeamName.trim()} className="text-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Teams */}
        {teams.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {isHost ? 'No teams added yet. Add a team to start scoring.' : 'No teams in this hunt yet.'}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedTeams.map((team, index) => {
              const pending = localInputValues[team.id] || {};
              const hasPending = Object.keys(pending).length > 0;

              const strikeUI = getSignedDisplay(team, 'strike_points');
              const treeUI = getSignedDisplay(team, 'tree_points');

              return (
                <Collapsible key={team.id} open={isHost || isTeamExpanded(team.id)} onOpenChange={() => !isHost && toggleTeamExpanded(team.id)} className="relative">
                  <Card>
                    <CardContent className="p-3 sm:p-4">
                      <CollapsibleTrigger asChild>
                        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0 ${!isHost ? 'cursor-pointer hover:bg-muted/30 -m-1 p-1 rounded' : ''}`}>
                          <div className="flex items-start gap-3">
                            <Badge variant="secondary" className="text-base sm:text-lg font-bold px-2 sm:px-3 py-1 shrink-0" style={{ backgroundColor: `${team.team_color}20`, color: team.team_color }}>
                              #{index + 1}
                            </Badge>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 justify-between">
                                <h3 className="font-bold text-base sm:text-lg break-words flex items-center gap-1">
                                  {team.team_name}
                                  {isHost && hasPending && (
                                    <span className="inline-flex items-center text-xs text-amber-600">
                                      <Dot className="h-4 w-4" />
                                      unsaved
                                    </span>
                                  )}
                                </h3>
                                {!isHost && (
                                  <div className="flex items-center gap-2">
                                    {isTeamExpanded(team.id) ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                  </div>
                                )}
                              </div>

                              {/* Compact viewer info */}
                              {!isHost && !isTeamExpanded(team.id) && (
                                <div className="text-xs sm:text-sm space-y-1 mt-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">Handler:</span>
                                    <span className="font-medium">{team.custom_fields?.handler_name || 'Not set'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">Status:</span>
                                    {team.custom_fields?.disqualified ? (
                                      <Badge variant="destructive" className="text-xs">Scratched/Disqualified</Badge>
                                    ) : (
                                      <Badge variant="secondary" className="text-xs">Active</Badge>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Expanded/Host info */}
                              {(isHost || isTeamExpanded(team.id)) && (
                                <div className="text-xs sm:text-sm space-y-1">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                    <span className="text-muted-foreground shrink-0">Handler:</span>
                                    <span className="font-medium text-xs sm:text-sm break-words">{team.custom_fields?.handler_name || 'Not set'}</span>
                                  </div>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                    <span className="text-muted-foreground shrink-0">Dog:</span>
                                    <span className="font-medium text-xs sm:text-sm break-words">{team.custom_fields?.dog_name || 'Not set'}</span>
                                  </div>
                                  {team.custom_fields?.registration_number && (
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                      <span className="text-muted-foreground shrink-0">Registration:</span>
                                      <span className="font-medium text-xs sm:text-sm break-words">{team.custom_fields.registration_number}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-4 sm:gap-2">
                            <div className="text-center">
                              <div className="text-xl sm:text-2xl font-bold">{team.score}</div>
                              <div className="text-xs sm:text-sm text-muted-foreground">Total Score</div>
                            </div>

                            {isHost && (
                              <div className="flex gap-2">
                                {hasPending && (
                                  <Button variant="default" size="sm" onClick={(e) => { e.stopPropagation(); saveTeamPending(team.id); }} className="h-8 px-2 gap-1" title="Save changes for this team">
                                    <SaveIcon className="h-3 w-3" />
                                    Save
                                  </Button>
                                )}
                                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openEditDialog(team); }} className="h-8 w-8 p-0" title="Open edit dialog">
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); deleteTeam(team.id); }} className="h-8 w-8 p-0" title="Delete team">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="space-y-4 animate-fade-in">
                        {/*  Scoring Grid */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          {/* Strike Points (+/- required) */}
                          <div className="space-y-2">
                            <Label className="text-xs sm:text-sm font-medium block">Strike Points</Label>
                            {isHost ? (
                              <div className="flex gap-2">
                                <div className="inline-flex border rounded overflow-hidden">
                                  <Button
                                    type="button"
                                    variant={strikeUI.sign === 'plus' ? 'default' : 'outline'}
                                    className="h-10 sm:h-11 rounded-none"
                                    onClick={() => setSignedSign(team.id, 'strike_points', 'plus')}
                                  >
                                    +
                                  </Button>
                                  <Button
                                    type="button"
                                    variant={strikeUI.sign === 'minus' ? 'default' : 'outline'}
                                    className="h-10 sm:h-11 rounded-none"
                                    onClick={() => setSignedSign(team.id, 'strike_points', 'minus')}
                                  >
                                    –
                                  </Button>
                                </div>
                                <Input
                                  inputMode="numeric"
                                  value={String(strikeUI.magnitude)}
                                  onChange={(e) => setSignedMagnitude(team.id, 'strike_points', Math.max(0, parseInt(e.target.value || '0') || 0))}
                                  className="text-center font-bold text-sm sm:text-base h-10 sm:h-11 w-24"
                                  placeholder="0"
                                />
                              </div>
                            ) : (
                              <div className="text-center font-bold text-base sm:text-lg p-2 sm:p-3 bg-muted rounded h-10 sm:h-11 flex items-center justify-center">
                                {team.custom_fields?.strike_points || 0}
                              </div>
                            )}
                          </div>

                          {/* Tree Points (+/- required) */}
                          <div className="space-y-2">
                            <Label className="text-xs sm:text-sm font-medium block">Tree Points</Label>
                            {isHost ? (
                              <div className="flex gap-2">
                                <div className="inline-flex border rounded overflow-hidden">
                                  <Button
                                    type="button"
                                    variant={treeUI.sign === 'plus' ? 'default' : 'outline'}
                                    className="h-10 sm:h-11 rounded-none"
                                    onClick={() => setSignedSign(team.id, 'tree_points', 'plus')}
                                  >
                                    +
                                  </Button>
                                  <Button
                                    type="button"
                                    variant={treeUI.sign === 'minus' ? 'default' : 'outline'}
                                    className="h-10 sm:h-11 rounded-none"
                                    onClick={() => setSignedSign(team.id, 'tree_points', 'minus')}
                                  >
                                    –
                                  </Button>
                                </div>
                                <Input
                                  inputMode="numeric"
                                  value={String(treeUI.magnitude)}
                                  onChange={(e) => setSignedMagnitude(team.id, 'tree_points', Math.max(0, parseInt(e.target.value || '0') || 0))}
                                  className="text-center font-bold text-sm sm:text-base h-10 sm:h-11 w-24"
                                  placeholder="0"
                                />
                              </div>
                            ) : (
                              <div className="text-center font-bold text-base sm:text-lg p-2 sm:p-3 bg-muted rounded h-10 sm:h-11 flex items-center justify-center">
                                {team.custom_fields?.tree_points || 0}
                              </div>
                            )}
                          </div>

                          {/* Circle Points (no +/- selector) */}
                          <div className="space-y-2">
                            <Label className="text-xs sm:text-sm font-medium block">Circle Points</Label>
                            {isHost ? (
                              <Input
                                inputMode="numeric"
                                value={localInputValues[team.id]?.['circle_points'] ?? team.custom_fields?.circle_points ?? 0}
                                onChange={(e) =>
                                  handleFieldChange(team.id, 'circle_points', parseInt(e.target.value || '0') || 0)
                                }
                                className="text-center font-bold text-sm sm:text-base h-10 sm:h-11"
                                placeholder="0"
                              />
                            ) : (
                              <div className="text-center font-bold text-base sm:text-lg p-2 sm:p-3 bg-muted rounded h-10 sm:h-11 flex items-center justify-center">
                                {team.custom_fields?.circle_points || 0}
                              </div>
                            )}
                          </div>

                          {/* Minus Points (no +/- selector here; minus is always subtractive) */}
                          <div className="space-y-2">
                            <Label className="text-xs sm:text-sm font-medium text-destructive block">Minus Points</Label>
                            {isHost ? (
                              <Input
                                inputMode="numeric"
                                value={localInputValues[team.id]?.['minus_points'] ?? team.custom_fields?.minus_points ?? 0}
                                onChange={(e) =>
                                  handleFieldChange(team.id, 'minus_points', parseInt(e.target.value || '0') || 0)
                                }
                                className="text-center font-bold border-destructive text-sm sm:text-base h-10 sm:h-11"
                                placeholder="0"
                              />
                            ) : (
                              <div className="text-center font-bold text-base sm:text-lg p-2 sm:p-3 bg-destructive/10 text-destructive rounded h-10 sm:h-11 flex items-center justify-center">
                                {team.custom_fields?.minus_points || 0}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Viewer-only notes */}
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

                        {!isHost && (
                          <div className="mt-4 flex items-center gap-2">
                            <Label className="text-xs sm:text-sm font-medium">Team Status:</Label>
                            {team.custom_fields?.disqualified ? (
                              <Badge variant="destructive" className="text-xs">Scratched/Disqualified</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Active</Badge>
                            )}
                          </div>
                        )}
                      </CollapsibleContent>
                    </CardContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        )}

        {/* Edit Team Dialog (draft-based, save to persist) */}
        <Dialog open={editDialogOpen} onOpenChange={(open) => (open ? null : closeEditDialog())}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                Edit Team: {editingDraft?.team_name || editingTeam?.team_name}
              </DialogTitle>
            </DialogHeader>

            {editingDraft && (
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Team/Entry Name</Label>
                    <Input
                      value={editingDraft.team_name}
                      onChange={(e) => setEditingDraft({ ...editingDraft, team_name: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Team Color</Label>
                    <div className="flex flex-wrap gap-2">
                      {TEAM_COLORS.map((color) => (
                        <div
                          key={color}
                          className={`w-8 h-8 rounded cursor-pointer border-2 ${editingDraft.team_color === color ? 'border-foreground' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setEditingDraft({ ...editingDraft, team_color: color })}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Notes & Comments */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-yellow-800">Warnings/Notes</Label>
                    <Textarea
                      value={editingDraft.custom_fields?.warnings_notes || ''}
                      onChange={(e) =>
                        setEditingDraft({ ...editingDraft, custom_fields: { ...editingDraft.custom_fields, warnings_notes: e.target.value } })
                      }
                      placeholder="Judge warnings, rule violations, notes..."
                      rows={3}
                      className="text-sm resize-none border-yellow-200 bg-yellow-50/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-blue-800">Judge Comments</Label>
                    <Textarea
                      value={editingDraft.custom_fields?.judge_comments || ''}
                      onChange={(e) =>
                        setEditingDraft({ ...editingDraft, custom_fields: { ...editingDraft.custom_fields, judge_comments: e.target.value } })
                      }
                      placeholder="Official judge remarks..."
                      rows={2}
                      className="text-sm resize-none border-blue-200 bg-blue-50/50"
                    />
                  </div>
                </div>

                {/* Team Status & Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Scratched/Disqualified:</Label>
                    <input
                      type="checkbox"
                      checked={editingDraft.custom_fields?.disqualified || false}
                      onChange={(e) => setEditingDraft({ ...editingDraft, custom_fields: { ...editingDraft.custom_fields, disqualified: e.target.checked } })}
                      className="rounded border-gray-300 text-destructive focus:ring-destructive"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={closeEditDialog} className="flex-1 sm:flex-none text-sm">
                      <X className="h-4 w-4 mr-2" />
                      Close
                    </Button>
                    <Button onClick={saveTeamChangesFromDialog} className="flex-1 sm:flex-none text-sm gap-2">
                      <SaveIcon className="h-4 w-4" />
                      Save
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
