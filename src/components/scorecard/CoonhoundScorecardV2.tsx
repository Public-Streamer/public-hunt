import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TimerControl } from "./TimerControl";
import { useCountdown, TimerStatus } from "@/hooks/useCountdown";
import { DogCard, DogData, ScoreEntry } from "./DogCard";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ScorecardSummary } from "./ScorecardSummary";
import { ScorecardDetails } from "./ScorecardDetails";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChevronDown } from "lucide-react";
import { useEventControlLock } from "@/hooks/useEventControlLock";
interface Props { eventId: string; isHost: boolean }

// Utility to map from DB rows to DogData
function fromRow(row: any): DogData {
  const cf = row.custom_fields || {};
  const entries: ScoreEntry[] = Array.isArray(cf.entries) ? cf.entries : [];
  return {
    id: row.id,
    name: row.team_name,
    color: row.team_color,
    entries,
    handler: cf.handler_name || "",
    dogName: cf.dog_name || "",
    cityState: cf.city_state || "",
    breed: cf.breed || "",
    age: typeof cf.age === 'number' ? cf.age : cf.age ? Number(cf.age) : undefined,
    judgeNotes: cf.judge_notes || "",
    disqualified: !!cf.disqualified,
    dogPhotoUrl: cf.dog_photo_url || "",
    pedigreeImageUrl: cf.pedigree_url || "",
  };
}

function toPayload(d: DogData) {
  return {
    teamId: d.id,
    team_name: d.name,
    team_color: d.color,
    custom_fields: {
      handler_name: d.handler,
      dog_name: d.dogName,
      city_state: d.cityState,
      breed: d.breed,
      age: d.age,
      judge_notes: d.judgeNotes,
      entries: d.entries,
      disqualified: d.disqualified,
      dog_photo_url: d.dogPhotoUrl,
      pedigree_url: d.pedigreeImageUrl,
    },
  } as const;
}

export const CoonhoundScorecardV2: React.FC<Props> = ({ eventId, isHost }) => {
  const [dogs, setDogs] = useState<DogData[]>([]);
  const [loading, setLoading] = useState(false);
  const [huntMinutes, setHuntMinutes] = useState<60 | 90 | 120>(120);
  const [timerOverview, setTimerOverview] = useState<Record<string, any>>({});

  // Server-authoritative control lock (auto-acquire, host override)
  const { isOwner, lockedByName, acquire, release } = useEventControlLock({
    eventId,
    enabled: isHost,
    autoAcquire: true,
    overrideIfHost: true,
    renewIntervalMs: 9000,
  });

  // Collapsible sections: default collapsed for all at load
  const [openHunt, setOpenHunt] = useState<boolean>(false);
  const [openSummary, setOpenSummary] = useState<boolean>(false);
  const [openDetails, setOpenDetails] = useState<boolean>(false);
  const [openDogIds, setOpenDogIds] = useState<Record<string, boolean>>({});
  const [expandAllMode, setExpandAllMode] = useState(false);
  const expandAll = useCallback(() => {
    setOpenHunt(true); setOpenSummary(true); setOpenDetails(true);
    setOpenDogIds((prev) => {
      const next: Record<string, boolean> = { ...prev };
      for (const d of dogs) next[d.id] = true;
      return next;
    });
    setExpandAllMode(true);
  }, [dogs]);
  const collapseAll = useCallback(() => {
    setOpenHunt(false); setOpenSummary(false); setOpenDetails(false);
    setOpenDogIds((prev) => {
      const next: Record<string, boolean> = { ...prev };
      for (const d of dogs) next[d.id] = false;
      return next;
    });
    setExpandAllMode(false);
  }, [dogs]);

// Glow highlight state map: keys like `hunt`, `dog:{id}`, `summary`, `details`
const [glow, setGlow] = useState<Record<string, { variant: 'success' | 'danger' | 'warning' | 'info' | 'pending'; until: number }>>({});
const triggerGlow = useCallback((key: string, variant: 'success' | 'danger' | 'warning' | 'info' | 'pending', ms = 5000) => {
  setGlow((prev) => ({ ...prev, [key]: { variant, until: Date.now() + ms } }));
}, []);
useEffect(() => {
  const id = setInterval(() => {
    const now = Date.now();
    setGlow((prev) => {
      const next: typeof prev = {} as any;
      let changed = false;
      for (const k in prev) {
        if (prev[k].until > now) next[k] = prev[k]; else changed = true;
      }
      return changed ? next : prev;
    });
  }, 1000);
  return () => clearInterval(id);
}, []);

// Realtime channel for scoreboard/timer sync
const getClientId = () => {
  try {
    const key = 'ps-client-id';
    let id = localStorage.getItem(key);
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id); }
    return id;
  } catch { return crypto.randomUUID(); }
};
const clientIdRef = React.useRef<string>(getClientId());
const rtChannelRef = React.useRef<ReturnType<typeof supabase.channel> | null>(null);

// Fetch timer overview from database for all viewers
const fetchTimerOverview = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('scoreboard-operations', {
      body: { action: 'fetch', eventId, scoreboardType: 'coon_hunt' }
    });
    if (error) throw error;
    const arr = Array.isArray(data) ? data : data?.teams || [];
    const overview: Record<string, Record<string, any>> = {};
    
    for (const team of arr) {
      const timers = team.custom_fields?.timers;
      if (timers) {
        // Convert timer data from database format to UI format
        const uiTimers: Record<string, any> = {};
        for (const [key, timer] of Object.entries(timers)) {
          if (timer && typeof timer === 'object' && 'status' in timer && 'remaining' in timer) {
            const remaining = Math.max(0, (timer as any).remaining || 0);
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            uiTimers[key] = {
              formatted: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
              status: (timer as any).status || 'idle'
            };
          }
        }
        overview[team.id] = uiTimers;
      }
    }
    setTimerOverview(overview);
  } catch (e) {
    console.error('Failed to fetch timer overview:', e);
  }
};


const colorCls = (s: TimerStatus) => s === "running"
  ? "bg-primary/10 text-primary"
  : s === "paused"
  ? "bg-accent/10 text-accent-foreground"
  : s === "finished"
  ? "bg-destructive/10 text-destructive"
  : "bg-muted text-muted-foreground";

// Setup realtime channel defined below; syncCastTimers moved after timers

  const huntTimer = useCountdown(huntMinutes * 60, {
    onComplete: () => {
      toast({ title: "Hunt time finished", description: "Main hunt timer ended" });
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { (navigator as any).vibrate?.(200); } catch {}
      }
    },
  });
  const trackTimer = useCountdown(6 * 60, {
    onComplete: () => {
      toast({ title: "Track timer finished", description: "Global track timer ended" });
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { (navigator as any).vibrate?.(200); } catch {}
      }
    },
  });
  const globalShineTimer = useCountdown(8 * 60, {
    onComplete: () => {
      toast({ title: "Global shine finished", description: "Shine time ended" });
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { (navigator as any).vibrate?.(200); } catch {}
      }
    },
  });
  const babbleMainTimer = useCountdown(1 * 60, {
    onComplete: () => {
      toast({ title: "Babbling timer finished", description: "Main babbling 1-minute window ended" });
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { (navigator as any).vibrate?.(200); } catch {}
      }
    },
  });
  // Babbling one-minute timer should start each time Main Hunt starts
useEffect(() => {
  const channel = supabase.channel(`event:${eventId}:scorecard`, {
    config: { broadcast: { self: false }, presence: { key: clientIdRef.current } },
  });

  channel
    .on('broadcast', { event: 'score_update' }, (p: any) => {
      setOpenSummary(true);
      setOpenDetails(true);
      if (p?.teamId) setOpenDogIds((prev) => ({ ...prev, [p.teamId]: true }));
      const variant = p?.updateKind === '+' ? 'success' : p?.updateKind === '-' ? 'danger' : p?.updateKind === 'o' ? 'warning' : p?.updateKind === 'pending' ? 'info' : 'pending';
      if (p?.teamId) triggerGlow(`dog:${p.teamId}`, variant);
      triggerGlow('summary', variant);
      triggerGlow('details', variant);
      fetchTeams();
    })
    .on('broadcast', { event: 'dog_timer_update' }, (p: any) => {
      if (p?.teamId) setOpenDogIds((prev) => ({ ...prev, [p.teamId]: true }));
      if (p?.teamId) triggerGlow(`dog:${p.teamId}`, 'warning');
      // Refresh timer overview to sync across all viewers
      fetchTimerOverview();
    })
    .on('broadcast', { event: 'cast_timer_update' }, (p: any) => {
      setOpenHunt(true);
      triggerGlow('hunt', 'warning');
      const t = p?.timers;
      if (t) {
        huntTimer.syncTo(t.mainHunt?.remaining ?? huntTimer.remaining, t.mainHunt?.status ?? huntTimer.status);
        trackTimer.syncTo(t.track?.remaining ?? trackTimer.remaining, t.track?.status ?? trackTimer.status);
        globalShineTimer.syncTo(t.globalShine?.remaining ?? globalShineTimer.remaining, t.globalShine?.status ?? globalShineTimer.status);
        babbleMainTimer.syncTo(t.babbling?.remaining ?? babbleMainTimer.remaining, t.babbling?.status ?? babbleMainTimer.status);
      }
    })
    .on('broadcast', { event: 'dog_created' }, () => {
      setOpenDetails(true);
      triggerGlow('details', 'info');
      fetchTeams();
    });

  channel.subscribe(() => {});
  rtChannelRef.current = channel;
  return () => { if (rtChannelRef.current) supabase.removeChannel(rtChannelRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [eventId, huntTimer.status, huntTimer.remaining, trackTimer.status, trackTimer.remaining, globalShineTimer.status, globalShineTimer.remaining, babbleMainTimer.status, babbleMainTimer.remaining]);

const fetchTeams = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('scoreboard-operations', {
      body: { action: 'fetch', eventId, scoreboardType: 'coon_hunt' }
    });
    if (error) throw error;
    const arr = Array.isArray(data) ? data : data?.teams || [];
    const mapped = arr.map(fromRow);
    setDogs(mapped);
  } catch (e) {
    console.error(e);
  }
};

  // Ensure existing teams are loaded on entry so panels are visible immediately
useEffect(() => {
  fetchTeams();
  // Fetch timer overview for all viewers
  fetchTimerOverview();
  // Try to hydrate timers if server provides state
  (async () => {
    try {
      const { data } = await supabase.functions.invoke('scoreboard-operations', { body: { action: 'getCastTimers', eventId } });
      const t = (data as any)?.timers;
      if (t) {
        huntTimer.syncTo(t.mainHunt?.remaining ?? huntTimer.remaining, t.mainHunt?.status ?? huntTimer.status);
        trackTimer.syncTo(t.track?.remaining ?? trackTimer.remaining, t.track?.status ?? trackTimer.status);
        globalShineTimer.syncTo(t.globalShine?.remaining ?? globalShineTimer.remaining, t.globalShine?.status ?? globalShineTimer.status);
        babbleMainTimer.syncTo(t.babbling?.remaining ?? babbleMainTimer.remaining, t.babbling?.status ?? babbleMainTimer.status);
      }
    } catch {}
  })();
}, [eventId]);

const syncCastTimers = useCallback(async () => {
  if (!isHost || !isOwner) { toast({ title: 'Locked', description: lockedByName ? `Controls locked by ${lockedByName}` : 'Acquire lock to edit.', variant: 'destructive' }); return; }
  try {
    const timers = {
      mainHunt: { status: huntTimer.status, remaining: huntTimer.remaining },
      track: { status: trackTimer.status, remaining: trackTimer.remaining },
      globalShine: { status: globalShineTimer.status, remaining: globalShineTimer.remaining },
      babbling: { status: babbleMainTimer.status, remaining: babbleMainTimer.remaining },
      mainHuntMinutes: huntMinutes,
    };
    await supabase.functions.invoke('scoreboard-operations', {
      body: { action: 'updateCastTimers', eventId, timers }
    });
    rtChannelRef.current?.send({ type: 'broadcast', event: 'cast_timer_update', payload: { eventId, timers } });
  } catch (e) {
    console.warn('Failed to sync cast timers', e);
  }
}, [eventId, huntMinutes, huntTimer.remaining, huntTimer.status, trackTimer.remaining, trackTimer.status, globalShineTimer.remaining, globalShineTimer.status, babbleMainTimer.remaining, babbleMainTimer.status]);

// Save handler that updates score and custom_fields
const handleDogChange = async (dog: DogData, newTotal: number) => {
  // compute previous for diff
  if (!isHost || !isOwner) { toast({ title: 'Locked', description: lockedByName ? `Controls locked by ${lockedByName}` : 'Acquire lock to edit.', variant: 'destructive' }); return; }
  const prev = dogs.find((d) => d.id === dog.id);
  setDogs((prevList) => prevList.map((d) => (d.id === dog.id ? dog : d)));
  try {
    const payload = toPayload(dog);
    const { error } = await supabase.functions.invoke('scoreboard-operations', {
      body: { action: 'updateTeam', ...payload, score: newTotal }
    });
    if (error) throw error;

    // Broadcast update for viewers (for auto-expand + glow)
    const detectKind = () => {
      if (!prev) return 'pending';
      const before = new Map(prev.entries.map(e => [e.id, e]));
      for (const e of dog.entries) {
        const old = before.get(e.id);
        if (old && old.outcome !== e.outcome) return e.outcome;
      }
      return 'pending';
    };
    rtChannelRef.current?.send({ type: 'broadcast', event: 'score_update', payload: { eventId, teamId: dog.id, updateKind: detectKind() } });
  } catch (e) {
    console.error(e);
    toast({ title: 'Error', description: 'Failed to save score', variant: 'destructive' });
  }
};

const handleDogTimerAction = async (
  dogId: string,
  timers: Record<string, { status: TimerStatus; remaining: number }>
) => {
  if (!isHost || !isOwner) { toast({ title: 'Locked', description: lockedByName ? `Controls locked by ${lockedByName}` : 'Acquire lock to edit.', variant: 'destructive' }); return; }
  try {
    await supabase.functions.invoke('scoreboard-operations', {
      body: { action: 'updateDogTimers', teamId: dogId, timers }
    });
    rtChannelRef.current?.send({ type: 'broadcast', event: 'dog_timer_update', payload: { eventId, teamId: dogId, timers } });
  } catch (e) {
    console.warn('Failed to sync dog timers', e);
  }
};

const totalPending = useMemo(() => dogs.reduce((acc, d) => acc + d.entries.filter(e => e.outcome === 'pending').length, 0), [dogs]);

// Helper to set initial collapsed state of dogs
useEffect(() => {
  if (!dogs.length) return;
  setOpenDogIds((prev) => {
    if (Object.keys(prev).length) return prev; // keep user's choices
    const next: Record<string, boolean> = {};
    for (const d of dogs) next[d.id] = false; // collapsed by default for all
    return next;
  });
}, [dogs, isHost]);

// Add dog
const [newDog, setNewDog] = useState("");
const addDog = async () => {
  if (!newDog.trim()) return;
  if (!isHost || !isOwner) { toast({ title: 'Locked', description: lockedByName ? `Controls locked by ${lockedByName}` : 'Acquire lock to edit.', variant: 'destructive' }); return; }
  setLoading(true);
  try {
    const colorPalette = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
    const teamColor = colorPalette[dogs.length % colorPalette.length];
    const { error } = await supabase.functions.invoke('scoreboard-operations', {
      body: {
        action: 'create', eventId, teamName: newDog.trim(), teamColor,
        customFields: { handler_name: '', entries: [] }, scoreboardType: 'coon_hunt'
      }
    });
    if (error) throw error;
    setNewDog("");
    rtChannelRef.current?.send({ type: 'broadcast', event: 'dog_created', payload: { eventId } });
    fetchTeams();
  } catch (e) {
    console.error(e);
    toast({ title: 'Error', description: 'Failed to add dog', variant: 'destructive' });
  } finally { setLoading(false); }
};

  return (
    <div className="space-y-4">
      {/* Master controls */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2">
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={collapseAll} aria-label="Collapse all boxes">Collapse All</Button>
          <Button onClick={expandAll} aria-label="Expand all boxes">Expand All</Button>
          {expandAllMode && <Badge variant="outline" className="ml-2">Expand-All lock ON</Badge>}
        </div>
      </div>

      {/* Hunt Timers (Collapsible with glow) */}
      <Collapsible open={expandAllMode ? true : openHunt} onOpenChange={expandAllMode ? undefined : setOpenHunt}>
        <Card className={`relative overflow-hidden glow-surface ${glow['hunt'] ? 'glow-active glow-warning' : ''}`}>
          <CardHeader className="py-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span>Hunt Timers</span>
              <div className="flex items-center gap-2">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Toggle Hunt Timers">
                    <ChevronDown className={`h-4 w-4 transition-transform ${(expandAllMode ? true : openHunt) ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <Select value={String(huntMinutes)} onValueChange={(v) => { const m = Number(v) as 60 | 90 | 120; setHuntMinutes(m); huntTimer.reset(m * 60); syncCastTimers(); }}>
                  <SelectTrigger disabled={!isHost || !isOwner} className="h-8 w-32"><SelectValue placeholder="Hunt" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">60 min</SelectItem>
                    <SelectItem value="90">90 min</SelectItem>
                    <SelectItem value="120">120 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardTitle>
          </CardHeader>
          <CollapsibleContent>
            {!isHost && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="text-4xl sm:text-5xl font-extrabold uppercase tracking-widest text-foreground/15 -rotate-12 select-none">VIEW ONLY</span>
              </div>
            )}
            <CardContent className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div title="Main Hunt Timer: Select duration then control the clock.">
                <TimerControl disabled={!isHost || !isOwner} allowPause label="Main Hunt" formatted={huntTimer.formatted} status={huntTimer.status} onStart={() => { huntTimer.start(); babbleMainTimer.reset(); babbleMainTimer.start(); syncCastTimers(); }} onPause={() => { huntTimer.pause(); syncCastTimers(); }} onReset={() => { huntTimer.reset(huntMinutes * 60); syncCastTimers(); }} />
              </div>
              <div title="Global Track Timer: 6 minutes for strike requirement.">
                <TimerControl disabled={!isHost || !isOwner} label="Track 6:00" formatted={trackTimer.formatted} status={trackTimer.status} onStart={() => { trackTimer.start(); syncCastTimers(); }} onPause={() => { trackTimer.pause(); syncCastTimers(); }} onReset={() => { trackTimer.reset(); syncCastTimers(); }} />
              </div>
              <div title="Global Shine Timer: 8 minutes when multiple dogs are involved.">
                <TimerControl disabled={!isHost || !isOwner} label="Global Shine 8:00" formatted={globalShineTimer.formatted} status={globalShineTimer.status} onStart={() => { globalShineTimer.start(); syncCastTimers(); }} onPause={() => { globalShineTimer.pause(); syncCastTimers(); }} onReset={() => { globalShineTimer.reset(); syncCastTimers(); }} />
              </div>
              <div title="Babbling Stopwatch: auto-starts with Main Hunt start.">
                <TimerControl disabled={!isHost || !isOwner} label="Babbling 1 Minute 1:00" formatted={babbleMainTimer.formatted} status={babbleMainTimer.status} onStart={() => { babbleMainTimer.start(); syncCastTimers(); }} onPause={() => { babbleMainTimer.pause(); syncCastTimers(); }} onReset={() => { babbleMainTimer.reset(); syncCastTimers(); }} />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {!isHost && (
        <Alert variant="info">
          <AlertTitle>View-only mode</AlertTitle>
          <AlertDescription>
            You can view all teams and timers in real time. Only the Event Creator and streamers with Judge permission can add, edit, delete, or control timers.
          </AlertDescription>
        </Alert>
      )}

      <ScorecardSummary
        dogs={dogs}
        timerOverview={timerOverview}
        castTimers={[
          { key: "hunt", label: `Main Hunt ${huntMinutes} minutes`, status: huntTimer.status, formatted: huntTimer.formatted },
          { key: "track", label: "Track 6 minutes", status: trackTimer.status, formatted: trackTimer.formatted },
          { key: "shine", label: "Global Shine 8 minutes", status: globalShineTimer.status, formatted: globalShineTimer.formatted },
          { key: "babbling", label: "Babbling 1 Minute 1:00", status: babbleMainTimer.status, formatted: babbleMainTimer.formatted },
        ]}
        open={expandAllMode ? true : openSummary}
        onOpenChange={expandAllMode ? undefined : setOpenSummary}
        glowClassName={glow['summary'] ? 'glow-active glow-info' : ''}
      />

      <ScorecardDetails
        dogs={dogs}
        onSave={handleDogChange}
        canEdit={isHost && isOwner}
        open={expandAllMode ? true : openDetails}
        onOpenChange={expandAllMode ? undefined : setOpenDetails}
        glowClassName={glow['details'] ? 'glow-active glow-info' : ''}
      />

      {/* Dogs */}
      <div className="space-y-3">
        {dogs.map((d) => (
          <div key={d.id} className={`glow-surface ${glow[`dog:${d.id}`] ? `glow-active ${
            glow[`dog:${d.id}`]!.variant === 'success' ? 'glow-success' :
            glow[`dog:${d.id}`]!.variant === 'danger' ? 'glow-danger' :
            glow[`dog:${d.id}`]!.variant === 'warning' ? 'glow-warning' :
            glow[`dog:${d.id}`]!.variant === 'info' ? 'glow-info' : 'glow-pending'
          }` : ''}`}>
            <DogCard
              dog={d}
              onChange={handleDogChange}
              onTimerSnapshot={(dogId, snap) => setTimerOverview((prev) => ({ ...prev, [dogId]: snap }))}
              onTimerAction={handleDogTimerAction}
              onDelete={() => fetchTeams()}
              canEdit={isHost && isOwner}
              openExternal={expandAllMode ? true : (openDogIds[d.id] ?? false)}
              lockOpen={expandAllMode}
            />
          </div>
        ))}
      </div>

      {/* Add dog */}
      {isHost && (
        <div className="flex items-center gap-2">
          <Input placeholder="Add dog (team name)" value={newDog} onChange={(e) => setNewDog(e.target.value)} className="max-w-xs" />
          <Button onClick={addDog} disabled={loading || !isOwner}>Add</Button>
        </div>
      )}
    </div>
  );
};
