import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type ReasonCategory =
  | "spam_scam"
  | "hate_harassment"
  | "sexual_nudity"
  | "violence"
  | "copyright_ip"
  | "misleading"
  | "other";

type Action = "submit" | "status";

interface SubmitBody {
  action?: Action;
  eventId: string;
  reason_category?: ReasonCategory;
  reason_text?: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Admin client (bypasses RLS) for validations and reads
  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const authHeader = req.headers.get("Authorization") || "";
  const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  try {
    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse body (for both submit and status we accept POST with JSON)
    let body: SubmitBody = { action: "status", eventId: "" } as SubmitBody;
    if (req.method === "POST") {
      body = (await req.json()) as SubmitBody;
    }

    const action: Action = body.action || "submit";
    const eventId = body.eventId;

    if (!eventId) {
      return new Response(JSON.stringify({ error: "eventId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate event exists and not deleted (FK will enforce existence too)
    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id, created_by")
      .eq("id", eventId)
      .maybeSingle();

    if (eventError || !event) {
      return new Response(JSON.stringify({ error: "Event not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is host or streamer
    let isHostOrStreamer = event.created_by === user.id;
    if (!isHostOrStreamer) {
      const { data: participant } = await supabaseAdmin
        .from("event_participants")
        .select("role")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (participant && ["host", "streamer"].includes(participant.role as string)) {
        isHostOrStreamer = true;
      }
    }

    if (action === "status") {
      // Return whether already reported
      const { data: existing } = await supabaseAdmin
        .from("event_reports")
        .select("id")
        .eq("event_id", eventId)
        .eq("reporter_user_id", user.id)
        .maybeSingle();

      return new Response(
        JSON.stringify({ alreadyReported: !!existing }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // action === submit
    if (isHostOrStreamer) {
      return new Response(
        JSON.stringify({ error: "Hosts/Streamers cannot report their own event" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Soft rate limit: max 5 reports per minute across all events
    const { count: recentCount } = await supabaseAdmin
      .from("event_reports")
      .select("id", { count: "exact", head: true })
      .eq("reporter_user_id", user.id)
      .gt("created_at", new Date(Date.now() - 60 * 1000).toISOString());

    if ((recentCount || 0) >= 5) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const reason_category = body.reason_category as ReasonCategory | undefined;
    const reason_text = (body.reason_text || null) as string | null;

    const allowed: ReasonCategory[] = [
      "spam_scam",
      "hate_harassment",
      "sexual_nudity",
      "violence",
      "copyright_ip",
      "misleading",
      "other",
    ];

    if (!reason_category || !allowed.includes(reason_category)) {
      return new Response(JSON.stringify({ error: "Invalid reason_category" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (reason_category === "other") {
      if (!reason_text || reason_text.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: "reason_text is required when category is 'other'" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (reason_text.length > 500) {
        return new Response(
          JSON.stringify({ error: "reason_text must be at most 500 characters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const reporter_ip = req.headers.get("x-forwarded-for") || null;
    const user_agent = req.headers.get("user-agent") || null;

    // Idempotent insert using upsert with onConflict
    const { data: upserted, error: upsertError } = await supabaseAdmin
      .from("event_reports")
      .upsert(
        [
          {
            event_id: eventId,
            reporter_user_id: user.id,
            reason_category,
            reason_text,
            reporter_ip,
            user_agent,
          },
        ],
        { onConflict: "event_id,reporter_user_id", ignoreDuplicates: true }
      )
      .select("id, created_at, status");

    if (upsertError) {
      console.error("report-event upsert error", upsertError);
      return new Response(JSON.stringify({ error: "Failed to submit report" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const alreadyReported = !upserted || upserted.length === 0;

    return new Response(
      JSON.stringify({ success: true, alreadyReported }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("report-event error", err);
    return new Response(JSON.stringify({ error: err?.message || "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
