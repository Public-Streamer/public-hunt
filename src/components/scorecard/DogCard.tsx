import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Clock, ChevronDown, Upload, Edit3, Trash2 } from "lucide-react";
import { TimerControl } from "./TimerControl";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCountdown, TimerStatus } from "@/hooks/useCountdown";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  // Media
  dogPhotoUrl?: string; // public URL to dog's photo
  pedigreeImageUrl?: string; // public URL to pedigree image
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
      goneHunting: { formatted: string; status: TimerStatus };
      stationary: { formatted: string; status: TimerStatus };
      noBark: { formatted: string; status: TimerStatus };
      walk: { formatted: string; status: TimerStatus };
      babbling: { formatted: string; status: TimerStatus };
    }
  ) => void;
  onTimerAction?: (
    dogId: string,
    timers: Record<string, { status: TimerStatus; remaining: number }>
  ) => void;
  onDelete?: (dogId: string) => void;
  canEdit?: boolean;
  openExternal?: boolean; // allow parent to force open/close (for auto-expand)
  lockOpen?: boolean; // when true, keep panel expanded and disable collapse
}

const quickStrike = [100, 75, 50, 25];
const quickTree = [125, 75, 50, 25];

export const DogCard: React.FC<DogCardProps> = ({
  dog,
  onChange,
  onTimerSnapshot,
  onTimerAction,
  onDelete,
  canEdit = true,
  openExternal,
  lockOpen,
}) => {
  const [draft, setDraft] = useState<DogData>(dog);
  const [customPoints, setCustomPoints] = useState<string>("");
  const [treeMinusBlink, setTreeMinusBlink] = useState(false);
  const pedigreeInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const treeTimer = useCountdown(3 * 60, {
    onComplete: () => {
      toast({
        title: "Tree time finished",
        description: `${draft.name}: tree time ended`,
      });
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          (navigator as any).vibrate?.(200);
        } catch (e: any) {
          console.log(e);
        }
      }
    },
  });
  const treeBark2Timer = useCountdown(2 * 60, {
    onComplete: () => {
      toast({
        title: "Tree bark timer expired",
        description: `${draft.name}: 2-minute tree bark rule expired`,
      });
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          (navigator as any).vibrate?.(200);
        } catch (e: any) {
          console.log(e);
        }
      }
      treeTimer.reset(3 * 60);
      onTimerAction?.(draft.id, snapshotTimers());
    },
  });
  const shineTimer = useCountdown(8 * 60, {
    onComplete: () => {
      toast({
        title: "Shine time finished",
        description: `${draft.name}: shine time ended`,
      });
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          (navigator as any).vibrate?.(200);
        } catch (e: any) {
          console.log(e);
        }
      }
    },
  });
  const trackBarkTimer = useCountdown(6 * 60, {
    onComplete: () => {
      toast({
        title: "Track bark time finished",
        description: `${draft.name}: track bark time ended`,
      });
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          (navigator as any).vibrate?.(200);
        } catch (e: any) {
          console.log(e);
        }
      }
    },
  });
  const walkTimer = useCountdown(1 * 60, {
    onComplete: () => {
      toast({
        title: "Walk time finished",
        description: `${draft.name}: 1-minute walk ended`,
      });
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          (navigator as any).vibrate?.(200);
        } catch (e: any) {
          console.log(e);
        }
      }
    },
  });
  const babblingTimer = useCountdown(1 * 60, {
    onComplete: () => {
      toast({
        title: "Babbling 1 Minute finished",
        description: `${draft.name}: 1-minute babbling window ended`,
      });
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          (navigator as any).vibrate?.(200);
        } catch (e: any) {
          console.log(e);
        }
      }
    },
  });
  const notHuntingTimer = useCountdown(15 * 60, {
    onComplete: () => {
      toast({
        title: "Not hunting time finished",
        description: `${draft.name}: 15-minute timer ended`,
      });
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          (navigator as any).vibrate?.(200);
        } catch (e: any) {
          console.log(e);
        }
      }
    },
  });
  const goneHuntingTimer = useCountdown(5 * 60, {
    onComplete: () => {
      if (notHuntingTimer.status === "running") {
        // During Not Hunting: do NOT scratch; reset the 15-minute timer instead
        toast({
          title: "Gone Hunt expired during Not Hunting",
          description: `${draft.name}: Not Hunting reset to 15:00`,
        });
        notHuntingTimer.reset(15 * 60);
        // Reset Gone Hunt as well so it can be cleanly restarted if needed
        goneHuntingTimer.reset(5 * 60);
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          try {
            (navigator as any).vibrate?.(200);
          } catch (e: any) {
            console.log(e);
          }
        }
        onTimerAction?.(draft.id, snapshotTimers());
        return;
      }
      // Otherwise, scratch dog when Gone Hunt expires outside Not Hunting
      toast({
        title: "Gone Hunt expired — Dog scratched",
        description: `${draft.name} is scratched from the hunt`,
        variant: "destructive",
      });
      const updated: DogData = { ...draft, disqualified: true };
      setDraft(updated);
      onChange(updated, computeTotal(updated.entries));
      // Reset related timers for clarity
      goneHuntingTimer.reset(5 * 60);
      notHuntingTimer.reset(15 * 60);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          (navigator as any).vibrate?.(200);
        } catch (e: any) {
          console.log(e);
        }
      }
      onTimerAction?.(draft.id, snapshotTimers());
    },
  });
  const stationaryTimer = useCountdown(5 * 60, {
    onComplete: () => {
      toast({
        title: "Stationary finished",
        description: `${draft.name}: 5-minute stationary completed`,
      });
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          (navigator as any).vibrate?.(200);
        } catch (e: any) {
          console.log(e);
        }
      }
    },
  });
  const stationaryNonBarkTimer = useCountdown(2 * 60, {
    onComplete: () => {
      toast({
        title: "No Bark 2:00 expired",
        description: `${draft.name}: judge decision required — Stationary reset`,
      });
      // Do not auto-minus on expiry; only reset linked Stationary timer
      stationaryTimer.reset(5 * 60);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          (navigator as any).vibrate?.(200);
        } catch (e: any) {
          console.log(e);
        }
      }
      onTimerAction?.(draft.id, snapshotTimers());
    },
  });
  useEffect(() => {
    onTimerSnapshot?.(draft.id, {
      tree: { formatted: treeTimer.formatted, status: treeTimer.status },
      treeBark2: {
        formatted: treeBark2Timer.formatted,
        status: treeBark2Timer.status,
      },
      shine: { formatted: shineTimer.formatted, status: shineTimer.status },
      trackBark: {
        formatted: trackBarkTimer.formatted,
        status: trackBarkTimer.status,
      },
      walk: { formatted: walkTimer.formatted, status: walkTimer.status },
      babbling: {
        formatted: babblingTimer.formatted,
        status: babblingTimer.status,
      },
      notHunting: {
        formatted: notHuntingTimer.formatted,
        status: notHuntingTimer.status,
      },
      goneHunting: {
        formatted: goneHuntingTimer.formatted,
        status: goneHuntingTimer.status,
      },
      stationary: {
        formatted: stationaryTimer.formatted,
        status: stationaryTimer.status,
      },
      noBark: {
        formatted: stationaryNonBarkTimer.formatted,
        status: stationaryNonBarkTimer.status,
      },
    });
  }, [
    draft.id,
    treeTimer.formatted,
    treeTimer.status,
    treeBark2Timer.formatted,
    treeBark2Timer.status,
    shineTimer.formatted,
    shineTimer.status,
    trackBarkTimer.formatted,
    trackBarkTimer.status,
    walkTimer.formatted,
    walkTimer.status,
    notHuntingTimer.formatted,
    notHuntingTimer.status,
    goneHuntingTimer.formatted,
    goneHuntingTimer.status,
    stationaryTimer.formatted,
    stationaryTimer.status,
    stationaryNonBarkTimer.formatted,
    stationaryNonBarkTimer.status,
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
    return draft.entries.reduce(
      (sum, e) => (e.outcome === "o" ? sum + e.points : sum),
      0
    );
  }, [draft.entries]);
  const showCircleAsTotal = total === 0 && circleTotal > 0;

  const hasPending = draft.entries.some((e) => e.outcome === "pending");

  const addEntry = (type: EntryType, points: number) => {
    if (!canEdit) return;
    const newEntry: ScoreEntry = {
      id: crypto.randomUUID(),
      type,
      points,
      outcome: "pending",
      at: new Date().toISOString(),
    };
    const updated: DogData = {
      ...draft,
      entries: [...draft.entries, newEntry],
    };
    setDraft(updated);
    onChange(updated, computeTotal(updated.entries));
  };

  const setOutcome = (id: string, outcome: EntryOutcome) => {
    if (!canEdit) return;
    const entry = draft.entries.find((e) => e.id === id);
    // 2-Minute No-Bark Rule Warning:
    // Show warning when scoring trees before timers expire, but allow the action
    if (
      entry?.type === "tree" &&
      treeTimer.status !== "finished" &&
      outcome !== "pending"
    ) {
      const isMinus = outcome === "-";
      const twoMinExpired = treeBark2Timer.status === "finished";
      if (!(isMinus && twoMinExpired)) {
        toast({
          title: "Warning: Tree timer active",
          description: "Scoring tree before 3:00 expires",
          variant: "destructive",
        });
        // Continue to allow scoring instead of returning
      }
      // Visual cue for judge when applying minus due to 2-minute no-bark
      if (isMinus && twoMinExpired) {
        setTreeMinusBlink(true);
        setTimeout(() => setTreeMinusBlink(false), 2000);
      }
    }
    const updatedEntries = draft.entries.map((e) =>
      e.id === id ? { ...e, outcome } : e
    );
    const updated: DogData = { ...draft, entries: updatedEntries };
    setDraft(updated);
    onChange(updated, computeTotal(updated.entries));
  };
  const removeEntry = (id: string) => {
    if (!canEdit) return;
    const updated: DogData = {
      ...draft,
      entries: draft.entries.filter((e) => e.id !== id),
    };
    setDraft(updated);
    onChange(updated, computeTotal(updated.entries));
  };

  const startNonBarkGuarded = () => {
    if (!canEdit) return;
    if (stationaryTimer.status !== "running") {
      toast({
        title: "Start Stationary first",
        description:
          "Begin the 5-minute stationary before starting the 2-minute no-bark",
        variant: "destructive",
      });
      return;
    }
    stationaryNonBarkTimer.start();
    onTimerAction?.(draft.id, snapshotTimers());
  };

  const startGoneHuntingGuarded = () => {
    if (!canEdit) return;
    if (notHuntingTimer.status !== "running") {
      toast({
        title: "Start Not Hunting first",
        description:
          "Begin the 15-minute not hunting timer before starting the 5-minute gone hunting",
        variant: "destructive",
      });
      return;
    }
    goneHuntingTimer.start();
    onTimerAction?.(draft.id, snapshotTimers());
  };

  const onBlurCommit = () => onChange(draft, total);
  // Lightweight custom timer component (per-dog)
  const CustomTimer: React.FC<{
    cfg: { id: string; label: string; seconds: number };
    onRemove: () => void;
  }> = ({ cfg, onRemove }) => {
    const t = useCountdown(cfg.seconds, {
      onComplete: () => {
        toast({ title: `${cfg.label} finished`, description: `${draft.name}` });
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          try {
            (navigator as any).vibrate?.(200);
          } catch (e: any) {
            console.log(e);
          }
        }
      },
    });
    return (
      <div className="relative">
        <TimerControl
          label={cfg.label}
          formatted={t.formatted}
          status={t.status}
          onStart={t.start}
          onPause={t.pause}
          onReset={t.reset}
        />
        <Button
          size="sm"
          variant="ghost"
          className="absolute top-2 right-2 h-7 w-7 p-0"
          onClick={onRemove}
          title="Remove timer"
        >
          <Plus className="h-4 w-4 rotate-45" />
        </Button>
      </div>
    );
  };

  const [customTimers, setCustomTimers] = useState<
    { id: string; label: string; seconds: number }[]
  >([]);
  const [open, setOpen] = useState<boolean>(!!canEdit);
  const [isEditing, setIsEditing] = useState(false);

  // Sync external open control from parent (auto-expand on updates)
  useEffect(() => {
    if (typeof openExternal === "boolean") {
      setOpen(openExternal);
    }
  }, [openExternal]);

  const runningTimers = useMemo(
    () =>
      [
        { key: "tree", label: "Tree", t: treeTimer },
        { key: "treeBark2", label: "Tree Bark", t: treeBark2Timer },
        { key: "shine", label: "Shine", t: shineTimer },
        { key: "trackBark", label: "Track Bark", t: trackBarkTimer },
        { key: "walk", label: "Walk", t: walkTimer },
        { key: "babbling", label: "Babbling 1 Minute", t: babblingTimer },
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

  // Show both running and finished timers in collapsed view
  const collapsedTimers = useMemo(
    () =>
      [
        { key: "tree", label: "Tree", t: treeTimer },
        { key: "treeBark2", label: "Tree Bark", t: treeBark2Timer },
        { key: "shine", label: "Shine", t: shineTimer },
        { key: "trackBark", label: "Track Bark", t: trackBarkTimer },
        { key: "walk", label: "Walk", t: walkTimer },
        { key: "babbling", label: "Babbling 1 Minute", t: babblingTimer },
        { key: "notHunting", label: "Not Hunt", t: notHuntingTimer },
        { key: "goneHunting", label: "Gone Hunt", t: goneHuntingTimer },
        { key: "stationary", label: "Stationary", t: stationaryTimer },
        { key: "noBark", label: "No Bark", t: stationaryNonBarkTimer },
      ].filter(({ t }) => t.status === "running" || t.status === "finished"),
    [
      treeTimer.status,
      treeTimer.formatted,
      treeBark2Timer.status,
      treeBark2Timer.formatted,
      shineTimer.status,
      shineTimer.formatted,
      trackBarkTimer.status,
      trackBarkTimer.formatted,
      walkTimer.status,
      walkTimer.formatted,
      notHuntingTimer.status,
      notHuntingTimer.formatted,
      goneHuntingTimer.status,
      goneHuntingTimer.formatted,
      stationaryTimer.status,
      stationaryTimer.formatted,
      stationaryNonBarkTimer.status,
      stationaryNonBarkTimer.formatted,
    ]
  );

  const snapshotTimers = useCallback(
    () => ({
      tree: { status: treeTimer.status, remaining: treeTimer.remaining },
      treeBark2: {
        status: treeBark2Timer.status,
        remaining: treeBark2Timer.remaining,
      },
      shine: { status: shineTimer.status, remaining: shineTimer.remaining },
      trackBark: {
        status: trackBarkTimer.status,
        remaining: trackBarkTimer.remaining,
      },
      walk: { status: walkTimer.status, remaining: walkTimer.remaining },
      babbling: {
        status: babblingTimer.status,
        remaining: babblingTimer.remaining,
      },
      notHunting: {
        status: notHuntingTimer.status,
        remaining: notHuntingTimer.remaining,
      },
      goneHunting: {
        status: goneHuntingTimer.status,
        remaining: goneHuntingTimer.remaining,
      },
      stationary: {
        status: stationaryTimer.status,
        remaining: stationaryTimer.remaining,
      },
      noBark: {
        status: stationaryNonBarkTimer.status,
        remaining: stationaryNonBarkTimer.remaining,
      },
    }),
    [
      treeTimer.status,
      treeTimer.remaining,
      treeBark2Timer.status,
      treeBark2Timer.remaining,
      shineTimer.status,
      shineTimer.remaining,
      trackBarkTimer.status,
      trackBarkTimer.remaining,
      walkTimer.status,
      walkTimer.remaining,
      babblingTimer.status,
      babblingTimer.remaining,
      notHuntingTimer.status,
      notHuntingTimer.remaining,
      goneHuntingTimer.status,
      goneHuntingTimer.remaining,
      stationaryTimer.status,
      stationaryTimer.remaining,
      stationaryNonBarkTimer.status,
      stationaryNonBarkTimer.remaining,
    ]
  );

  // Upload helpers for pedigree and dog photo
  const handleUpload = async (file: File, kind: "pedigree" | "photo") => {
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `scorecards/dogs/${
        draft.id
      }/${kind}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("media")
        .getPublicUrl(filePath);
      const url = urlData.publicUrl;
      const updated: DogData = {
        ...draft,
        dogPhotoUrl: kind === "photo" ? url : draft.dogPhotoUrl,
        pedigreeImageUrl: kind === "pedigree" ? url : draft.pedigreeImageUrl,
      };
      setDraft(updated);
      onChange(updated, computeTotal(updated.entries));
      toast({
        title: "Upload complete",
        description: `${
          kind === "photo" ? "Dog photo" : "Pedigree"
        } uploaded for ${draft.name}`,
      });
    } catch (e: any) {
      console.error("Upload failed", e);
      toast({
        title: "Upload failed",
        description: e?.message || "Could not upload file",
        variant: "destructive",
      });
    }
  };

  const onFileChangePedigree = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleUpload(f, "pedigree");
    if (e.target) e.target.value = "";
  };
  const onFileChangePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleUpload(f, "photo");
    if (e.target) e.target.value = "";
  };

  return (
    <Collapsible
      open={lockOpen ? true : open}
      onOpenChange={lockOpen ? undefined : setOpen}
    >
      <Card className="border-2 relative overflow-hidden">
        <CardHeader className="py-3">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-lg sm:text-xl font-extrabold text-foreground">
            {/* Team name section - always visible */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {draft.dogPhotoUrl && (
                <img
                  src={draft.dogPhotoUrl}
                  alt={`${draft.dogName || draft.name} dog photo`}
                  className="h-6 w-6 rounded object-cover border border-border flex-shrink-0"
                  loading="lazy"
                />
              )}
              <span
                className="inline-block h-3 w-3 rounded-full flex-shrink-0"
                style={{ background: draft.color }}
              />
              <span className="font-bold tracking-tight text-base sm:text-xl min-w-0 break-words">
                {draft.name}
              </span>
              {hasPending && (
                <Badge variant="outline" className="ml-2 flex-shrink-0 text-xs">
                  Pending
                </Badge>
              )}
            </div>

            {/* Score section - repositioned for better visibility */}
            <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-sm bg-background/50 rounded px-2 py-1 border">
                <Clock className="h-4 w-4 flex-shrink-0" />
                {showCircleAsTotal ? (
                  <>
                    <span className="tabular-nums font-bold">Total: </span>
                    <span className="font-bold rounded-full ring-2 ring-yellow-500 px-2 py-0.5 text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/30">
                      {circleTotal}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="tabular-nums font-bold">
                      Total: {totalAbs}
                    </span>
                    {total > 0 && (
                      <span className="font-bold text-xl text-green-600">
                        +
                      </span>
                    )}
                    {total < 0 && (
                      <span className="font-bold text-xl text-red-600">–</span>
                    )}
                  </>
                )}
              </div>

              {/* Controls section */}
              <div className="flex items-center gap-1">
                {canEdit && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing((v) => !v)}
                      aria-label={isEditing ? "Finish editing" : "Edit dog"}
                      title={isEditing ? "Finish editing" : "Edit dog"}
                      className="text-xs px-2 py-1 h-7"
                    >
                      <Edit3 className="h-3 w-3 mr-1" />{" "}
                      {isEditing ? "Done" : "Edit"}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          aria-label="Delete team"
                          title="Delete team"
                          className="text-xs px-2 py-1 h-7"
                        >
                          <Trash2 className="h-3 w-3 mr-1" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you sure you want to delete this team box?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Once it's deleted, it can't be undone. Team "
                            {draft.name}" and all its data will be permanently
                            removed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={async () => {
                              const { error } = await supabase.functions.invoke(
                                "scoreboard-operations",
                                {
                                  body: { action: "delete", teamId: draft.id },
                                }
                              );
                              if (error) {
                                toast({
                                  title: "Error",
                                  description: "Failed to delete team",
                                  variant: "destructive",
                                });
                              } else {
                                toast({
                                  title: "Deleted",
                                  description: `${draft.name} removed`,
                                });
                                onDelete?.(draft.id);
                              }
                            }}
                          >
                            Delete Team
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 rounded-full flex-shrink-0"
                    aria-label={
                      (lockOpen ? true : open) ? "Collapse" : "Expand"
                    }
                    title={(lockOpen ? true : open) ? "Collapse" : "Expand"}
                    disabled={!!lockOpen}
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        (lockOpen ? true : open) ? "rotate-180" : "rotate-0"
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardTitle>
        </CardHeader>

        {!canEdit && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-4xl sm:text-5xl font-extrabold uppercase tracking-widest text-foreground/15 -rotate-12 select-none">
              VIEW ONLY
            </span>
          </div>
        )}

        {!open && (
          <CardContent className="pt-0">
            {collapsedTimers.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {collapsedTimers.map((ct) => {
                  const isFinished = ct.t.status === "finished";
                  return (
                    <Badge
                      key={ct.key}
                      variant={isFinished ? "destructive" : "secondary"}
                      className={`text-xs font-medium ${
                        isFinished
                          ? "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-200 dark:border-red-800 animate-pulse"
                          : ""
                      }`}
                    >
                      {ct.label}: {ct.t.formatted}
                      {isFinished && " ⚠️"}
                    </Badge>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                No active timers
              </div>
            )}
          </CardContent>
        )}

        <CollapsibleContent asChild>
          <CardContent
            className={`space-y-3 ${
              !canEdit ? "pointer-events-none opacity-60 select-none" : ""
            }`}
          >
            {treeMinusBlink && (
              <div className="rounded-md border border-destructive bg-destructive/10 text-destructive font-semibold p-2 animate-pulse">
                Dog minused on tree
              </div>
            )}
            {/* Timers Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
              <div title="Tree timers are linked: if Bark 2:00 expires, Tree may reset; judge decides scoring.">
                <div className="relative rounded-md border border-primary/40 bg-primary/5 p-2 space-y-2 pl-3 sm:pl-4">
                  <span
                    aria-hidden
                    className="absolute left-0 top-0 bottom-0 w-1 bg-primary/70 rounded-l-md"
                  />
                  <div className="text-xs sm:text-sm font-semibold text-primary">
                    Linked to Tree Bark
                  </div>
                  <TimerControl
                    disabled={!canEdit}
                    label="Tree 3:00"
                    formatted={treeTimer.formatted}
                    status={treeTimer.status}
                    onStart={treeTimer.start}
                    onPause={treeTimer.pause}
                    onReset={treeTimer.reset}
                    className="border-primary/40"
                  />
                  <TimerControl
                    disabled={!canEdit}
                    label="Tree Bark 2:00"
                    formatted={treeBark2Timer.formatted}
                    status={treeBark2Timer.status}
                    onStart={treeBark2Timer.start}
                    onPause={treeBark2Timer.pause}
                    onReset={treeBark2Timer.reset}
                    className="border-primary/40"
                  />
                </div>
              </div>
              <div title="Shine Timer: Time allowed to search the tree for coon.">
                <TimerControl
                  disabled={!canEdit}
                  label="Shine 8:00"
                  formatted={shineTimer.formatted}
                  status={shineTimer.status}
                  onStart={shineTimer.start}
                  onPause={shineTimer.pause}
                  onReset={shineTimer.reset}
                />
              </div>
              <div title="Track Bark Timer: 6 minutes for strike requirement.">
                <TimerControl
                  disabled={!canEdit}
                  label="Track Bark 6:00"
                  formatted={trackBarkTimer.formatted}
                  status={trackBarkTimer.status}
                  onStart={trackBarkTimer.start}
                  onPause={trackBarkTimer.pause}
                  onReset={trackBarkTimer.reset}
                />
              </div>
              <div title="Babbling Stopwatch: 1-minute starting window.">
                <TimerControl
                  disabled={!canEdit}
                  label="Babbling 1 Minute 1:00"
                  formatted={babblingTimer.formatted}
                  status={babblingTimer.status}
                  onStart={() => {
                    babblingTimer.start();
                    onTimerAction?.(draft.id, snapshotTimers());
                  }}
                  onPause={() => {
                    babblingTimer.pause();
                    onTimerAction?.(draft.id, snapshotTimers());
                  }}
                  onReset={() => {
                    babblingTimer.reset();
                    onTimerAction?.(draft.id, snapshotTimers());
                  }}
                />
              </div>
              <div title="Walk Timer: 1 minute for walking between trees.">
                <TimerControl
                  disabled={!canEdit}
                  label="Walk 1:00"
                  formatted={walkTimer.formatted}
                  status={walkTimer.status}
                  onStart={walkTimer.start}
                  onPause={walkTimer.pause}
                  onReset={walkTimer.reset}
                />
              </div>
              <div title="Not Hunting Timer: 15 minutes for non-hunting dog.">
                <div className="relative rounded-md border border-primary/40 bg-primary/5 p-2 space-y-2 pl-3 sm:pl-4">
                  <span
                    aria-hidden
                    className="absolute left-0 top-0 bottom-0 w-1 bg-primary/70 rounded-l-md"
                  />
                  <div className="text-xs sm:text-sm font-semibold text-primary">
                    Linked to Gone Hunt
                  </div>
                  <TimerControl
                    disabled={!canEdit}
                    label="Not Hunting 15:00"
                    formatted={notHuntingTimer.formatted}
                    status={notHuntingTimer.status}
                    onStart={notHuntingTimer.start}
                    onPause={notHuntingTimer.pause}
                    onReset={() => {
                      notHuntingTimer.reset();
                      goneHuntingTimer.reset();
                    }}
                    className="border-primary/40"
                  />
                  <TimerControl
                    disabled={!canEdit}
                    label="Gone Hunt 5:00"
                    formatted={goneHuntingTimer.formatted}
                    status={goneHuntingTimer.status}
                    onStart={startGoneHuntingGuarded}
                    onPause={goneHuntingTimer.pause}
                    onReset={() => {
                      goneHuntingTimer.reset();
                    }}
                    className="border-primary/40"
                  />
                </div>
              </div>
              <div title="Stationary: 5 minutes; start 2-minute no-bark if barking stops.">
                <div className="relative rounded-md border border-secondary/40 bg-secondary/5 p-2 space-y-2 pl-3 sm:pl-4">
                  <span
                    aria-hidden
                    className="absolute left-0 top-0 bottom-0 w-1 bg-secondary/70 rounded-l-md"
                  />
                  <div className="text-xs sm:text-sm font-semibold text-secondary">
                    Linked to No Bark
                  </div>
                  <TimerControl
                    disabled={!canEdit}
                    label="Stationary 5:00"
                    formatted={stationaryTimer.formatted}
                    status={stationaryTimer.status}
                    onStart={stationaryTimer.start}
                    onPause={stationaryTimer.pause}
                    onReset={() => {
                      stationaryTimer.reset();
                      stationaryNonBarkTimer.reset();
                    }}
                    className="border-secondary/40"
                  />
                  <TimerControl
                    disabled={!canEdit}
                    label="No Bark 2:00"
                    formatted={stationaryNonBarkTimer.formatted}
                    status={stationaryNonBarkTimer.status}
                    onStart={startNonBarkGuarded}
                    onPause={stationaryNonBarkTimer.pause}
                    onReset={() => {
                      stationaryNonBarkTimer.reset();
                    }}
                    className="border-secondary/40"
                  />
                </div>
              </div>
            </div>

            {/* Quick add buttons */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Quick Add:
              </span>
              {quickStrike.map((p) => (
                <Button
                  key={`s${p}`}
                  size="sm"
                  variant="secondary"
                  disabled={!canEdit}
                  onClick={() => addEntry("strike", p)}
                >
                  Strike +{p}
                </Button>
              ))}
              {quickTree.map((p) => (
                <Button
                  key={`t${p}`}
                  size="sm"
                  disabled={!canEdit}
                  onClick={() => addEntry("tree", p)}
                >
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
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!canEdit}
                  onClick={() => {
                    const v = parseFloat(customPoints);
                    if (!isNaN(v) && v > 0) {
                      addEntry("strike", v);
                      setCustomPoints("");
                    }
                  }}
                >
                  Add Strike
                </Button>
                <Button
                  size="sm"
                  disabled={!canEdit}
                  onClick={() => {
                    const v = parseFloat(customPoints);
                    if (!isNaN(v) && v > 0) {
                      addEntry("tree", v);
                      setCustomPoints("");
                    }
                  }}
                >
                  Add Tree
                </Button>
              </div>
            </div>

            {/* Entries List */}
            <div className="space-y-2">
              {draft.entries.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No entries yet.
                </div>
              ) : (
                draft.entries.map((e) => {
                  const color =
                    e.outcome === "pending"
                      ? "bg-accent/10 border-accent/30"
                      : e.outcome === "+"
                      ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/40"
                      : e.outcome === "-"
                      ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/40"
                      : e.outcome === "o"
                      ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800/40"
                      : "bg-muted/20 border-muted/40 transition-colors"; // slash

                  const typeColor =
                    e.type === "strike"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200"
                      : "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-200";

                  const renderPoints = () => {
                    if (e.outcome === "o") {
                      return (
                        <span className="font-medium rounded-full ring-2 ring-yellow-500 px-2 py-0.5 text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/30">
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
                    <div
                      key={e.id}
                      className={`rounded-md border p-2 ${color}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Badge
                            variant="secondary"
                            className={`capitalize ${typeColor}`}
                          >
                            {e.type}
                          </Badge>
                          {renderPoints()}
                          {e.outcome !== "pending" && e.outcome !== "o" && (
                            <span
                              className={`ml-1 font-bold text-lg ${
                                e.outcome === "+"
                                  ? "text-green-600"
                                  : e.outcome === "-"
                                  ? "text-red-600"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {e.outcome === "+"
                                ? "+"
                                : e.outcome === "-"
                                ? "–"
                                : "╱"}
                            </span>
                          )}
                          {e.outcome === "pending" && (
                            <Badge variant="outline">pending</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap overflow-x-auto max-w-full">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!canEdit}
                            className="h-10 w-10 sm:h-12 sm:w-12 p-0 text-base sm:text-xl font-bold hover-scale shrink-0"
                            onClick={() => setOutcome(e.id, "+")}
                            title="Plus points"
                            aria-label="Plus points"
                          >
                            +
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!canEdit}
                            className="h-10 w-10 sm:h-12 sm:w-12 p-0 text-base sm:text-xl font-bold hover-scale shrink-0"
                            onClick={() => setOutcome(e.id, "-")}
                            title="Minus points"
                            aria-label="Minus points"
                          >
                            –
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!canEdit}
                            className="h-10 w-10 sm:h-12 sm:w-12 p-0 text-base sm:text-xl font-bold hover-scale shrink-0"
                            onClick={() => setOutcome(e.id, "o")}
                            title="Circle"
                            aria-label="Circle"
                          >
                            ◯
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!canEdit}
                            className="h-10 w-10 sm:h-12 sm:w-12 p-0 text-base sm:text-xl font-bold hover-scale shrink-0"
                            onClick={() => setOutcome(e.id, "/")}
                            title="Slash"
                            aria-label="Slash"
                          >
                            ╱
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!canEdit}
                            className="h-10 w-10 sm:h-12 sm:w-12 p-0 text-[10px] sm:text-xs font-semibold hover-scale shrink-0"
                            onClick={() => setOutcome(e.id, "pending")}
                            title="Set Pending"
                            aria-label="Set pending"
                          >
                            Pen
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!canEdit}
                            className="h-10 w-10 sm:h-12 sm:w-12 p-0 text-[10px] sm:text-xs font-semibold hover-scale shrink-0"
                            onClick={() => removeEntry(e.id)}
                            title="Delete"
                            aria-label="Delete"
                          >
                            Del
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Dog Media Uploads */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <input
                  ref={pedigreeInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={onFileChangePedigree}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => pedigreeInputRef.current?.click()}
                >
                  <span className="inline-flex items-center">
                    <Upload className="h-4 w-4 mr-1" /> Pedigree
                  </span>
                </Button>
                {draft.pedigreeImageUrl && (
                  <>
                    <a
                      href={draft.pedigreeImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs underline"
                    >
                      View
                    </a>
                    <a
                      href={draft.pedigreeImageUrl}
                      download
                      className="text-xs underline"
                    >
                      Download
                    </a>
                    {canEdit && isEditing && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          try {
                            // Extract file path from URL for deletion
                            const url = new URL(draft.pedigreeImageUrl!);
                            const pathParts = url.pathname.split("/");
                            const fileName = pathParts[pathParts.length - 1];
                            const filePath = `pedigrees/${fileName}`;

                            const { error } = await supabase.storage
                              .from("media")
                              .remove([filePath]);
                            if (error) {
                              console.error("Error deleting pedigree:", error);
                              toast({
                                title: "Error",
                                description: "Failed to delete pedigree",
                                variant: "destructive",
                              });
                            } else {
                              const updated = {
                                ...draft,
                                pedigreeImageUrl: undefined,
                              };
                              setDraft(updated);
                              onChange(updated, total);
                              toast({
                                title: "Deleted",
                                description: "Pedigree removed",
                              });
                            }
                          } catch (error) {
                            console.error("Error deleting pedigree:", error);
                            toast({
                              title: "Error",
                              description: "Failed to delete pedigree",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFileChangePhoto}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => photoInputRef.current?.click()}
                >
                  <span className="inline-flex items-center">
                    <Upload className="h-4 w-4 mr-1" /> Dog Photo
                  </span>
                </Button>
                {draft.dogPhotoUrl && (
                  <>
                    <img
                      src={draft.dogPhotoUrl}
                      alt={`Dog photo for ${draft.dogName || draft.name}`}
                      className="h-8 w-8 rounded object-cover border border-border"
                      loading="lazy"
                    />
                    <a
                      href={draft.dogPhotoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs underline"
                    >
                      View
                    </a>
                    <a
                      href={draft.dogPhotoUrl}
                      download
                      className="text-xs underline"
                    >
                      Download
                    </a>
                    {canEdit && isEditing && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          try {
                            // Extract file path from URL for deletion
                            const url = new URL(draft.dogPhotoUrl!);
                            const pathParts = url.pathname.split("/");
                            const fileName = pathParts[pathParts.length - 1];
                            const filePath = `photos/${fileName}`;

                            const { error } = await supabase.storage
                              .from("media")
                              .remove([filePath]);
                            if (error) {
                              console.error("Error deleting dog photo:", error);
                              toast({
                                title: "Error",
                                description: "Failed to delete dog photo",
                                variant: "destructive",
                              });
                            } else {
                              const updated = {
                                ...draft,
                                dogPhotoUrl: undefined,
                              };
                              setDraft(updated);
                              onChange(updated, total);
                              toast({
                                title: "Deleted",
                                description: "Dog photo removed",
                              });
                            }
                          } catch (error) {
                            console.error("Error deleting dog photo:", error);
                            toast({
                              title: "Error",
                              description: "Failed to delete dog photo",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Dog/Team Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <Input
                placeholder="Team name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                onBlur={onBlurCommit}
                readOnly={!canEdit || !isEditing}
                disabled={!canEdit || !isEditing}
              />
              <Input
                placeholder="Dog name"
                value={draft.dogName || ""}
                onChange={(e) =>
                  setDraft({ ...draft, dogName: e.target.value })
                }
                onBlur={onBlurCommit}
                readOnly={!canEdit || !isEditing}
                disabled={!canEdit || !isEditing}
              />
              <Input
                placeholder="Handler name"
                value={draft.handler || ""}
                onChange={(e) =>
                  setDraft({ ...draft, handler: e.target.value })
                }
                onBlur={onBlurCommit}
                readOnly={!canEdit || !isEditing}
                disabled={!canEdit || !isEditing}
              />
              <Input
                placeholder="City, State"
                value={draft.cityState || ""}
                onChange={(e) =>
                  setDraft({ ...draft, cityState: e.target.value })
                }
                onBlur={onBlurCommit}
                readOnly={!canEdit || !isEditing}
                disabled={!canEdit || !isEditing}
              />
              <Input
                placeholder="Breed"
                value={draft.breed || ""}
                onChange={(e) => setDraft({ ...draft, breed: e.target.value })}
                onBlur={onBlurCommit}
                readOnly={!canEdit || !isEditing}
                disabled={!canEdit || !isEditing}
              />
              <Input
                type="number"
                placeholder="Age"
                value={draft.age?.toString() || ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    age:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  })
                }
                onBlur={onBlurCommit}
                min={0}
                step={1}
                readOnly={!canEdit || !isEditing}
                disabled={!canEdit || !isEditing}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
