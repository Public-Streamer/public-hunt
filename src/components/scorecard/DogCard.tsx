import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, ChevronDown } from "lucide-react";
import { TimerControl } from "./TimerControl";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { useCountdown, TimerStatus } from "@/hooks/useCountdown";
import { toast } from "@/hooks/use-toast";
export type EntryOutcome = "pending" | "+" | "-" | "o" | "/"; // plus / minus / circle / slash
export type EntryType = "strike" | "tree";

export interface ScoreEntry {
  id: string;
  type: EntryType;
  points: number; // magnitude only
  outcome: EntryOutcome; // pending until resolved
  at?: string; // ISO timestamp
}

export interface DogData {
  id: string; // team id
  name: string; // team_name
  color: string; // team_color
  entries: ScoreEntry[];
  handler?: string;
  dogName?: string; // dog's registered name
  cityState?: string; // City, State
  breed?: string;
  age?: number;
  judgeNotes?: string;
  disqualified?: boolean; // scratched/disqualified status
}

interface DogCardProps {
  dog: DogData;
  onChange: (dog: DogData, newTotal: number) => void; // bubble up updates
  onTimerSnapshot?: (
    dogId: string,
    snapshot: {
      tree: { formatted: string; status: TimerStatus };
      treeBark2: { formatted: string; status: TimerStatus };
      shine: { formatted: string; status: TimerStatus };
      trackBark: { formatted: string; status: TimerStatus };
      notHunting: { formatted: string; status: TimerStatus };
      stationary: { formatted: string; status: TimerStatus };
      noBark: { formatted: string; status: TimerStatus };
      walk: { formatted: string; status: TimerStatus };
    }
  ) => void;
  onTimerAction?: (
    dogId: string,
    timers: Record<string, { status: TimerStatus; remaining: number }>
  ) => void;
  canEdit?: boolean;
}

const quickStrike = [100, 75, 50, 25];
const quickTree = [125, 75, 50, 25];

export const DogCard: React.FC<DogCardProps> = ({ dog, onChange, onTimerSnapshot, onTimerAction, canEdit = true }) => {
  const [draft, setDraft] = useState<DogData>(dog);
  const [customPoints, setCustomPoints] = useState<string>("");
  const [treeMinusBlink, setTreeMinusBlink] = useState(false);

  const treeTimer = useCountdown(3 * 60, {
    onComplete: () => {
      toast({ title: "Tree time finished", description: `${draft.name}: tree time ended` });
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { (navigator as any).vibrate?.(200); } catch {}
      }
    },
  });
  const treeBark2Timer = useCountdown(2 * 60, {
    onComplete: () => {
      toast({ title: "Tree bark timer expired", description: `${draft.name}: 2-minute tree bark rule expired` });
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { (navigator as any).vibrate?.(200); } catch {}
      }
      // Auto-minus the most recent pending tree entry (if any), reset Tree timer, and blink alert
      let updatedEntries = draft.entries;
      const lastPendingTreeIndex = [...draft.entries]
        .map((e, i) => ({ e, i }))
        .filter(({ e }) => e.type === "tree" && e.outcome === "pending")
        .pop()?.i;
      if (lastPendingTreeIndex !== undefined) {
        updatedEntries = draft.entries.map((e, i) => (i === lastPendingTreeIndex ? { ...e, outcome: "-" as const } : e));
      }
      const updated: DogData = { ...draft, entries: updatedEntries };
      setDraft(updated);
      onChange(updated, computeTotal(updated.entries));
      treeTimer.reset(3 * 60);
      setTreeMinusBlink(true);
      setTimeout(() => setTreeMinusBlink(false), 4000);
      onTimerAction?.(draft.id, snapshotTimers());
    },
  });
  const shineTimer = useCountdown(8 * 60, {
    onComplete: () => {
      toast({ title: "Shine time finished", description: `${draft.name}: shine time ended` });
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { (navigator as any).vibrate?.(200); } catch {}
      }
    },
  });
  const trackBarkTimer = useCountdown(6 * 60, {
    onComplete: () => {
      toast({ title: "Track bark time finished", description: `${draft.name}: track bark time ended` });
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { (navigator as any).vibrate?.(200); } catch {}
      }
    },
  });
  const walkTimer = useCountdown(1 * 60, {
    onComplete: () => {
      toast({ title: "Walk time finished", description: `${draft.name}: 1-minute walk ended` });
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { (navigator as any).vibrate?.(200); } catch {}
      }
    },
  });
  const notHuntingTimer = useCountdown(15 * 60, {
    onComplete: () => {
      toast({ title: "Not hunting time finished", description: `${draft.name}: 15-minute timer ended` });
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { (navigator as any).vibrate?.(200); } catch {}
      }
    },
  });
  const goneHuntingTimer = useCountdown(5 * 60, {
    onComplete: () => {
      // Scratch dog when Gone Hunt expires
      toast({ title: "Gone Hunt expired — Dog scratched", description: `${draft.name} is scratched from the hunt`, variant: "destructive" });
      const updated: DogData = { ...draft, disqualified: true };
      setDraft(updated);
      onChange(updated, computeTotal(updated.entries));
      // Reset related timers for clarity
      goneHuntingTimer.reset(5 * 60);
      notHuntingTimer.reset(15 * 60);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { (navigator as any).vibrate?.(200); } catch {}
      }
      onTimerAction?.(draft.id, snapshotTimers());
    },
  });
  const stationaryTimer = useCountdown(5 * 60, {
    onComplete: () => {
      toast({ title: "Stationary finished", description: `${draft.name}: 5-minute stationary completed` });
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { (navigator as any).vibrate?.(200); } catch {}
      }
    },
  });
  const stationaryNonBarkTimer = useCountdown(2 * 60, {
    onComplete: () => {
      toast({ title: "No Bark 2:00 expired", description: `${draft.name}: auto-minus pending tree and reset stationary` });
      // Auto-minus the most recent pending tree entry (if any)
      let updatedEntries = draft.entries;
      const lastPendingTreeIndex = [...draft.entries]
        .map((e, i) => ({ e, i }))
        .filter(({ e }) => e.type === "tree" && e.outcome === "pending")
        .pop()?.i;
      if (lastPendingTreeIndex !== undefined) {
        updatedEntries = draft.entries.map((e, i) => (i === lastPendingTreeIndex ? { ...e, outcome: "-" as const } : e));
      }
      const updated: DogData = { ...draft, entries: updatedEntries };
      setDraft(updated);
      onChange(updated, computeTotal(updated.entries));
      // Reset Stationary timer as part of linked behavior
      stationaryTimer.reset(5 * 60);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { (navigator as any).vibrate?.(200); } catch {}
      }
      onTimerAction?.(draft.id, snapshotTimers());
    },
  });
  useEffect(() => {
    onTimerSnapshot?.(draft.id, {
      tree: { formatted: treeTimer.formatted, status: treeTimer.status },
      treeBark2: { formatted: treeBark2Timer.formatted, status: treeBark2Timer.status },
      shine: { formatted: shineTimer.formatted, status: shineTimer.status },
      trackBark: { formatted: trackBarkTimer.formatted, status: trackBarkTimer.status },
      walk: { formatted: walkTimer.formatted, status: walkTimer.status },
      notHunting: { formatted: notHuntingTimer.formatted, status: notHuntingTimer.status },
      stationary: { formatted: stationaryTimer.formatted, status: stationaryTimer.status },
      noBark: { formatted: stationaryNonBarkTimer.formatted, status: stationaryNonBarkTimer.status },
    });
  }, [
    draft.id,
    treeTimer.formatted, treeTimer.status,
    treeBark2Timer.formatted, treeBark2Timer.status,
    shineTimer.formatted, shineTimer.status,
    trackBarkTimer.formatted, trackBarkTimer.status,
    walkTimer.formatted, walkTimer.status,
    notHuntingTimer.formatted, notHuntingTimer.status,
    stationaryTimer.formatted, stationaryTimer.status,
    stationaryNonBarkTimer.formatted, stationaryNonBarkTimer.status,
    onTimerSnapshot,
  ]);

  const computeTotal = (entries: ScoreEntry[]) => {
    return entries.reduce((sum, e) => {
      if (e.outcome === "+") return sum + e.points;
      if (e.outcome === "-") return sum - e.points;
      if (e.outcome === "o") return sum; // circle doesn't change
      if (e.outcome === "/") return sum; // slashed strike doesn't change
      return sum; // pending doesn't count
    }, 0);
  };

  const total = useMemo(() => computeTotal(draft.entries), [draft.entries]);

  const totalAbs = Math.abs(total);
  const totalIndicator = total > 0 ? "+" : total < 0 ? "–" : "";
  const circleTotal = useMemo(() => {
    return draft.entries.reduce((sum, e) => (e.outcome === "o" ? sum + e.points : sum), 0);
  }, [draft.entries]);
  const showCircleAsTotal = total === 0 && circleTotal > 0;

  const hasPending = draft.entries.some((e) => e.outcome === "pending");

  const addEntry = (type: EntryType, points: number) => {
    const newEntry: ScoreEntry = { id: crypto.randomUUID(), type, points, outcome: "pending", at: new Date().toISOString() };
    const updated: DogData = { ...draft, entries: [...draft.entries, newEntry] };
    setDraft(updated);
    onChange(updated, computeTotal(updated.entries));
  };

  const setOutcome = (id: string, outcome: EntryOutcome) => {
    const entry = draft.entries.find((e) => e.id === id);
    if (entry?.type === "tree" && treeTimer.status !== "finished") {
      toast({ title: "Tree timer active", description: "Cannot score tree until 3:00 expires", variant: "destructive" });
      return;
    }
    const updatedEntries = draft.entries.map((e) => (e.id === id ? { ...e, outcome } : e));
    const updated: DogData = { ...draft, entries: updatedEntries };
    setDraft(updated);
    onChange(updated, computeTotal(updated.entries));
  };
  const removeEntry = (id: string) => {
    const updated: DogData = { ...draft, entries: draft.entries.filter((e) => e.id !== id) };
    setDraft(updated);
    onChange(updated, computeTotal(updated.entries));
  };

  const startNonBarkGuarded = () => {
    if (stationaryTimer.status !== "running") {
      toast({ title: "Start Stationary first", description: "Begin the 5-minute stationary before starting the 2-minute no-bark", variant: "destructive" });
      return;
    }
    stationaryNonBarkTimer.start();
    onTimerAction?.(draft.id, snapshotTimers());
  };
  
  const startGoneHuntingGuarded = () => {
    if (notHuntingTimer.status !== "running") {
      toast({
        title: "Start Not Hunting first",
        description: "Begin the 15-minute not hunting timer before starting the 5-minute gone hunting",
        variant: "destructive",
      });
      return;
    }
    goneHuntingTimer.start();
    onTimerAction?.(draft.id, snapshotTimers());
  };

  const onBlurCommit = () => onChange(draft, total);
  // Lightweight custom timer component (per-dog)
  const CustomTimer: React.FC<{ cfg: { id: string; label: string; seconds: number }; onRemove: () => void }> = ({ cfg, onRemove }) => {
    const t = useCountdown(cfg.seconds, {
      onComplete: () => {
        toast({ title: `${cfg.label} finished`, description: `${draft.name}` });
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          try { (navigator as any).vibrate?.(200); } catch {}
        }
      },
    });
    return (
      <div className="relative">
        <TimerControl label={cfg.label} formatted={t.formatted} status={t.status} onStart={t.start} onPause={t.pause} onReset={t.reset} />
        <Button size="sm" variant="ghost" className="absolute top-2 right-2 h-7 w-7 p-0" onClick={onRemove} title="Remove timer">
          <Plus className="h-4 w-4 rotate-45" />
        </Button>
      </div>
    );
  };

  const [customTimers, setCustomTimers] = useState<{ id: string; label: string; seconds: number }[]>([]);
  const [open, setOpen] = useState(true);

  const runningTimers = useMemo(
    () => [
      { key: "tree", label: "Tree", t: treeTimer },
      { key: "treeBark2", label: "Tree Bark", t: treeBark2Timer },
      { key: "shine", label: "Shine", t: shineTimer },
      { key: "trackBark", label: "Track Bark", t: trackBarkTimer },
      { key: "walk", label: "Walk", t: walkTimer },
      { key: "notHunting", label: "Not Hunt", t: notHuntingTimer },
      { key: "goneHunting", label: "Gone Hunt", t: goneHuntingTimer },
      { key: "stationary", label: "Stationary", t: stationaryTimer },
      { key: "noBark", label: "No Bark", t: stationaryNonBarkTimer },
    ].filter(({ t }) => t.status === "running"),
    [
      treeTimer.status,
      treeBark2Timer.status,
      shineTimer.status,
      trackBarkTimer.status,
      walkTimer.status,
      notHuntingTimer.status,
      goneHuntingTimer.status,
      stationaryTimer.status,
      stationaryNonBarkTimer.status,
    ]
  );

  const snapshotTimers = useCallback(() => ({
    tree: { status: treeTimer.status, remaining: treeTimer.remaining },
    treeBark2: { status: treeBark2Timer.status, remaining: treeBark2Timer.remaining },
    shine: { status: shineTimer.status, remaining: shineTimer.remaining },
    trackBark: { status: trackBarkTimer.status, remaining: trackBarkTimer.remaining },
    walk: { status: walkTimer.status, remaining: walkTimer.remaining },
    notHunting: { status: notHuntingTimer.status, remaining: notHuntingTimer.remaining },
    goneHunting: { status: goneHuntingTimer.status, remaining: goneHuntingTimer.remaining },
    stationary: { status: stationaryTimer.status, remaining: stationaryTimer.remaining },
    noBark: { status: stationaryNonBarkTimer.status, remaining: stationaryNonBarkTimer.remaining },
  }), [
    treeTimer.status, treeTimer.remaining,
    treeBark2Timer.status, treeBark2Timer.remaining,
    shineTimer.status, shineTimer.remaining,
    trackBarkTimer.status, trackBarkTimer.remaining,
    walkTimer.status, walkTimer.remaining,
    notHuntingTimer.status, notHuntingTimer.remaining,
    goneHuntingTimer.status, goneHuntingTimer.remaining,
    stationaryTimer.status, stationaryTimer.remaining,
    stationaryNonBarkTimer.status, stationaryNonBarkTimer.remaining,
  ]);


  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border-2">
        <CardHeader className="py-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: draft.color }} />
              <span className="truncate">{draft.name}</span>
              {hasPending && <Badge variant="outline" className="ml-2">Pending</Badge>}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              {showCircleAsTotal ? (
                <>
                  <span className="tabular-nums">Total: {circleTotal}</span>
                  <span className="font-bold">◯</span>
                </>
              ) : (
                <>
                  <span className="tabular-nums">Total: {totalAbs}</span>
                  {totalIndicator && <span className="font-bold">{totalIndicator}</span>}
                </>
              )}
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-8 w-8 p-0 rounded-full"
                  aria-label={open ? "Collapse" : "Expand"}
                  title={open ? "Collapse" : "Expand"}
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : "rotate-0"}`} />
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardTitle>
        </CardHeader>

        {!open && (
          <CardContent className="pt-0">
            {runningTimers.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {runningTimers.map((rt) => (
                  <Badge key={rt.key} variant="secondary" className="text-xs">
                    {rt.label}: {rt.t.formatted}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">No active timers</div>
            )}
          </CardContent>
        )}

        <CollapsibleContent asChild>
          <CardContent className="space-y-3">
            {treeMinusBlink && (
              <div className="rounded-md border border-destructive bg-destructive/10 text-destructive font-semibold p-2 animate-pulse">
                Dog minused on tree
              </div>
            )}
            {/* Timers Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
              <div title="Tree timers are linked: if Bark 2:00 expires, dog is minused and Tree resets.">
                <div className="relative rounded-md border border-primary/40 bg-primary/5 p-2 space-y-2 pl-3 sm:pl-4">
                  <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-primary/70 rounded-l-md" />
                  <div className="text-xs sm:text-sm font-semibold text-primary">Linked to Tree Bark</div>
                  <TimerControl label="Tree 3:00" formatted={treeTimer.formatted} status={treeTimer.status} onStart={treeTimer.start} onPause={treeTimer.pause} onReset={treeTimer.reset} className="border-primary/40" />
                  <TimerControl label="Tree Bark 2:00" formatted={treeBark2Timer.formatted} status={treeBark2Timer.status} onStart={treeBark2Timer.start} onPause={treeBark2Timer.pause} onReset={treeBark2Timer.reset} className="border-primary/40" />
                </div>
              </div>
              <div title="Shine Timer: Time allowed to search the tree for coon.">
                <TimerControl label="Shine 8:00" formatted={shineTimer.formatted} status={shineTimer.status} onStart={shineTimer.start} onPause={shineTimer.pause} onReset={shineTimer.reset} />
              </div>
              <div title="Track Bark Timer: 6 minutes for strike requirement.">
                <TimerControl label="Track Bark 6:00" formatted={trackBarkTimer.formatted} status={trackBarkTimer.status} onStart={trackBarkTimer.start} onPause={trackBarkTimer.pause} onReset={trackBarkTimer.reset} />
              </div>
              <div title="Walk Timer: 1 minute for walking between trees.">
                <TimerControl label="Walk 1:00" formatted={walkTimer.formatted} status={walkTimer.status} onStart={walkTimer.start} onPause={walkTimer.pause} onReset={walkTimer.reset} />
              </div>
              <div title="Not Hunting Timer: 15 minutes for non-hunting dog.">
                <div className="relative rounded-md border border-primary/40 bg-primary/5 p-2 space-y-2 pl-3 sm:pl-4">
                  <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-primary/70 rounded-l-md" />
                  <div className="text-xs sm:text-sm font-semibold text-primary">Linked to Gone Hunt</div>
                  <TimerControl
                    label="Not Hunting 15:00"
                    formatted={notHuntingTimer.formatted}
                    status={notHuntingTimer.status}
                    onStart={notHuntingTimer.start}
                    onPause={notHuntingTimer.pause}
                    onReset={() => { notHuntingTimer.reset(); goneHuntingTimer.reset(); }}
                    className="border-primary/40"
                  />
                  <TimerControl
                    label="Gone Hunt 5:00"
                    formatted={goneHuntingTimer.formatted}
                    status={goneHuntingTimer.status}
                    onStart={startGoneHuntingGuarded}
                    onPause={goneHuntingTimer.pause}
                    onReset={() => { goneHuntingTimer.reset(); }}
                    className="border-primary/40"
                  />
                </div>
              </div>
              <div title="Stationary: 5 minutes; start 2-minute no-bark if barking stops.">
                <div className="relative rounded-md border border-secondary/40 bg-secondary/5 p-2 space-y-2 pl-3 sm:pl-4">
                  <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-secondary/70 rounded-l-md" />
                  <div className="text-xs sm:text-sm font-semibold text-secondary">Linked to No Bark</div>
                  <TimerControl
                    label="Stationary 5:00"
                    formatted={stationaryTimer.formatted}
                    status={stationaryTimer.status}
                    onStart={stationaryTimer.start}
                    onPause={stationaryTimer.pause}
                    onReset={() => { stationaryTimer.reset(); stationaryNonBarkTimer.reset(); }}
                    className="border-secondary/40"
                  />
                  <TimerControl
                    label="No Bark 2:00"
                    formatted={stationaryNonBarkTimer.formatted}
                    status={stationaryNonBarkTimer.status}
                    onStart={startNonBarkGuarded}
                    onPause={stationaryNonBarkTimer.pause}
                    onReset={() => { stationaryNonBarkTimer.reset(); }}
                    className="border-secondary/40"
                  />
                </div>
              </div>
            </div>

            {/* Quick add buttons */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Quick Add:</span>
              {quickStrike.map((p) => (
                <Button key={`s${p}`} size="sm" variant="secondary" onClick={() => addEntry("strike", p)}>
                  Strike +{p}
                </Button>
              ))}
              {quickTree.map((p) => (
                <Button key={`t${p}`} size="sm" onClick={() => addEntry("tree", p)}>
                  Tree +{p}
                </Button>
              ))}
              <div className="flex items-center gap-2 ml-2">
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="Custom"
                  className="h-9 w-24"
                  value={customPoints}
                  onChange={(e) => setCustomPoints(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const v = parseFloat(customPoints);
                      if (!isNaN(v) && v > 0) {
                        addEntry("tree", v);
                        setCustomPoints("");
                      }
                    }
                  }}
                />
                <Button size="sm" variant="secondary" onClick={() => { const v = parseFloat(customPoints); if (!isNaN(v) && v > 0) { addEntry("strike", v); setCustomPoints(""); } }}>
                  Add Strike
                </Button>
                <Button size="sm" onClick={() => { const v = parseFloat(customPoints); if (!isNaN(v) && v > 0) { addEntry("tree", v); setCustomPoints(""); } }}>
                  Add Tree
                </Button>
              </div>
            </div>

            {/* Entries List */}
            <div className="space-y-2">
              {draft.entries.length === 0 ? (
                <div className="text-sm text-muted-foreground">No entries yet.</div>
              ) : (
                draft.entries.map((e) => {
                  const color = e.outcome === "pending"
                    ? "bg-accent/10 border-accent/30"
                    : e.outcome === "+"
                    ? "bg-primary/20 border-primary/40 transition-colors"
                    : e.outcome === "-"
                    ? "bg-destructive/20 border-destructive/40 transition-colors"
                    : e.outcome === "o"
                    ? "bg-secondary/20 border-secondary/40 transition-colors" // circle
                    : "bg-muted/20 border-muted/40 transition-colors"; // slash
                  const renderPoints = () => {
                    if (e.outcome === "o") {
                      return (
                        <span className="font-medium rounded-full ring-2 ring-accent px-2 py-0.5">
                          {e.points}
                        </span>
                      );
                    }
                    if (e.outcome === "/") {
                      return (
                        <span className="relative inline-flex items-center justify-center px-2 py-0.5">
                          <span className="font-medium">{e.points}</span>
                          <span
                            aria-hidden
                            className="pointer-events-none absolute left-0 right-0 top-1/2 h-[2px] bg-muted-foreground/60 rotate-45 origin-center"
                          />
                        </span>
                      );
                    }
                    return <span className="font-medium">{e.points}</span>;
                  };
                  return (
                    <div key={e.id} className={`rounded-md border p-2 ${color}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="secondary" className="capitalize">{e.type}</Badge>
                          {renderPoints()}
                          {e.outcome !== "pending" && (
                            <span className="ml-1 font-bold">
                              {e.outcome === "+" ? "+" : e.outcome === "-" ? "–" : e.outcome === "o" ? "◯" : "╱"}
                            </span>
                          )}
                          {e.outcome === "pending" && <Badge variant="outline">pending</Badge>}
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap overflow-x-auto max-w-full">
                          <Button size="sm" variant="outline" className="h-10 w-10 sm:h-12 sm:w-12 p-0 text-base sm:text-xl font-bold hover-scale shrink-0" onClick={() => setOutcome(e.id, "+")} title="Plus points" aria-label="Plus points">+</Button>
                          <Button size="sm" variant="outline" className="h-10 w-10 sm:h-12 sm:w-12 p-0 text-base sm:text-xl font-bold hover-scale shrink-0" onClick={() => setOutcome(e.id, "-")} title="Minus points" aria-label="Minus points">–</Button>
                          <Button size="sm" variant="outline" className="h-10 w-10 sm:h-12 sm:w-12 p-0 text-base sm:text-xl font-bold hover-scale shrink-0" onClick={() => setOutcome(e.id, "o")} title="Circle" aria-label="Circle">◯</Button>
                          <Button size="sm" variant="outline" className="h-10 w-10 sm:h-12 sm:w-12 p-0 text-base sm:text-xl font-bold hover-scale shrink-0" onClick={() => setOutcome(e.id, "/")} title="Slash" aria-label="Slash">╱</Button>
                          <Button size="sm" variant="outline" className="h-10 w-10 sm:h-12 sm:w-12 p-0 text-[10px] sm:text-xs font-semibold hover-scale shrink-0" onClick={() => removeEntry(e.id)} title="Delete" aria-label="Delete">Del</Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Dog/Team Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <Input
                placeholder="Team name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                onBlur={onBlurCommit}
              />
              <Input
                placeholder="Dog name"
                value={draft.dogName || ""}
                onChange={(e) => setDraft({ ...draft, dogName: e.target.value })}
                onBlur={onBlurCommit}
              />
              <Input
                placeholder="Handler name"
                value={draft.handler || ""}
                onChange={(e) => setDraft({ ...draft, handler: e.target.value })}
                onBlur={onBlurCommit}
              />
              <Input
                placeholder="City, State"
                value={draft.cityState || ""}
                onChange={(e) => setDraft({ ...draft, cityState: e.target.value })}
                onBlur={onBlurCommit}
              />
              <Input
                placeholder="Breed"
                value={draft.breed || ""}
                onChange={(e) => setDraft({ ...draft, breed: e.target.value })}
                onBlur={onBlurCommit}
              />
              <Input
                type="number"
                placeholder="Age"
                value={draft.age?.toString() || ""}
                onChange={(e) => setDraft({ ...draft, age: e.target.value === "" ? undefined : Number(e.target.value) })}
                onBlur={onBlurCommit}
                min={0}
                step={1}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
