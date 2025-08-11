import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TimerStatus } from "@/hooks/useCountdown";

interface TimerControlProps {
  label: string;
  formatted: string;
  status: TimerStatus;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  className?: string;
}

export const TimerControl: React.FC<TimerControlProps> = ({
  label,
  formatted,
  status,
  onStart,
  onPause,
  onReset,
  className,
}) => {
  const colorCls = status === "running"
    ? "bg-primary/10 text-primary"
    : status === "paused"
    ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
    : status === "finished"
    ? "bg-destructive/10 text-destructive"
    : "bg-muted text-muted-foreground";

  return (
    <div className={cn("rounded-md p-3 border", colorCls, className)}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium">{label}</div>
        <div className="text-lg tabular-nums font-semibold">{formatted}</div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Button size="sm" className="h-9" onClick={onStart} disabled={status === "running"}>Start</Button>
        <Button size="sm" variant="outline" className="h-9" onClick={onPause} disabled={status !== "running"}>Pause</Button>
        <Button size="sm" variant="secondary" className="h-9" onClick={onReset}>Reset</Button>
      </div>
    </div>
  );
};
