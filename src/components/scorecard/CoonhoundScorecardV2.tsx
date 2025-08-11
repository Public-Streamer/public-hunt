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
  };
}

function toPayload(d: DogData) {
  return {
    teamId: d.id,
    team_name: d.name,
    team_color: d.color,
    custom_fields: {
      handler_name: d.handler,
      entries: d.entries,
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
      };
      await supabase.functions.invoke('scoreboard-operations', {
        body: { action: 'updateCastTimers', eventId, timers }
      });
    } catch (e) {
      console.warn('Failed to sync cast timers', e);
    }
  }, [eventId]);

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

  useEffect(() => { fetchTeams(); }, [eventId]);

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
              <Select value={String(huntMinutes)} onValueChange={(v) => { const m = Number(v) as 60 | 90 | 120; setHuntMinutes(m); huntTimer.reset(m * 60); }}>
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
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div title="Main Hunt Timer: Select duration then control the clock.">
            <TimerControl label="Main Hunt" formatted={huntTimer.formatted} status={huntTimer.status} onStart={huntTimer.start} onPause={huntTimer.pause} onReset={() => huntTimer.reset(huntMinutes * 60)} />
          </div>
          <div title="Global Track Timer: 6 minutes for strike requirement.">
            <TimerControl label="Track 6:00" formatted={trackTimer.formatted} status={trackTimer.status} onStart={trackTimer.start} onPause={trackTimer.pause} onReset={trackTimer.reset} />
          </div>
          <div title="Global Shine Timer: 8 minutes when multiple dogs are involved.">
            <TimerControl label="Global Shine 8:00" formatted={globalShineTimer.formatted} status={globalShineTimer.status} onStart={globalShineTimer.start} onPause={globalShineTimer.pause} onReset={globalShineTimer.reset} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3"><CardTitle className="text-base">Timers Overview</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="text-xs text-muted-foreground">Cast-wide</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className={`rounded-md p-2 border ${colorCls(huntTimer.status)}`}>
              <div className="flex items-center justify-between text-xs">
                <span>Main Hunt</span>
                <span className="tabular-nums font-semibold">{huntTimer.formatted}</span>
              </div>
            </div>
            <div className={`rounded-md p-2 border ${colorCls(trackTimer.status)}`}>
              <div className="flex items-center justify-between text-xs">
                <span>Track 6:00</span>
                <span className="tabular-nums font-semibold">{trackTimer.formatted}</span>
              </div>
            </div>
            <div className={`rounded-md p-2 border ${colorCls(globalShineTimer.status)}`}>
              <div className="flex items-center justify-between text-xs">
                <span>Global Shine 8:00</span>
                <span className="tabular-nums font-semibold">{globalShineTimer.formatted}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {dogs.map((d) => {
              const snap = timerOverview[d.id];
              if (!snap) return null;
              const label = (k: string) => k.replace(/([A-Z])/g, " $1").trim();
              const keys: string[] = ["tree","treeBark2","shine","trackBark","notHunting","stationary","noBark"];
              return (
                <div key={d.id}>
                  <div className="text-xs font-medium flex items-center gap-2 mb-1">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: d.color }} />
                    <span className="truncate">{d.name}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {keys.map((k) => {
                      const t = snap[k];
                      if (!t) return null;
                      return (
                        <div key={k} className={`rounded-md p-2 border ${colorCls(t.status)}`}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="capitalize">{label(k)}</span>
                            <span className="tabular-nums font-semibold">{t.formatted}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pending summary */}
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-base">Pending Points Summary</CardTitle></CardHeader>
        <CardContent>
          {totalPending === 0 ? (
            <div className="text-sm text-muted-foreground">No pending entries.</div>
          ) : (
            <div className="text-sm">{totalPending} pending entr{totalPending === 1 ? 'y' : 'ies'} across dogs.</div>
          )}
        </CardContent>
      </Card>

      {/* Dogs */}
      <div className="space-y-3">
        {dogs.map((d) => (
          <DogCard key={d.id} dog={d} onChange={handleDogChange} />
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
