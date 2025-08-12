import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ControlLock {
  owner: string;
  owner_name?: string;
  expires_at: string;
}

interface UseEventControlLockOptions {
  enabled?: boolean;
  eventId: string;
  autoAcquire?: boolean;
  overrideIfHost?: boolean; // allow host override when true
  renewIntervalMs?: number; // default 10s
}

export const useEventControlLock = ({
  eventId,
  enabled = true,
  autoAcquire = true,
  overrideIfHost = false,
  renewIntervalMs = 10000,
}: UseEventControlLockOptions) => {
  const [lock, setLock] = useState<ControlLock | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const renewingRef = useRef(false);
  const owned = !!lock && Date.parse(lock.expires_at) > Date.now();

  const acquire = async (opts?: { override?: boolean }) => {
    if (!enabled) return false;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("scoreboard-operations", {
        body: { action: "acquireLock", eventId, override: !!opts?.override || overrideIfHost },
      });
      if (error) throw error;
      if ((data as any)?.error === "locked") {
        const info = data as any;
        setLock(info.lock || null);
        setError("locked");
        toast({ title: "Controls in use", description: `Locked by ${info.owner_name || "another user"}`, variant: "destructive" });
        return false;
      }
      setLock((data as any)?.lock || null);
      return true;
    } catch (e: any) {
      setError(e?.message || "Failed to acquire lock");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const renew = async () => {
    if (!enabled || !lock || renewingRef.current) return;
    if (Date.now() + 3000 > Date.parse(lock.expires_at)) {
      // Close to expiry, renew
      renewingRef.current = true;
      try {
        const { data, error } = await supabase.functions.invoke("scoreboard-operations", {
          body: { action: "renewLock", eventId, override: overrideIfHost },
        });
        if (!error) setLock((data as any)?.lock || null);
      } catch {}
      renewingRef.current = false;
    }
  };

  const release = async () => {
    if (!enabled) return;
    try {
      await supabase.functions.invoke("scoreboard-operations", {
        body: { action: "releaseLock", eventId },
      });
    } catch {}
    setLock(null);
  };

  // Auto-acquire and renew loop
  useEffect(() => {
    let interval: any;
    const start = async () => {
      if (enabled && autoAcquire) {
        await acquire();
        interval = setInterval(renew, renewIntervalMs);
      }
    };
    start();
    const onVis = () => {
      if (document.visibilityState === "visible") renew();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, enabled, autoAcquire]);

  const lockedByName = useMemo(() => (lock && !owned ? lock.owner_name || "another user" : null), [lock, owned]);

  return {
    lock,
    isOwner: owned,
    lockedByName,
    loading,
    error,
    acquire,
    renew,
    release,
    setLock,
  } as const;
};
