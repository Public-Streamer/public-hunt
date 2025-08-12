import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TimerStatus } from "@/hooks/useCountdown";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TimerControlProps {
  label: string;
  formatted: string;
  status: TimerStatus;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  allowPause?: boolean; // show Pause button only when true
  className?: string;
}

export const TimerControl: React.FC<TimerControlProps> = ({
  label,
  formatted,
  status,
  onStart,
  onPause,
  onReset,
  allowPause = false,
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
      <div className={cn("mt-3 grid gap-2", allowPause ? "grid-cols-3" : "grid-cols-2") }>
          <Button size="sm" className="h-9 sm:h-10 md:h-11 px-2 sm:px-3 whitespace-nowrap text-[11px] sm:text-xs md:text-sm min-w-[64px]" onClick={onStart} disabled={status === "running"} aria-label="Start timer">Start</Button>
          {allowPause && (
            <Button size="sm" variant="outline" className="h-9 sm:h-10 md:h-11 px-2 sm:px-3 whitespace-nowrap text-[11px] sm:text-xs md:text-sm min-w-[64px]" onClick={onPause} disabled={status !== "running"} aria-label="Pause timer">Pause</Button>
          )}
          <Button size="sm" variant="secondary" className="h-9 sm:h-10 md:h-11 px-2 sm:px-3 whitespace-nowrap text-[11px] sm:text-xs md:text-sm min-w-[64px]" onClick={onReset} aria-label="Reset timer">Reset</Button>
      </div>
    </div>
  );
};
