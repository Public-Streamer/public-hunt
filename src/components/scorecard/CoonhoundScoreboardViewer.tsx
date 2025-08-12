import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { TimerStatus } from "@/hooks/useCountdown";

interface Props { eventId: string }

type CastTimers = {
  mainHunt?: { status: TimerStatus; remaining: number };
  track?: { status: TimerStatus; remaining: number };
  globalShine?: { status: TimerStatus; remaining: number };
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

  // Tick to re-render formatted timers smoothly
  useEffect(() => {
    const iv = setInterval(() => {
      // No state change needed; trigger re-render by toggling a dummy state if desired
      setTick((t) => (t + 1) % 1000000);
    }, 1000);
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
          if (ct) setCastTimers(ct);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "event_scoreboard", filter: `event_id=eq.${eventId}` },
        (payload) => setTeams((prev) => [...prev, payload.new as TeamRow])
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "event_scoreboard", filter: `event_id=eq.${eventId}` },
        (payload) =>
          setTeams((prev) => prev.map((t) => (t.id === (payload.new as any).id ? (payload.new as TeamRow) : t)))
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
      notHunting: "Not Hunt",
      goneHunting: "Gone Hunt",
      stationary: "Stationary",
      noBark: "No Bark",
    };
    return Object.entries(timers)
      .filter(([k, v]) => typeof v === "object" && (v as any).status === "running")
      .map(([k, v]) => {
        const snap = v as { status: TimerStatus; remaining: number };
        const remaining = liveRemaining(snap.remaining, serverUpdatedAt, snap.status);
        return { key: k, label: labels[k] || k, formatted: formatMMSS(remaining), status: snap.status };
      });
  };

  const castBlocks = [
    { key: "mainHunt", label: "Main Hunt" },
    { key: "track", label: "Track 6:00" },
    { key: "globalShine", label: "Global Shine 8:00" },
  ] as const;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Hunt Timers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {castBlocks.map((b) => {
              const snap = (castTimers as any)[b.key] as { status: TimerStatus; remaining: number } | undefined;
              const running = snap?.status === "running";
              const rem = liveRemaining(snap?.remaining, castTimers.server_updated_at, snap?.status || "idle");
              const formatted = formatMMSS(rem);
              return (
                <div key={b.key} className={`rounded-md p-2 border ${statusCls(snap?.status || "idle")}`}>
                  <div className="flex items-center justify-between text-xs">
                    <span>{b.label}</span>
                    <span className="tabular-nums font-semibold">{formatted}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Dog Timers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {teams.length === 0 ? (
            <div className="text-sm text-muted-foreground">No dogs on the card.</div>
          ) : (
            teams.map((t) => {
              const running = runningDogTimers(t);
              return (
                <div key={t.id} className="border rounded-md p-2">
                  <div className="text-xs font-medium flex items-center gap-2 mb-2">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: t.team_color || "var(--primary)" }} />
                    <span className="truncate">{t.team_name}</span>
                  </div>
                  {running.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {running.map((rt) => (
                        <Badge key={rt.key} variant="secondary" className="text-xs">
                          {rt.label}: {rt.formatted}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">No active timers</div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CoonhoundScoreboardViewer;
