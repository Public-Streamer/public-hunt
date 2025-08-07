import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseLiveReconciliationProps {
  eventId?: string;
  userId?: string;
  enabled?: boolean;
}

export function useLiveReconciliation({ eventId, userId, enabled }: UseLiveReconciliationProps) {
  useEffect(() => {
    if (!enabled || !eventId) return;

    const publicEdgeUrl = "https://zmfugicftfwvuudensdo.supabase.co/functions/v1/reconcile-live-status";

    const reconcile = async (reason: string) => {
      try {
        await supabase.functions.invoke("reconcile-live-status", {
          body: { eventId, userId, reason },
        });
      } catch (e) {
        // Best-effort fallback
        try {
          const payload = JSON.stringify({ eventId, userId, reason, ts: Date.now() });
          navigator.sendBeacon(publicEdgeUrl, new Blob([payload], { type: "application/json" }));
        } catch {}
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        reconcile("visibility-hidden");
      }
    };

    const onPageHide = () => {
      try {
        const payload = JSON.stringify({ eventId, userId, reason: "pagehide", ts: Date.now() });
        // Keepalive send for reliable delivery on unload
        fetch(publicEdgeUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {
          navigator.sendBeacon(publicEdgeUrl, new Blob([payload], { type: "application/json" }));
        });
      } catch {}
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [enabled, eventId, userId]);
}
