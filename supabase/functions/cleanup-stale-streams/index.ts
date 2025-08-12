// Supabase Edge Function: cleanup-stale-streams
// Purpose: Detect stale (disconnected) streamers by checking event_streams.updated_at.
// - Marks stale rows as is_active = false
// - If an event has zero active streams, sets events.is_live = false and closes its LiveKit room
//
// Scheduling: Configure this function to run periodically (e.g., every 30s) in Supabase Dashboard.
//
// Environment variables required (available by default in Supabase Edge Functions):
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
//
// Optional query string overrides:
// - thresholdSec: number of seconds since updated_at to consider stale (default 20)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface EventRow {
  id: string;
  is_live: boolean;
}

interface StreamRow {
  id: string;
  event_id: string;
  streamer_id: string;
  is_active: boolean;
  updated_at: string;
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const thresholdSec = Number(url.searchParams.get("thresholdSec") ?? "20");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      return new Response(
        JSON.stringify({ error: "Missing SUPABASE env vars" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const cutoffIso = new Date(Date.now() - thresholdSec * 1000).toISOString();

    // 1) Mark stale streams inactive (where updated_at < cutoff and is_active = true)
    const { error: markStaleErr } = await admin
      .from("event_streams")
      .update({ is_active: false })
      .lt("updated_at", cutoffIso)
      .eq("is_active", true);

    if (markStaleErr) {
      console.error("Error marking stale streams:", markStaleErr);
      throw markStaleErr;
    }

    // 2) Find live events
    const { data: liveEvents, error: liveEventsErr } = await admin
      .from("events")
      .select("id, is_live")
      .eq("is_live", true);

    if (liveEventsErr) {
      console.error("Error fetching live events:", liveEventsErr);
      throw liveEventsErr;
    }

    const closed: string[] = [];
    const stillLive: string[] = [];

    // 3) For each live event, check if it has active streams
    for (const ev of (liveEvents as EventRow[]) ?? []) {
      const { data: activeStreams, error: activeErr } = await admin
        .from("event_streams")
        .select("id")
        .eq("event_id", ev.id)
        .eq("is_active", true)
        .single();

      if (activeErr) {
        console.error(
          `Error checking active streams for event ${ev.id}:`,
          activeErr
        );
        continue;
      }

      const hasActive = !!activeStreams;

      if (!hasActive) {
        // 3a) Mark event not live
        const { error: updateEventErr } = await admin
          .from("events")
          .update({
            is_live: false,
            time: new Date().toISOString().slice(11, 19),
            date: new Date().toISOString().slice(0, 10),
            livekit_room_name: null,
          })
          .eq("id", ev.id);

        if (updateEventErr) {
          console.error(
            `Error updating event ${ev.id} to not live:`,
            updateEventErr
          );
          continue;
        }
        await admin.from("event_streams").delete().eq("event_id", ev.id);

        closed.push(ev.id);
      } else {
        stillLive.push(ev.id);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        thresholdSec,
        closed,
        stillLive,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("cleanup-stale-streams error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
