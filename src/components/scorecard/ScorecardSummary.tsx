import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DogData } from "./DogCard";
import type { TimerStatus } from "@/hooks/useCountdown";

export interface CastTimerBlock {
  key: string;
  label: string;
  status: TimerStatus;
  formatted: string;
}

interface DogTimerSnapshotUI {
  formatted: string;
  status: TimerStatus;
}

interface ScorecardSummaryProps {
  dogs: DogData[];
  timerOverview: Record<string, Record<string, DogTimerSnapshotUI>>;
  castTimers: CastTimerBlock[];
}

const statusCls = (s: TimerStatus) =>
  s === "running"
    ? "bg-primary/10 text-primary"
    : s === "paused"
    ? "bg-accent/10 text-accent-foreground"
    : s === "finished"
    ? "bg-destructive/10 text-destructive"
    : "bg-muted text-muted-foreground";

const labelMap: Record<string, string> = {
  tree: "Tree",
  treeBark2: "Tree Bark",
  shine: "Shine",
  trackBark: "Track Bark",
  notHunting: "Not Hunt",
  stationary: "Stationary",
  noBark: "No Bark",
};
const durationsMin: Record<string, number> = {
  tree: 3,
  treeBark2: 2,
  shine: 8,
  trackBark: 6,
  notHunting: 15,
  stationary: 5,
  noBark: 2,
};
const keys: string[] = [
  "tree",
  "treeBark2",
  "shine",
  "trackBark",
  "notHunting",
  "stationary",
  "noBark",
];

const calcTotals = (entries: DogData["entries"]) => {
  let plus = 0;
  let minus = 0;
  let circle = 0;
  let pending = 0;
  for (const e of entries) {
    if (e.outcome === "+") plus += e.points;
    else if (e.outcome === "-") minus += e.points;
    else if (e.outcome === "o") circle += e.points;
    else if (e.outcome === "pending") pending += e.points;
  }
  const total = plus - minus; // circle and pending do not affect net total
  return { total, pending, plus, minus, circle };
};

export const ScorecardSummary: React.FC<ScorecardSummaryProps> = ({ dogs, timerOverview, castTimers }) => {
  const activeCast = useMemo(() => castTimers.filter((c) => c.status === "running"), [castTimers]);

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base">Scorecard Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Active Cast Timers</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {activeCast.length > 0 ? (
              activeCast.map((b) => (
                <div key={b.key} className={`rounded-md p-2 border ${statusCls(b.status)}`}>
                  <div className="flex items-center justify-between text-xs">
                    <span>{b.label}</span>
                    <span className="tabular-nums font-semibold">{b.formatted}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No active cast timers</div>
            )}
          </div>
        </div>

        {/* Per-dog timers + totals */}
        <div className="space-y-3">
          {dogs.map((d) => {
            const snap = timerOverview[d.id];
            const running = snap
              ? keys
                  .map((k) => ({ key: k, t: (snap as any)[k] as DogTimerSnapshotUI }))
                  .filter((x) => x.t && x.t.status === "running")
              : [];
            const { total, pending, plus, minus, circle } = calcTotals(d.entries);
            return (
              <div key={d.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: d.color }} />
                      <span className="truncate">{d.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      Dog: {d.dogName || "—"} • Handler: {d.handler || "—"}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs justify-end">
                    {plus > 0 && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/40">
                        <span className="tabular-nums">{plus}</span>
                        <span className="ml-1">+</span>
                      </Badge>
                    )}
                    {minus > 0 && (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/40">
                        <span className="tabular-nums">{minus}</span>
                        <span className="ml-1">-</span>
                      </Badge>
                    )}
                    {circle > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-accent/10 text-accent border-accent/40 rounded-full ring-1 ring-accent/40"
                      >
                        <span className="tabular-nums">{circle}</span>
                        <span className="ml-1">◯</span>
                      </Badge>
                    )}
                    {pending > 0 && (
                      <Badge variant="outline" className="pulse">
                        Pending: <span className="ml-1 tabular-nums">{pending}</span>
                      </Badge>
                    )}
                    <Badge
                      variant="secondary"
                      className={`${total > 0 ? "text-primary bg-primary/10 border-primary/40" : total < 0 ? "text-destructive bg-destructive/10 border-destructive/40" : "text-muted-foreground"} border`}
                    >
                      Total: <span className="ml-1 tabular-nums">{Math.abs(total)}</span>
                      {total !== 0 && <span className="ml-1">{total > 0 ? "+" : "-"}</span>}
                    </Badge>
                  </div>
                </div>
                {running.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-2">
                    {running.map(({ key, t }) => (
                      <div key={key} className={`rounded-md p-2 border ${statusCls(t.status)}`}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="capitalize">{`${labelMap[key] ?? key} ${durationsMin[key]} minutes`}</span>
                          <span className="tabular-nums font-semibold">{t.formatted}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScorecardSummary;
