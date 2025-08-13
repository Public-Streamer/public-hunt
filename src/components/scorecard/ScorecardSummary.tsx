import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronDown, Image, FileText, X } from "lucide-react";
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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  glowClassName?: string;
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
  walk: "Walk",
  babbling: "Babbling 1 Minute",
  notHunting: "Not Hunt",
  goneHunting: "Gone Hunt",
  stationary: "Stationary",
  noBark: "No Bark",
};
const durationsMin: Record<string, number> = {
  tree: 3,
  treeBark2: 2,
  shine: 8,
  trackBark: 6,
  walk: 1,
  babbling: 1,
  notHunting: 15,
  goneHunting: 5,
  stationary: 5,
  noBark: 2,
};
const keys: string[] = [
  "tree",
  "treeBark2",
  "shine",
  "trackBark",
  "walk",
  "babbling",
  "notHunting",
  "goneHunting",
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

export const ScorecardSummary: React.FC<ScorecardSummaryProps> = ({ dogs, timerOverview, castTimers, open: controlledOpen, onOpenChange, glowClassName }) => {
  const activeCast = useMemo(() => castTimers.filter((c) => c.status === "running"), [castTimers]);
  const [uncontrolledOpen, setUncontrolledOpen] = useState<boolean>(controlledOpen ?? false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (v: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(v);
    onOpenChange?.(v);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={`glow-surface ${glowClassName ?? ''}`}>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Scorecard Summary</CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Toggle scorecard summary">
                <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
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
                        <div className="text-base sm:text-lg font-extrabold flex items-center gap-2 text-foreground">
                          <span className="inline-block h-2 w-2 rounded-full" style={{ background: d.color }} />
                          <span className="truncate">{d.name}</span>
                        </div>
                        <div className="text-sm sm:text-base font-semibold text-foreground truncate">
                          Dog: {d.dogName || "—"} • Handler: {d.handler || "—"}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex gap-2">
                          {d.dogPhotoUrl && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-accent"
                                  title="View dog photo"
                                >
                                  <img
                                    src={d.dogPhotoUrl}
                                    alt={`${d.dogName || d.name} photo`}
                                    className="h-6 w-6 rounded object-cover"
                                  />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
                                <DialogHeader>
                                  <DialogTitle>{d.dogName || d.name} - Photo</DialogTitle>
                                </DialogHeader>
                                <div className="mt-4">
                                  <img
                                    src={d.dogPhotoUrl}
                                    alt={`${d.dogName || d.name} photo`}
                                    className="w-full h-auto max-h-[70vh] object-contain rounded"
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          {d.pedigreeImageUrl && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-accent"
                                  title="View pedigree"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                                <DialogHeader>
                                  <DialogTitle>{d.dogName || d.name} - Pedigree</DialogTitle>
                                </DialogHeader>
                                <div className="mt-4">
                                  <img
                                    src={d.pedigreeImageUrl}
                                    alt={`${d.dogName || d.name} pedigree`}
                                    className="w-full h-auto max-h-[70vh] object-contain rounded"
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
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
                              variant="warning"
                              className="rounded-full ring-1 ring-yellow-500/40"
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
                          {total === 0 && circle > 0 ? (
                            <Badge
                              variant="warning"
                              className="rounded-full ring-1 ring-yellow-500/40"
                            >
                              Total: <span className="ml-1 tabular-nums">{circle}</span>
                              <span className="ml-1">◯</span>
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className={`${total > 0 ? "text-primary bg-primary/10 border-primary/40" : total < 0 ? "text-destructive bg-destructive/10 border-destructive/40" : "text-muted-foreground"} border`}
                            >
                              Total: <span className="ml-1 tabular-nums">{Math.abs(total)}</span>
                              {total !== 0 && <span className="ml-1">{total > 0 ? "+" : "-"}</span>}
                            </Badge>
                          )}
                        </div>
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
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default ScorecardSummary;
