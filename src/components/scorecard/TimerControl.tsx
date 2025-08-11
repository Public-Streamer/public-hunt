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
    ? "bg-accent/10 text-accent-foreground"
    : status === "finished"
    ? "bg-destructive/10 text-destructive"
    : "bg-muted text-muted-foreground";

  return (
    <div className={cn("rounded-md p-3 border", colorCls, className)}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium">{label}</div>
        <div className="text-lg tabular-nums font-semibold">{formatted}</div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Button size="sm" className="h-10 text-sm sm:text-base" onClick={onStart} disabled={status === "running"} aria-label="Start timer">Start</Button>
        <Button size="sm" variant="outline" className="h-10 text-sm sm:text-base" onClick={onPause} disabled={status !== "running"} aria-label="Pause timer">Pause</Button>
        <Button size="sm" variant="secondary" className="h-10 text-sm sm:text-base" onClick={onReset} aria-label="Reset timer">Reset</Button>
      </div>
    </div>
  );
};
