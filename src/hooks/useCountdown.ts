import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type TimerStatus = "idle" | "running" | "paused" | "finished";

interface UseCountdownOptions {
  onComplete?: () => void;
  autostart?: boolean;
}

// Resilient countdown timer hook with external sync support
export function useCountdown(initialSeconds: number, opts: UseCountdownOptions = {}) {
  const { onComplete, autostart } = opts;

  // Store the initial duration mainly for resets
  const initialDurationRef = useRef(Math.max(0, Math.floor(initialSeconds)));

  // Remaining seconds exposed to consumers
  const [remaining, setRemaining] = useState<number>(initialDurationRef.current);
  const [status, setStatus] = useState<TimerStatus>(autostart && remaining > 0 ? "running" : "idle");

  // Internals for timekeeping
  const raf = useRef<number | null>(null);
  const startedAt = useRef<number | null>(null);
  const carried = useRef<number>(0); // accumulated elapsed when paused/resumed
  const baseRemainingAtStart = useRef<number>(remaining); // remaining snapshot at last start

  const clearRAF = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
  };

  const tick = useCallback((t: number) => {
    if (startedAt.current == null) return;
    const elapsed = (t - startedAt.current) / 1000 + carried.current;
    const left = Math.max(0, baseRemainingAtStart.current - elapsed);
    setRemaining(left);
    if (left <= 0) {
      setStatus("finished");
      startedAt.current = null;
      carried.current = 0;
      clearRAF();
      onComplete?.();
      return;
    }
    raf.current = requestAnimationFrame(tick);
  }, [onComplete]);

  const start = useCallback(() => {
    if (status === "running" || remaining <= 0) return;
    setStatus("running");
    if (status !== "paused") {    
      baseRemainingAtStart.current = remaining;
      carried.current = 0;
    }
    startedAt.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  }, [status, remaining, tick]);

  const pause = useCallback(() => {
    if (status !== "running") return;
    setStatus("paused");
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    if (startedAt.current != null) {
      const elapsed = (performance.now() - startedAt.current) / 1000;
      carried.current += elapsed;
      startedAt.current = null;
      const newRemaining = Math.max(0, baseRemainingAtStart.current - carried.current);
      setRemaining(newRemaining);
    }
  }, [status]);

  const reset = useCallback((newSeconds?: number) => {
    clearRAF();
    startedAt.current = null;
    carried.current = 0;
    const target = typeof newSeconds === "number" && !Number.isNaN(newSeconds)
      ? Math.max(0, Math.floor(newSeconds))
      : initialDurationRef.current;
    initialDurationRef.current = target; // allow changing the baseline
    setStatus("idle");
    setRemaining(target);
    baseRemainingAtStart.current = target;
  }, []);

  // External sync helper to align with authoritative remaining/status
  const syncTo = useCallback((authoritativeRemaining: number, authoritativeStatus: TimerStatus) => {
    const target = Math.max(0, Math.floor(authoritativeRemaining));
    clearRAF();
    startedAt.current = null;
    carried.current = 0;
    setRemaining(target);
    baseRemainingAtStart.current = target;

    if (authoritativeStatus === "running" && target > 0) {
      setStatus("running");
      startedAt.current = performance.now();
      raf.current = requestAnimationFrame(tick);
    } else if (authoritativeStatus === "paused") {
      setStatus("paused");
    } else if (authoritativeStatus === "finished") {
      setStatus("finished");
    } else {
      setStatus("idle");
    }
  }, [tick]);

  useEffect(() => {
    if (autostart && status === "idle" && remaining > 0) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatted = useMemo(() => {
    const safeRemaining = Number.isFinite(remaining) ? remaining : initialDurationRef.current;
    const secs = Math.max(0, Math.floor(safeRemaining)); // Use Math.floor instead of Math.ceil to avoid rounding up
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [remaining]);

  return { remaining, formatted, status, start, pause, reset, syncTo };
}
