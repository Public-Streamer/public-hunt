import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type TimerStatus = "idle" | "running" | "paused" | "finished";

interface UseCountdownOptions {
  onComplete?: () => void;
  autostart?: boolean;
}

// Simple, resilient countdown timer hook for mobile field use
export function useCountdown(initialSeconds: number, opts: UseCountdownOptions = {}) {
  const { onComplete, autostart } = opts;
  const [duration] = useState(() => Math.max(0, Math.floor(initialSeconds)));
  const [remaining, setRemaining] = useState(duration);
  const [status, setStatus] = useState<TimerStatus>(autostart && duration > 0 ? "running" : "idle");
  const raf = useRef<number | null>(null);
  const startedAt = useRef<number | null>(null);
  const carried = useRef<number>(0);

  const tick = useCallback((t: number) => {
    if (startedAt.current == null) return;
    const elapsed = (t - startedAt.current) / 1000 + carried.current;
    const left = Math.max(0, duration - elapsed);
    setRemaining(left);
    if (left <= 0) {
      setStatus("finished");
      startedAt.current = null;
      carried.current = 0;
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = null;
      onComplete?.();
      return;
    }
    raf.current = requestAnimationFrame(tick);
  }, [duration, onComplete]);

  const start = useCallback(() => {
    if (status === "running" || duration === 0) return;
    setStatus("running");
    startedAt.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  }, [status, duration, tick]);

  const pause = useCallback(() => {
    if (status !== "running") return;
    setStatus("paused");
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    if (startedAt.current != null) {
      carried.current += (performance.now() - startedAt.current) / 1000;
      startedAt.current = null;
    }
  }, [status]);

  const reset = useCallback((newSeconds?: number) => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    startedAt.current = null;
    carried.current = 0;
    const base = typeof newSeconds === "number" && !Number.isNaN(newSeconds) ? newSeconds : duration;
    const d = Math.max(0, Math.floor(base));
    setStatus("idle");
    setRemaining(d);
  }, [duration]);

  useEffect(() => {
    if (autostart && status === "idle" && duration > 0) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatted = useMemo(() => {
    const safeRemaining = Number.isFinite(remaining) ? remaining : duration;
    const secs = Math.max(0, Math.ceil(safeRemaining));
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [remaining, duration]);

  return { remaining, formatted, status, start, pause, reset };
}
