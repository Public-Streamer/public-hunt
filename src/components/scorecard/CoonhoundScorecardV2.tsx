import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimerControl } from "./TimerControl";
import { useCountdown, TimerStatus } from "@/hooks/useCountdown";
import { DogCard, DogData, ScoreEntry } from "./DogCard";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ScorecardSummary } from "./ScorecardSummary";
import { ScorecardDetails } from "./ScorecardDetails";

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
  const colorCls = (s: TimerStatus) => s === "running"
    ? "bg-primary/10 text-primary"
    : s === "paused"
    ? "bg-accent/10 text-accent-foreground"
    : s === "finished"
    ? "bg-destructive/10 text-destructive"
    : "bg-muted text-muted-foreground";

  const syncCastTimers = useCallback(async () => {
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
    } catch (e) {
      console.warn('Failed to sync cast timers', e);
    }
  }, [eventId, huntMinutes]);

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

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('scoreboard-operations', {
        body: { action: 'fetch', eventId, scoreboardType: 'coon_hunt' }
      });
      if (error) throw error;
      const arr = Array.isArray(data) ? data : data?.teams || [];
      setDogs(arr.map(fromRow));
    } catch (e) {
      console.error(e);
    }
  };

  // Ensure existing teams are loaded on entry so panels are visible immediately
  useEffect(() => {
    fetchTeams();
  }, [eventId]);

  // Save handler that updates score and custom_fields
  const handleDogChange = async (dog: DogData, newTotal: number) => {
    setDogs((prev) => prev.map((d) => (d.id === dog.id ? dog : d)));
    try {
      const payload = toPayload(dog);
      const { error } = await supabase.functions.invoke('scoreboard-operations', {
        body: { action: 'updateTeam', ...payload, score: newTotal }
      });
      if (error) throw error;
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to save score', variant: 'destructive' });
    }
  };

  const handleDogTimerAction = async (
    dogId: string,
    timers: Record<string, { status: TimerStatus; remaining: number }>
  ) => {
    try {
      await supabase.functions.invoke('scoreboard-operations', {
        body: { action: 'updateDogTimers', teamId: dogId, timers }
      });
    } catch (e) {
      console.warn('Failed to sync dog timers', e);
    }
  };

  const totalPending = useMemo(() => dogs.reduce((acc, d) => acc + d.entries.filter(e => e.outcome === 'pending').length, 0), [dogs]);

  // SEO: Ensure semantic, accessible structure is used in headings/sections (handled by page layout)

  // Add dog
  const [newDog, setNewDog] = useState("");
  const addDog = async () => {
    if (!newDog.trim()) return;
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
      fetchTeams();
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to add dog', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      {/* Cast-wide timers */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span>Hunt Timers</span>
            <div className="flex items-center gap-2">
              <Select value={String(huntMinutes)} onValueChange={(v) => { const m = Number(v) as 60 | 90 | 120; setHuntMinutes(m); huntTimer.reset(m * 60); syncCastTimers(); }}>
                <SelectTrigger className="h-8 w-32"><SelectValue placeholder="Hunt" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">60 min</SelectItem>
                  <SelectItem value="90">90 min</SelectItem>
                  <SelectItem value="120">120 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <div title="Main Hunt Timer: Select duration then control the clock.">
            <TimerControl allowPause label="Main Hunt" formatted={huntTimer.formatted} status={huntTimer.status} onStart={() => { huntTimer.start(); babbleMainTimer.reset(); babbleMainTimer.start(); syncCastTimers(); }} onPause={() => { huntTimer.pause(); syncCastTimers(); }} onReset={() => { huntTimer.reset(huntMinutes * 60); syncCastTimers(); }} />
          </div>
          <div title="Global Track Timer: 6 minutes for strike requirement.">
            <TimerControl label="Track 6:00" formatted={trackTimer.formatted} status={trackTimer.status} onStart={() => { trackTimer.start(); syncCastTimers(); }} onPause={() => { trackTimer.pause(); syncCastTimers(); }} onReset={() => { trackTimer.reset(); syncCastTimers(); }} />
          </div>
          <div title="Global Shine Timer: 8 minutes when multiple dogs are involved.">
            <TimerControl label="Global Shine 8:00" formatted={globalShineTimer.formatted} status={globalShineTimer.status} onStart={() => { globalShineTimer.start(); syncCastTimers(); }} onPause={() => { globalShineTimer.pause(); syncCastTimers(); }} onReset={() => { globalShineTimer.reset(); syncCastTimers(); }} />
          </div>
          <div title="Babbling Stopwatch: auto-starts with Main Hunt start.">
            <TimerControl label="Babbling 1 Minute 1:00" formatted={babbleMainTimer.formatted} status={babbleMainTimer.status} onStart={() => { babbleMainTimer.start(); syncCastTimers(); }} onPause={() => { babbleMainTimer.pause(); syncCastTimers(); }} onReset={() => { babbleMainTimer.reset(); syncCastTimers(); }} />
          </div>
        </CardContent>
      </Card>

      <ScorecardSummary
        dogs={dogs}
        timerOverview={timerOverview}
        castTimers={[
          { key: "hunt", label: `Main Hunt ${huntMinutes} minutes`, status: huntTimer.status, formatted: huntTimer.formatted },
          { key: "track", label: "Track 6 minutes", status: trackTimer.status, formatted: trackTimer.formatted },
          { key: "shine", label: "Global Shine 8 minutes", status: globalShineTimer.status, formatted: globalShineTimer.formatted },
          { key: "babbling", label: "Babbling 1 Minute 1:00", status: babbleMainTimer.status, formatted: babbleMainTimer.formatted },
        ]}
      />

      <ScorecardDetails dogs={dogs} onSave={handleDogChange} canEdit={isHost} />

      {/* Dogs */}
      <div className="space-y-3">
        {dogs.map((d) => (
          <DogCard
            key={d.id}
            dog={d}
            onChange={handleDogChange}
            onTimerSnapshot={(dogId, snap) => setTimerOverview((prev) => ({ ...prev, [dogId]: snap }))}
            onTimerAction={handleDogTimerAction}
            onDelete={() => fetchTeams()}
            canEdit={isHost}
          />
        ))}
      </div>

      {/* Add dog */}
      {isHost && (
        <div className="flex items-center gap-2">
          <Input placeholder="Add dog (team name)" value={newDog} onChange={(e) => setNewDog(e.target.value)} className="max-w-xs" />
          <Button onClick={addDog} disabled={loading}>Add</Button>
        </div>
      )}
    </div>
  );
};
