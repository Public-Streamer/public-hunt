// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventId, userId, reason } = await req.json();

    if (!eventId) {
      return new Response(JSON.stringify({ error: "eventId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      console.error("Missing Supabase environment variables");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // Optionally mark this user as not live if provided
    if (userId) {
      const { error: updErr } = await supabase
        .from("event_participants")
        .update({ is_live: false, is_active: false, last_seen: new Date().toISOString() })
        .match({ event_id: eventId, user_id: userId });

      if (updErr) {
        console.warn("Failed updating participant on reconcile:", updErr.message);
      }
    }

    // Count current live hosts/streamers after update
    const { data: countRows, error: countErr } = await supabase
      .from("event_participants")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .in("role", ["host", "streamer"]) 
      .eq("is_live", true);

    if (countErr) {
      console.error("Count error:", countErr.message);
      return new Response(JSON.stringify({ error: countErr.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const liveCount = (countRows as any)?.length === undefined ? (countRows as any)?.count ?? 0 : (countRows as any).length;

    let action: "unchanged" | "closed" = "unchanged";

    if (!liveCount || liveCount === 0) {
      // No one is live => mark the event not live (idempotent)
      const { error: updEventErr } = await supabase
        .from("events")
        .update({ is_live: false, updated_at: new Date().toISOString() })
        .eq("id", eventId);

      if (updEventErr) {
        console.error("Failed to mark event not live:", updEventErr.message);
      } else {
        action = "closed";
      }
    }

    console.log("reconcile-live-status", { eventId, userId, reason, liveCount, action });

    return new Response(
      JSON.stringify({ ok: true, eventId, liveCount, action }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("reconcile-live-status error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
