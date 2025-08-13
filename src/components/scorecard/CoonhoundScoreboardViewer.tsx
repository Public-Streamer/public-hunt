import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { TimerStatus } from "@/hooks/useCountdown";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface Props { eventId: string }

type CastTimers = {
  mainHunt?: { status: TimerStatus; remaining: number };
  track?: { status: TimerStatus; remaining: number };
  globalShine?: { status: TimerStatus; remaining: number };
  babbling?: { status: TimerStatus; remaining: number };
  mainHuntMinutes?: number;
  server_updated_at?: string;
};

type DogTimerSnapshot = Record<string, { status: TimerStatus; remaining: number }> & {
  timers_server_updated_at?: string;
};

interface TeamRow {
  id: string;
  team_name: string;
  team_color?: string;
  custom_fields?: any;
}

function formatMMSS(secs: number) {
  const s = Math.max(0, Math.ceil(secs));
  const mStr = Math.floor(s / 60).toString().padStart(2, "0");
  const sStr = (s % 60).toString().padStart(2, "0");
  return `${mStr}:${sStr}`;
}

function liveRemaining(remaining: number | undefined, serverUpdatedAt: string | undefined, status: TimerStatus): number {
  if (!remaining && remaining !== 0) return 0;
  if (status !== "running") return remaining;
  if (!serverUpdatedAt) return remaining;
  const elapsed = (Date.now() - Date.parse(serverUpdatedAt)) / 1000;
  return Math.max(0, remaining - elapsed);
}

const statusCls = (s: TimerStatus) =>
  s === "running"
    ? "bg-primary/10 text-primary"
    : s === "paused"
    ? "bg-accent/10 text-accent-foreground"
    : s === "finished"
    ? "bg-destructive/10 text-destructive"
    : "bg-muted text-muted-foreground";

export const CoonhoundScoreboardViewer: React.FC<Props> = ({ eventId }) => {
  const [castTimers, setCastTimers] = useState<CastTimers>({});
  const [teams, setTeams] = useState<TeamRow[]>([]);

  // Collapsible open states (open by default for viewers to see content)
  const [openHunt, setOpenHunt] = useState(true);
  const [openSummary, setOpenSummary] = useState(true);
  const [openDetails, setOpenDetails] = useState(true);

  // Glow highlights
  const [glow, setGlow] = useState<Record<string, { variant: 'success' | 'danger' | 'warning' | 'info' | 'pending'; until: number }>>({});
  const triggerGlow = (key: string, variant: 'success' | 'danger' | 'warning' | 'info' | 'pending', ms = 5000) => {
    setGlow((prev) => ({ ...prev, [key]: { variant, until: Date.now() + ms } }));
  };
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      setGlow((prev) => {
        const next: typeof prev = {} as any;
        let changed = false;
        for (const k in prev) { if (prev[k].until > now) next[k] = prev[k]; else changed = true; }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Tick for smooth display of running timers
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => (t + 1) % 1000000), 1000);
    return () => clearInterval(iv);
  }, []);
  const [tick, setTick] = useState(0);

  // Initial fetch
  useEffect(() => {
    (async () => {
      const { data: ev } = await supabase
        .from("events")
        .select("metadata")
        .eq("id", eventId)
        .maybeSingle();
      const ct = (ev?.metadata as any)?.scorecard_cast_timers as CastTimers;
      if (ct) setCastTimers(ct);

      const { data: rows } = await supabase
        .from("event_scoreboard")
        .select("id, team_name, team_color, custom_fields")
        .eq("event_id", eventId)
        .eq("scoreboard_type", "coon_hunt")
        .order("created_at", { ascending: true });
      setTeams(rows || []);
    })();
  }, [eventId]);

  // Realtime subscriptions
  useEffect(() => {
    const ch = supabase
      .channel(`scoreboard-viewer-${eventId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "events", filter: `id=eq.${eventId}` },
        (payload) => {
          const meta = (payload.new as any)?.metadata;
          const ct = meta?.scorecard_cast_timers as CastTimers | undefined;
          if (ct) {
            setCastTimers(ct);
            setOpenHunt(true);
            triggerGlow('hunt', 'warning');
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "event_scoreboard", filter: `event_id=eq.${eventId}` },
        (payload) => {
          setTeams((prev) => [...prev, payload.new as TeamRow]);
          setOpenSummary(true); setOpenDetails(true);
          triggerGlow('summary', 'info'); triggerGlow('details', 'info');
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "event_scoreboard", filter: `event_id=eq.${eventId}` },
        (payload) => {
          const oldCF = (payload.old as any)?.custom_fields || {};
          const newCF = (payload.new as any)?.custom_fields || {};
          setTeams((prev) => prev.map((t) => (t.id === (payload.new as any).id ? (payload.new as TeamRow) : t)));
          // Detect entry outcome change
          const oldEntries = Array.isArray(oldCF.entries) ? oldCF.entries : [];
          const newEntries = Array.isArray(newCF.entries) ? newCF.entries : [];
          let variant: 'success' | 'danger' | 'warning' | 'info' | 'pending' = 'info';
          for (const e of newEntries) {
            const before = oldEntries.find((x: any) => x.id === e.id);
            if (before && before.outcome !== e.outcome) {
              if (e.outcome === '+') variant = 'success';
              else if (e.outcome === '-') variant = 'danger';
              else if (e.outcome === 'o') variant = 'warning';
              else if (e.outcome === 'pending') variant = 'info';
              break;
            }
          }
          setOpenSummary(true); setOpenDetails(true);
          triggerGlow('summary', variant); triggerGlow('details', variant);
          triggerGlow(`dog:${(payload.new as any).id}`, variant);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "event_scoreboard", filter: `event_id=eq.${eventId}` },
        (payload) => setTeams((prev) => prev.filter((t) => t.id !== (payload.old as any).id))
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [eventId]);

  const runningDogTimers = (t: TeamRow) => {
    const cf = (t.custom_fields as any) || {};
    const timers = (cf.timers as DogTimerSnapshot) || ({} as any);
    const serverUpdatedAt = (cf.timers_server_updated_at as string) || undefined;
    const labels: Record<string, string> = {
      tree: "Tree",
      treeBark2: "Tree Bark",
      shine: "Shine",
      trackBark: "Track Bark",
      babbling: "Babbling 1 Minute",
      notHunting: "Not Hunt",
      goneHunting: "Gone Hunt",
      stationary: "Stationary",
      noBark: "No Bark",
    };
    const minutes: Record<string, number> = {
      tree: 3,
      treeBark2: 2,
      shine: 8,
      trackBark: 6,
      babbling: 1,
      notHunting: 15,
      goneHunting: 5,
      stationary: 5,
      noBark: 2,
    };
    return Object.entries(timers)
      .filter(([k, v]) => typeof v === "object" && (v as any).status === "running")
      .map(([k, v]) => {
        const snap = v as { status: TimerStatus; remaining: number };
        const remaining = liveRemaining(snap.remaining, serverUpdatedAt, snap.status);
        const base = labels[k] || (k as string);
        const label = minutes[k as string] ? `${base} ${minutes[k as string]} minutes` : base;
        return { key: k, label, formatted: formatMMSS(remaining), status: snap.status };
      });
  };

  const castBlocks = [
    { key: "mainHunt", label: "Main Hunt" },
    { key: "track", label: "Track 6 minutes" },
    { key: "globalShine", label: "Global Shine 8 minutes" },
    { key: "babbling", label: "Babbling 1 Minute 1:00" },
  ] as const;

  const visibleCastBlocks = castBlocks.filter((b) => {
    const snap = (castTimers as any)[b.key] as { status: TimerStatus; remaining: number } | undefined;
    return snap?.status === "running";
  });

  const calcTotals = (entries: any[]) => {
    let plus = 0, minus = 0, circle = 0, pending = 0;
    for (const e of entries || []) {
      if (e.outcome === "+") plus += e.points;
      else if (e.outcome === "-") minus += e.points;
      else if (e.outcome === "o") circle += e.points;
      else if (e.outcome === "pending") pending += e.points;
    }
    const total = plus - minus;
    return { plus, minus, circle, pending, total };
  };

  return (
    <div className="space-y-4">
      {/* Hunt Timers */}
      <Collapsible open={openHunt} onOpenChange={setOpenHunt}>
        <Card className={`glow-surface ${glow['hunt'] ? 'glow-active glow-warning' : ''}`}>
          <CardHeader className="py-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <CardTitle className="text-base">Hunt Timers</CardTitle>
                <ChevronDown className={`h-4 w-4 transition-transform ${openHunt ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {visibleCastBlocks.length > 0 ? (
                  visibleCastBlocks.map((b) => {
                    const snap = (castTimers as any)[b.key] as { status: TimerStatus; remaining: number } | undefined;
                    const rem = liveRemaining(snap?.remaining, castTimers.server_updated_at, snap?.status || "idle");
                    const formatted = formatMMSS(rem);
                    return (
                      <div key={b.key} className={`rounded-md p-2 border ${statusCls(snap?.status || "idle")}`}>
                        <div className="flex items-center justify-between text-xs">
                          <span>{b.key === "mainHunt" && (castTimers as any).mainHuntMinutes ? `Main Hunt ${(castTimers as any).mainHuntMinutes} minutes` : b.label}</span>
                          <span className="tabular-nums font-semibold">{formatted}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-muted-foreground">No active cast timers</div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Scorecard Summary */}
      <Collapsible open={openSummary} onOpenChange={setOpenSummary}>
        <Card className={`glow-surface ${glow['summary'] ? 'glow-active glow-info' : ''}`}>
          <CardHeader className="py-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <CardTitle className="text-base">Scorecard Summary</CardTitle>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSummary ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-3">
              {teams.map((t) => {
                const cf = (t.custom_fields as any) || {};
                const entries = Array.isArray(cf.entries) ? cf.entries : [];
                const { plus, minus, circle, pending, total } = calcTotals(entries);
                return (
                  <div key={t.id} className="rounded-md border p-3 glow-surface">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-base sm:text-lg font-extrabold flex items-center gap-2 text-foreground">
                          <span className="inline-block h-2 w-2 rounded-full" style={{ background: t.team_color || 'hsl(var(--primary))' }} />
                          <span className="truncate">{t.team_name}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs justify-end">
                        {plus > 0 && (<Badge variant="outline" className="bg-primary/10 text-primary border-primary/40"><span className="tabular-nums">{plus}</span><span className="ml-1">+</span></Badge>)}
                        {minus > 0 && (<Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/40"><span className="tabular-nums">{minus}</span><span className="ml-1">-</span></Badge>)}
                        {circle > 0 && (<Badge variant="warning" className="rounded-full ring-1 ring-yellow-500/40"><span className="tabular-nums">{circle}</span><span className="ml-1">◯</span></Badge>)}
                        {pending > 0 && (<Badge variant="outline" className="pulse">Pending: <span className="ml-1 tabular-nums">{pending}</span></Badge>)}
                        {total === 0 && circle > 0 ? (
                          <Badge variant="warning" className="rounded-full ring-1 ring-yellow-500/40">Total: <span className="ml-1 tabular-nums">{circle}</span><span className="ml-1">◯</span></Badge>
                        ) : (
                          <Badge variant="secondary" className={`${total > 0 ? "text-primary bg-primary/10 border-primary/40" : total < 0 ? "text-destructive bg-destructive/10 border-destructive/40" : "text-muted-foreground"} border`}>Total: <span className="ml-1 tabular-nums">{Math.abs(total)}</span>{total !== 0 && <span className="ml-1">{total > 0 ? "+" : "-"}</span>}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Full Scorecard */}
      <Collapsible open={openDetails} onOpenChange={setOpenDetails}>
        <Card className={`glow-surface ${glow['details'] ? 'glow-active glow-info' : ''}`}>
          <CardHeader className="py-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <CardTitle className="text-base">Full Scorecard</CardTitle>
                <ChevronDown className={`h-4 w-4 transition-transform ${openDetails ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-3">
              {teams.length === 0 ? (
                <div className="text-sm text-muted-foreground">No dogs on the card.</div>
              ) : (
                teams.map((t) => {
                  const cf = (t.custom_fields as any) || {};
                  const entries = Array.isArray(cf.entries) ? cf.entries : [];
                  
                  // Calculate totals for color coding
                  const total = entries.reduce((sum: number, e: any) => {
                    if (e.outcome === "+") return sum + e.points;
                    if (e.outcome === "-") return sum - e.points;
                    return sum;
                  }, 0);
                  const circleTotal = entries.reduce((sum: number, e: any) => e.outcome === "o" ? sum + e.points : sum, 0);
                  const showCircleAsTotal = total === 0 && circleTotal > 0;
                  
                  return (
                    <div key={t.id} className={`border rounded-md p-2 ${glow[`dog:${t.id}`] ? `glow-active ${
                      glow[`dog:${t.id}`]!.variant === 'success' ? 'glow-success' :
                      glow[`dog:${t.id}`]!.variant === 'danger' ? 'glow-danger' :
                      glow[`dog:${t.id}`]!.variant === 'warning' ? 'glow-warning' :
                      glow[`dog:${t.id}`]!.variant === 'info' ? 'glow-info' : 'glow-pending' }` : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium flex items-center gap-2">
                          <span className="inline-block h-2 w-2 rounded-full" style={{ background: t.team_color || 'hsl(var(--primary))' }} />
                          <span className="truncate">{t.team_name}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs bg-background/50 rounded px-2 py-1 border">
                          {showCircleAsTotal ? (
                            <>
                              <span className="font-bold">Total: </span>
                              <span className="font-bold rounded-full ring-2 ring-yellow-500 px-2 py-0.5 text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/30">{circleTotal}</span>
                            </>
                          ) : (
                            <>
                              <span className="font-bold">Total: {Math.abs(total)}</span>
                              {total > 0 && <span className="font-bold text-lg text-green-600">+</span>}
                              {total < 0 && <span className="font-bold text-lg text-red-600">–</span>}
                            </>
                          )}
                        </div>
                      </div>
                      {entries.length > 0 ? (
                        <div className="space-y-1">
                          {entries.map((e: any) => {
                            const color = e.outcome === "+"
                              ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/40"
                              : e.outcome === "-"
                              ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/40"
                              : e.outcome === "o"
                              ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800/40"
                              : "bg-muted/20 border-muted/40";
                            
                            const typeColor = e.type === "strike" 
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200" 
                              : "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-200";
                            
                            return (
                              <div key={e.id} className={`flex items-center justify-between text-xs border rounded p-1 ${color}`}>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className={`capitalize ${typeColor}`}>{e.type}</Badge>
                                  {e.outcome === "o" ? (
                                    <span className="tabular-nums rounded-full ring-2 ring-yellow-500 px-2 py-0.5 text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/30">{e.points}</span>
                                  ) : (
                                    <span className="tabular-nums">{e.points}</span>
                                  )}
                                </div>
                                {e.outcome !== "o" && (
                                  <div className={`font-bold ${
                                    e.outcome === "+" ? "text-green-600 text-lg" : 
                                    e.outcome === "-" ? "text-red-600 text-base" : 
                                    "text-muted-foreground"
                                  }`}>
                                    {e.outcome === '+' ? '+' : e.outcome === '-' ? '–' : e.outcome === '/' ? '╱' : '…'}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">No strikes or trees recorded.</div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};

export default CoonhoundScoreboardViewer;