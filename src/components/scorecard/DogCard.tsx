import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Circle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { TimerControl } from "./TimerControl";
import { useCountdown } from "@/hooks/useCountdown";

export type EntryOutcome = "pending" | "+" | "-" | "o"; // plus / minus / circle
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
}

const quickStrike = [100, 75, 50, 25];
const quickTree = [125, 75, 50, 25];

export const DogCard: React.FC<DogCardProps> = ({ dog, onChange }) => {
  const [draft, setDraft] = useState<DogData>(dog);

  // Per-dog timers
  const treeTimer = useCountdown(3 * 60);
  const shineTimer = useCountdown(8 * 60);
  const trackBarkTimer = useCountdown(6 * 60);
  const notHuntingTimer = useCountdown(15 * 60);

  const total = useMemo(() => {
    return draft.entries.reduce((sum, e) => {
      if (e.outcome === "+") return sum + e.points;
      if (e.outcome === "-") return sum - e.points;
      if (e.outcome === "o") return sum; // circle doesn't change
      return sum; // pending doesn't count
    }, 0);
  }, [draft.entries]);

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
    setDraft((prev) => ({
      ...prev,
      entries: prev.entries.map((e) => (e.id === id ? { ...e, outcome } : e)),
    }));
  };

  const removeEntry = (id: string) => {
    setDraft((prev) => ({ ...prev, entries: prev.entries.filter((e) => e.id !== id) }));
  };

  const onBlurCommit = () => onChange(draft, total);

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
            <span className="tabular-nums">Total: {total}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Timers Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <TimerControl label="Tree 3:00" formatted={treeTimer.formatted} status={treeTimer.status} onStart={treeTimer.start} onPause={treeTimer.pause} onReset={treeTimer.reset} />
          <TimerControl label="Shine 8:00" formatted={shineTimer.formatted} status={shineTimer.status} onStart={shineTimer.start} onPause={shineTimer.pause} onReset={shineTimer.reset} />
          <TimerControl label="Track Bark 6:00" formatted={trackBarkTimer.formatted} status={trackBarkTimer.status} onStart={trackBarkTimer.start} onPause={trackBarkTimer.pause} onReset={trackBarkTimer.reset} />
          <TimerControl label="Not Hunting 15:00" formatted={notHuntingTimer.formatted} status={notHuntingTimer.status} onStart={notHuntingTimer.start} onPause={notHuntingTimer.pause} onReset={notHuntingTimer.reset} />
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
          <div className="flex items-center gap-1 ml-2">
            <Input type="number" inputMode="numeric" placeholder="Custom" className="h-9 w-24" onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = Number((e.target as HTMLInputElement).value);
                if (!isNaN(v) && v > 0) addEntry("tree", v);
              }
            }} />
            <Badge variant="outline">strike/tree</Badge>
          </div>
        </div>

        {/* Entries List */}
        <div className="space-y-2">
          {draft.entries.length === 0 ? (
            <div className="text-sm text-muted-foreground">No entries yet.</div>
          ) : (
            draft.entries.map((e) => {
              const color = e.outcome === "pending"
                ? "bg-blue-500/10"
                : e.outcome === "+"
                ? "bg-emerald-500/10"
                : e.outcome === "-"
                ? "bg-destructive/10"
                : "bg-yellow-500/10"; // circle
              return (
                <div key={e.id} className={`rounded-md border p-2 ${color}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary" className="capitalize">{e.type}</Badge>
                      <span className="font-medium">{e.points}</span>
                      {e.outcome === "pending" && <Badge className="bg-blue-500 text-white">pending</Badge>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => setOutcome(e.id, "+")} title="Plus points"><CheckCircle2 className="h-4 w-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => setOutcome(e.id, "-")} title="Minus points"><XCircle className="h-4 w-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => setOutcome(e.id, "o")} title="Circle"><Circle className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => removeEntry(e.id)} title="Remove"><Plus className="h-4 w-4 rotate-45" /></Button>
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
