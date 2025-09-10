import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCountdown } from "@/hooks/useCountdown";
import type { TimerStatus } from "@/hooks/useCountdown";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { ScorecardSummary } from "./ScorecardSummary";
import type { CastTimerBlock } from "./ScorecardSummary";
import type { DogData } from "./DogCard";
import { ProcessedTimer, useTimerOverview } from "./timer";

interface Props {
  eventId: string;
  isViewer?: boolean;
}

type CastTimers = {
  mainHunt?: { status: TimerStatus; remaining: number };
  track?: { status: TimerStatus; remaining: number };
  globalShine?: { status: TimerStatus; remaining: number };
  babbling?: { status: TimerStatus; remaining: number };
  mainHuntMinutes?: number;
  server_updated_at?: string;
};

type DogTimerSnapshot = Record<
  string,
  { status: TimerStatus; remaining: number }
> & {
  timers_server_updated_at?: string;
};

interface TeamRow {
  id: string;
  team_name: string;
  team_color?: string;
  custom_fields?: any;
}

// Utility to convert team rows to DogData format for ScorecardSummary
function fromTeamRow(row: TeamRow): DogData {
  const cf = row.custom_fields || {};
  const entries = Array.isArray(cf.entries) ? cf.entries : [];
  return {
    id: row.id,
    name: row.team_name,
    color: row.team_color || "#3b82f6",
    entries,
    handler: cf.handler_name || "",
    dogName: cf.dog_name || "",
    cityState: cf.city_state || "",
    breed: cf.breed || "",
    age:
      typeof cf.age === "number" ? cf.age : cf.age ? Number(cf.age) : undefined,
    judgeNotes: cf.judge_notes || "",
    disqualified: !!cf.disqualified,
    dogPhotoUrl: cf.dog_photo_url || "",
    pedigreeImageUrl: cf.pedigree_url || "",
  };
}

function formatMMSS(secs: number) {
  const s = Math.max(0, Math.floor(secs)); // Use Math.floor to remove decimals
  const mStr = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const sStr = (s % 60).toString().padStart(2, "0");
  return `${mStr}:${sStr}`;
}

function liveRemaining(
  remaining: number | undefined,
  serverUpdatedAt: string | undefined,
  status: TimerStatus
): number {
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

/**
 * CoonhoundScorecardViewer - Read-Only Viewer Interface for Coon Hunt Scoreboards
 *
 * This is the VIEWER interface for coon hunt competitions, providing real-time
 * display of scores and timers without editing capabilities. Features include:
 * - Live score updates with visual highlights
 * - Timer displays (hunt, track, shine, individual dog timers)
 * - Real-time synchronization with host interface
 * - Expandable sections for detailed views
 *
 * Data Source: Reads scoreboard_type = 'coon_hunt' from event_scoreboard table
 * Host Interface: See CoonhoundScorecardHost for full editing capabilities
 */
export const CoonhoundScorecardViewer: React.FC<Props> = ({
  eventId,
  isViewer = false,
}) => {
  const [castTimers, setCastTimers] = useState<CastTimers>({});
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const {
    timerOverview,
    fetchTimerOverview,
    finishedTimers,
    setFinishedTimers,
  } = useTimerOverview(eventId);
  // Smooth local UI timers that sync to broadcasts
  const viewHuntTimer = useCountdown(0);
  const viewTrackTimer = useCountdown(6 * 60);
  const viewShineTimer = useCountdown(8 * 60);
  const viewBabbleTimer = useCountdown(60);

  // Debug: verify local viewer timers are advancing
  useEffect(() => {
    console.log("[viewer timers] hunt:", viewHuntTimer.status, viewHuntTimer.formatted,
      "track:", viewTrackTimer.status, viewTrackTimer.formatted,
      "shine:", viewShineTimer.status, viewShineTimer.formatted,
      "babble:", viewBabbleTimer.status, viewBabbleTimer.formatted);
  }, [
    viewHuntTimer.formatted,
    viewHuntTimer.status,
    viewTrackTimer.formatted,
    viewTrackTimer.status,
    viewShineTimer.formatted,
    viewShineTimer.status,
    viewBabbleTimer.formatted,
    viewBabbleTimer.status,
  ]);

  // Realtime channel helpers
  const getClientId = () => {
    // Use sessionStorage so each tab gets a unique presence key
    try {
      const key = "ps-client-id-viewer";
      let id = sessionStorage.getItem(key);
      if (!id) {
        id = crypto.randomUUID();
        sessionStorage.setItem(key, id);
      }
      return id;
    } catch {
      return crypto.randomUUID();
    }
  };
  const clientIdRef = React.useRef<string>(getClientId());

  // Fetch teams via server function (authoritative source) on broadcast events
  const fetchTeams = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "scoreboard-operations",
        {
          body: { action: "fetch", eventId, scoreboardType: "coon_hunt" },
        }
      );
      if (error) throw error;
      const arr = Array.isArray(data) ? data : data?.teams || [];
      setTeams(arr as TeamRow[]);
    } catch (e) {
      console.error("Failed to fetch teams:", e);
    }
  }, [eventId]);

  // Collapsible open states (open by default for viewers to see content)
  const [openHunt, setOpenHunt] = useState(true);
  const [openSummary, setOpenSummary] = useState(true);
  const [openDetails, setOpenDetails] = useState(true);

  // Glow highlights
  const [glow, setGlow] = useState<
    Record<
      string,
      {
        variant: "success" | "danger" | "warning" | "info" | "pending";
        until: number;
      }
    >
  >({});
  const triggerGlow = (
    key: string,
    variant: "success" | "danger" | "warning" | "info" | "pending",
    ms = 5000
  ) => {
    setGlow((prev) => ({
      ...prev,
      [key]: { variant, until: Date.now() + ms },
    }));
  };


  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      const oneMinute = 60 * 1000;

      setFinishedTimers((prev) => {
        const updated = { ...prev };
        let hasChanges = false;

        for (const teamId in updated) {
          for (const timerKey in updated[teamId]) {
            if (now - updated[teamId][timerKey] > oneMinute) {
              delete updated[teamId][timerKey];
              hasChanges = true;
            }
          }
          if (Object.keys(updated[teamId]).length === 0) {
            delete updated[teamId];
            hasChanges = true;
          }
        }

        return hasChanges ? updated : prev;
      });

      fetchTimerOverview();
    }, 5000);

    return () => clearInterval(cleanup);
  }, [fetchTimerOverview]);

  // Cleanup finished timers after 1 minute of strobing
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      const oneMinute = 60 * 1000;

      setFinishedTimers((prev) => {
        const updated = { ...prev };
        let hasChanges = false;

        for (const teamId in updated) {
          for (const timerKey in updated[teamId]) {
            if (now - updated[teamId][timerKey] > oneMinute) {
              delete updated[teamId][timerKey];
              hasChanges = true;
            }
          }
          if (Object.keys(updated[teamId]).length === 0) {
            delete updated[teamId];
            hasChanges = true;
          }
        }

        return hasChanges ? updated : prev;
      });

      // Also refresh timer overview to remove old finished timers
      fetchTimerOverview();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(cleanup);
  }, [fetchTimerOverview]); // Add dependency



  // Initial fetch
  useEffect(() => {
    (async () => {
      const { data: ev } = await supabase
        .from("events")
        .select("metadata")
        .eq("id", eventId)
        .maybeSingle();
      const ct = (ev?.metadata as any)?.scorecard_cast_timers as CastTimers;
      console.log("Initial cast timers loaded:", ct);
      if (ct) {
        setCastTimers(ct);
        // Sync local countdowns so viewer shows correct values immediately
        if (ct.mainHunt)
          viewHuntTimer.syncTo(ct.mainHunt.remaining, ct.mainHunt.status);
        if (ct.track)
          viewTrackTimer.syncTo(ct.track.remaining, ct.track.status);
        if (ct.globalShine)
          viewShineTimer.syncTo(
            ct.globalShine.remaining,
            ct.globalShine.status
          );
        if (ct.babbling)
          viewBabbleTimer.syncTo(ct.babbling.remaining, ct.babbling.status);
      }

      const { data: rows } = await supabase
        .from("event_scoreboard")
        .select("id, team_name, team_color, custom_fields")
        .eq("event_id", eventId)
        .eq("scoreboard_type", "coon_hunt")
        .order("created_at", { ascending: true });
      setTeams(rows || []);
    })();
  }, [eventId]);

  const rtChannelRef = React.useRef<ReturnType<typeof supabase.channel> | null>(
    null
  );
  useEffect(() => {
    const channelName = `event:${eventId}:scorecard`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: clientIdRef.current },
      },
    });

    channel
      .on("broadcast", { event: "score_update" }, (p: any) => {
        const payload = p?.payload || p; // supabase client sends {payload}
        console.log("score update broadcast (viewer)", payload);
        // Visual cues
        setOpenSummary(true);
        setOpenDetails(true);
        const variant =
          payload?.updateKind === "+"
            ? "success"
            : payload?.updateKind === "-"
              ? "danger"
              : payload?.updateKind === "o"
                ? "warning"
                : "info";
        if (payload?.teamId) triggerGlow(`dog:${payload.teamId}`, variant);
        triggerGlow("summary", variant);
        triggerGlow("details", variant);
        // Refresh teams from server (authoritative)
        fetchTeams();
      })
      .on("broadcast", { event: "dog_timer_update" }, (p: any) => {
        const payload = p?.payload || p;
        console.log("dog timer update broadcast (viewer)", payload);
        if (payload?.teamId) triggerGlow(`dog:${payload.teamId}`, "warning");
        setOpenDetails(true);
        // Refresh dog timers snapshot
        fetchTimerOverview();
      })
      .on("broadcast", { event: "cast_timer_update" }, (p: any) => {
        const payload = p?.payload || p;
        console.log("Cast timer update (viewer)", payload);
        const t = payload?.timers;
        if (t) {
          // Sync local countdown hooks for smooth UI
          if (t.mainHunt)
            viewHuntTimer.syncTo(t.mainHunt.remaining, t.mainHunt.status);
          if (t.track) viewTrackTimer.syncTo(t.track.remaining, t.track.status);
          if (t.globalShine)
            viewShineTimer.syncTo(
              t.globalShine.remaining,
              t.globalShine.status
            );
          if (t.babbling)
            viewBabbleTimer.syncTo(t.babbling.remaining, t.babbling.status);
          setCastTimers({
            ...t,
            server_updated_at: new Date().toISOString(),
          });
          console.log("Viewer setCastTimers ->", t);
          setOpenHunt(true);
          triggerGlow("hunt", "warning");
        }
      })
      .on("broadcast", { event: "dog_created" }, () => {
        setOpenDetails(true);
        triggerGlow("details", "info");
        fetchTeams();
      });

    console.log(
      "Viewer subscribing to channel:",
      channelName,
      "client:",  
      clientIdRef.current
    );
    channel.subscribe((status) => {
      console.log("Viewer channel status:", status);
    });
    rtChannelRef.current = channel;
    return () => {
      if (rtChannelRef.current) supabase.removeChannel(rtChannelRef.current);
    };
    // Intentionally only depend on eventId to keep a stable subscription
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const runningDogTimers = (t: TeamRow) => {
    const timers = timerOverview[t.id] || {};
    return Object.entries(timers).map(([key, timer]) => {
      const timerData = timer as ProcessedTimer;
      return {
        key,
        label: key, // You might want to map this to a display name
        formatted: timerData.formatted,
        status: timerData.status,
      };
    });
  };

  const castBlocks = [
    { key: "mainHunt", label: "Main Hunt" },
    { key: "track", label: "Track 6 minutes" },
    { key: "globalShine", label: "Global Shine 8 minutes" },
    { key: "babbling", label: "Babbling 1 Minute 1:00" },
  ] as const;

  const visibleCastBlocks = castBlocks.filter((b) => {
    const snap = (castTimers as any)[b.key] as
      | { status: TimerStatus; remaining: number }
      | undefined;
    return snap?.status === "running";
  });

  const calcTotals = (entries: any[]) => {
    let plus = 0,
      minus = 0,
      circle = 0,
      pending = 0;
    for (const e of entries || []) {
      if (e.outcome === "+") plus += e.points;
      else if (e.outcome === "-") minus += e.points;
      else if (e.outcome === "o") circle += e.points;
      else if (e.outcome === "pending") pending += e.points;
    }
    const total = plus - minus;
    return { plus, minus, circle, pending, total };
  };

  // Convert teams to DogData format for ScorecardSummary
  const dogsData = useMemo(() => teams.map(fromTeamRow), [teams]);

  // Convert cast timers to format expected by ScorecardSummary
  // Use local countdown hooks so UI updates smoothly between broadcasts
  const castTimersForSummary = useMemo(() => {
    const results: CastTimerBlock[] = [];
    const huntMinutes = castTimers.mainHuntMinutes || 120;
    const include = new Set(["running", "paused", "finished"]);

    if (include.has(viewHuntTimer.status)) {
      results.push({
        key: "mainHunt",
        label: `Main Hunt ${huntMinutes} minutes`,
        status: viewHuntTimer.status,
        formatted: viewHuntTimer.formatted,
      });
    }
    if (include.has(viewTrackTimer.status)) {
      results.push({
        key: "track",
        label: "Track 6 minutes",
        status: viewTrackTimer.status,
        formatted: viewTrackTimer.formatted,
      });
    }
    if (include.has(viewShineTimer.status)) {
      results.push({
        key: "globalShine",
        label: "Global Shine 8 minutes",
        status: viewShineTimer.status,
        formatted: viewShineTimer.formatted,
      });
    }
    if (include.has(viewBabbleTimer.status)) {
      results.push({
        key: "babbling",
        label: "Babbling 1 Minute",
        status: viewBabbleTimer.status,
        formatted: viewBabbleTimer.formatted,
      });
    }

    return results;
  }, [
    castTimers.mainHuntMinutes,
    viewHuntTimer.formatted,
    viewHuntTimer.status,
    viewTrackTimer.formatted,
    viewTrackTimer.status,
    viewShineTimer.formatted,
    viewShineTimer.status,
    viewBabbleTimer.formatted,
    viewBabbleTimer.status,
  ]);

  return (
    <div className="space-y-4">
      {/* Hunt Timers - Only show for streamers, judges, and event creators, hide for viewers */}
      {!isViewer && (
        <Collapsible open={openHunt} onOpenChange={setOpenHunt}>
          <Card
            className={`glow-surface ${
              glow["hunt"] ? "glow-active glow-warning" : ""
            }`}
          >
            <CardHeader className="py-3">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-0 h-auto"
                >
                  <CardTitle className="text-base">Hunt Timers</CardTitle>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      openHunt ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {visibleCastBlocks.length > 0 ? (
                    visibleCastBlocks.map((b) => {
                      const snap = (castTimers as any)[b.key] as
                        | { status: TimerStatus; remaining: number }
                        | undefined;
                      const rem = liveRemaining(
                        snap?.remaining,
                        castTimers.server_updated_at,
                        snap?.status || "idle"
                      );
                      const formatted = formatMMSS(rem);
                      return (
                        <div
                          key={b.key}
                          className={`rounded-md p-2 border ${statusCls(
                            snap?.status || "idle"
                          )}`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span>
                              {b.key === "mainHunt" &&
                              (castTimers as any).mainHuntMinutes
                                ? `Main Hunt ${
                                    (castTimers as any).mainHuntMinutes
                                  } minutes`
                                : b.label}
                            </span>
                            <span className="tabular-nums font-semibold">
                              {formatted}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No active cast timers
                    </div>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Scorecard Summary - Now uses the same component as judges */}
      <ScorecardSummary
        dogs={dogsData}
        timerOverview={timerOverview}
        castTimers={castTimersForSummary}
        open={openSummary}
        onOpenChange={setOpenSummary}
        glowClassName={glow["summary"] ? "glow-active glow-info" : ""}
      />

      {/* Full Scorecard */}
      <Collapsible open={openDetails} onOpenChange={setOpenDetails}>
        <Card
          className={`glow-surface ${
            glow["details"] ? "glow-active glow-info" : ""
          }`}
        >
          <CardHeader className="py-3">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-0 h-auto"
              >
                <CardTitle className="text-base">Full Scorecard</CardTitle>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    openDetails ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-3">
              {teams.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No dogs on the card.
                </div>
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
                  const circleTotal = entries.reduce(
                    (sum: number, e: any) =>
                      e.outcome === "o" ? sum + e.points : sum,
                    0
                  );
                  const showCircleAsTotal = total === 0 && circleTotal > 0;

                  return (
                    <div
                      key={t.id}
                      className={`border rounded-md p-2 ${
                        glow[`dog:${t.id}`]
                          ? `glow-active ${
                              glow[`dog:${t.id}`]!.variant === "success"
                                ? "glow-success"
                                : glow[`dog:${t.id}`]!.variant === "danger"
                                  ? "glow-danger"
                                  : glow[`dog:${t.id}`]!.variant === "warning"
                                    ? "glow-warning"
                                    : glow[`dog:${t.id}`]!.variant === "info"
                                      ? "glow-info"
                                      : "glow-pending"
                            }`
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium flex items-center gap-2">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{
                              background: t.team_color || "hsl(var(--primary))",
                            }}
                          />
                          <span className="truncate">{t.team_name}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs bg-background/50 rounded px-2 py-1 border">
                          {showCircleAsTotal ? (
                            <>
                              <span className="font-bold">Total: </span>
                              <span className="font-bold rounded-full ring-2 ring-yellow-500 px-2 py-0.5 text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/30">
                                {circleTotal}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="font-bold">
                                Total: {Math.abs(total)}
                              </span>
                              {total > 0 && (
                                <span className="font-bold text-lg text-green-600">
                                  +
                                </span>
                              )}
                              {total < 0 && (
                                <span className="font-bold text-lg text-red-600">
                                  –
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      {entries.length > 0 ? (
                        <div className="space-y-1">
                          {entries.map((e: any) => {
                            const color =
                              e.outcome === "+"
                                ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/40"
                                : e.outcome === "-"
                                  ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/40"
                                  : e.outcome === "o"
                                    ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800/40"
                                    : "bg-muted/20 border-muted/40";

                            const typeColor =
                              e.type === "strike"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200"
                                : "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-200";

                            return (
                              <div
                                key={e.id}
                                className={`flex items-center justify-between text-xs border rounded p-1 ${color}`}
                              >
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="secondary"
                                    className={`capitalize ${typeColor}`}
                                  >
                                    {e.type}
                                  </Badge>
                                  {e.outcome === "o" ? (
                                    <span className="tabular-nums rounded-full ring-2 ring-yellow-500 px-2 py-0.5 text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/30">
                                      {e.points}
                                    </span>
                                  ) : (
                                    <span className="tabular-nums">
                                      {e.points}
                                    </span>
                                  )}
                                </div>
                                {e.outcome !== "o" && (
                                  <div
                                    className={`font-bold ${
                                      e.outcome === "+"
                                        ? "text-green-600 text-lg"
                                        : e.outcome === "-"
                                          ? "text-red-600 text-base"
                                          : "text-muted-foreground"
                                    }`}
                                  >
                                    {e.outcome === "+"
                                      ? "+"
                                      : e.outcome === "-"
                                        ? "–"
                                        : e.outcome === "/"
                                          ? "╱"
                                          : "…"}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          No strikes or trees recorded.
                        </div>
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

export default CoonhoundScorecardViewer;
