import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock } from "lucide-react";
import { TimerControl } from "./TimerControl";
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
    }
  ) => void;
}

const quickStrike = [100, 75, 50, 25];
const quickTree = [125, 75, 50, 25];

export const DogCard: React.FC<DogCardProps> = ({ dog, onChange, onTimerSnapshot }) => {
  const [draft, setDraft] = useState<DogData>(dog);
  const [customPoints, setCustomPoints] = useState<string>("");

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
      toast({ title: "Gone hunting 5:00 finished", description: `${draft.name}: resetting Not Hunting 15:00` });
      notHuntingTimer.reset(15 * 60);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { (navigator as any).vibrate?.(200); } catch {}
      }
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
      toast({ title: "No bark 2:00 expired", description: `${draft.name}: resetting stationary` });
      stationaryTimer.reset(5 * 60);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { (navigator as any).vibrate?.(200); } catch {}
      }
    },
  });
  useEffect(() => {
    onTimerSnapshot?.(draft.id, {
      tree: { formatted: treeTimer.formatted, status: treeTimer.status },
      treeBark2: { formatted: treeBark2Timer.formatted, status: treeBark2Timer.status },
      shine: { formatted: shineTimer.formatted, status: shineTimer.status },
      trackBark: { formatted: trackBarkTimer.formatted, status: trackBarkTimer.status },
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
    notHuntingTimer.formatted, notHuntingTimer.status,
    stationaryTimer.formatted, stationaryTimer.status,
    stationaryNonBarkTimer.formatted, stationaryNonBarkTimer.status,
    onTimerSnapshot,
  ]);

  const total = useMemo(() => {
    return draft.entries.reduce((sum, e) => {
      if (e.outcome === "+") return sum + e.points;
      if (e.outcome === "-") return sum - e.points;
      if (e.outcome === "o") return sum; // circle doesn't change
      if (e.outcome === "/") return sum; // slashed strike doesn't change
      return sum; // pending doesn't count
    }, 0);
  }, [draft.entries]);

  const totalAbs = Math.abs(total);
  const totalIndicator = total > 0 ? "+" : total < 0 ? "–" : "";
  const circleTotal = useMemo(() => {
    return draft.entries.reduce((sum, e) => (e.outcome === "o" ? sum + e.points : sum), 0);
  }, [draft.entries]);
  const showCircleAsTotal = total === 0 && circleTotal > 0;

  const hasPending = draft.entries.some((e) => e.outcome === "pending");

  const addEntry = (type: EntryType, points: number) => {
    setDraft((prev) => ({
      ...prev,
      entries: [
        ...prev.entries,
        { id: crypto.randomUUID(), type, points, outcome: "pending", at: new Date().toISOString() },
      ],
    }));
  };

  const setOutcome = (id: string, outcome: EntryOutcome) => {
    const entry = draft.entries.find((e) => e.id === id);
    if (entry?.type === "tree" && treeTimer.status !== "finished") {
      toast({ title: "Tree timer active", description: "Cannot score tree until 3:00 expires", variant: "destructive" });
      return;
    }
    setDraft((prev) => ({
      ...prev,
      entries: prev.entries.map((e) => (e.id === id ? { ...e, outcome } : e)),
    }));
  };
  const removeEntry = (id: string) => {
    setDraft((prev) => ({ ...prev, entries: prev.entries.filter((e) => e.id !== id) }));
  };

  const startNonBarkGuarded = () => {
    if (stationaryTimer.status !== "running") {
      toast({ title: "Start Stationary first", description: "Begin the 5-minute stationary before starting the 2-minute no-bark", variant: "destructive" });
      return;
    }
    stationaryNonBarkTimer.start();
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
  return (
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
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Timers Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
          <div title="Tree Timer: Wait 3 minutes before scoring a tree.">
            <TimerControl label="Tree 3:00" formatted={treeTimer.formatted} status={treeTimer.status} onStart={treeTimer.start} onPause={treeTimer.pause} onReset={treeTimer.reset} />
          </div>
          <div title="Tree Bark Timer: 2-minute bark requirement while treed.">
            <TimerControl label="Tree Bark 2:00" formatted={treeBark2Timer.formatted} status={treeBark2Timer.status} onStart={treeBark2Timer.start} onPause={treeBark2Timer.pause} onReset={treeBark2Timer.reset} />
          </div>
          <div title="Shine Timer: Time allowed to search the tree for coon.">
            <TimerControl label="Shine 8:00" formatted={shineTimer.formatted} status={shineTimer.status} onStart={shineTimer.start} onPause={shineTimer.pause} onReset={shineTimer.reset} />
          </div>
          <div title="Track Bark Timer: 6 minutes for strike requirement.">
            <TimerControl label="Track Bark 6:00" formatted={trackBarkTimer.formatted} status={trackBarkTimer.status} onStart={trackBarkTimer.start} onPause={trackBarkTimer.pause} onReset={trackBarkTimer.reset} />
          </div>
          <div title="Not Hunting Timer: 15 minutes for non-hunting dog.">
            <div className="rounded-md border border-primary/30 bg-primary/5 p-2 space-y-2">
              <div className="text-[10px] font-medium text-primary/80">Linked to Gone Hunt</div>
              <TimerControl
                label="Not Hunting 15:00"
                formatted={notHuntingTimer.formatted}
                status={notHuntingTimer.status}
                onStart={notHuntingTimer.start}
                onPause={notHuntingTimer.pause}
                onReset={() => { notHuntingTimer.reset(); goneHuntingTimer.reset(); }}
                className="border-primary/30"
              />
              <TimerControl
                label="Gone Hunt 5:00"
                formatted={goneHuntingTimer.formatted}
                status={goneHuntingTimer.status}
                onStart={startGoneHuntingGuarded}
                onPause={goneHuntingTimer.pause}
                onReset={goneHuntingTimer.reset}
                className="border-primary/30"
              />
            </div>
          </div>
          <div title="Stationary: 5 minutes; start 2-minute no-bark if barking stops.">
            <div className="rounded-md border border-secondary/30 bg-secondary/5 p-2 space-y-2">
              <div className="text-[10px] font-medium text-secondary/80">Linked to No Bark</div>
              <TimerControl
                label="Stationary 5:00"
                formatted={stationaryTimer.formatted}
                status={stationaryTimer.status}
                onStart={stationaryTimer.start}
                onPause={stationaryTimer.pause}
                onReset={() => { stationaryTimer.reset(); stationaryNonBarkTimer.reset(); }}
                className="border-secondary/30"
              />
              <TimerControl
                label="No Bark 2:00"
                formatted={stationaryNonBarkTimer.formatted}
                status={stationaryNonBarkTimer.status}
                onStart={startNonBarkGuarded}
                onPause={stationaryNonBarkTimer.pause}
                onReset={stationaryNonBarkTimer.reset}
                className="border-secondary/30"
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
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" className="h-12 w-12 p-0 text-xl font-bold hover-scale" onClick={() => setOutcome(e.id, "+")} title="Plus points">+</Button>
                      <Button size="sm" variant="outline" className="h-12 w-12 p-0 text-xl font-bold hover-scale" onClick={() => setOutcome(e.id, "-")} title="Minus points">–</Button>
                      <Button size="sm" variant="outline" className="h-12 w-12 p-0 text-xl font-bold hover-scale" onClick={() => setOutcome(e.id, "o")} title="Circle">◯</Button>
                      <Button size="sm" variant="outline" className="h-12 w-12 p-0 text-xl font-bold hover-scale" onClick={() => setOutcome(e.id, "/")} title="Slash">╱</Button>
                      <Button size="sm" variant="outline" className="h-12 w-12 p-0 text-xs font-semibold hover-scale" onClick={() => removeEntry(e.id)} title="Delete">Del</Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Handler / Notes optional */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input
            placeholder="Handler name"
            value={draft.handler || ""}
            onChange={(e) => setDraft({ ...draft, handler: e.target.value })}
            onBlur={onBlurCommit}
          />
        </div>
      </CardContent>
    </Card>
  );
};
