import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AccessToken } from "https://esm.sh/livekit-server-sdk@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateTokenRequest {
  eventId: string;
  userRole?: "host" | "streamer" | "viewer";
  permissions?: {
    canPublish?: boolean;
    canSubscribe?: boolean;
    canPublishData?: boolean;
  };
}

interface CreateTokenResponse {
  token: string;
  roomName: string;
  serverUrl: string;
  expiresAt: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const LIVEKIT_API_KEY = Deno.env.get("LIVEKIT_API_KEY");
    const LIVEKIT_API_SECRET = Deno.env.get("LIVEKIT_API_SECRET");
    const LIVEKIT_WS_URL = Deno.env.get("LIVEKIT_WS_URL");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_WS_URL) {
      throw new Error("LiveKit credentials not configured");
    }

    // Authenticate user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response("Unauthorized", {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response("Unauthorized", {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Parse request body
    const {
      eventId,
      userRole = "viewer",
      permissions,
    }: CreateTokenRequest = await req.json();

    if (!eventId) {
      return new Response("Event ID is required", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*, livekit_room_name")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return new Response("Event not found", {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Check if user has ticket for paid events
    let hasTicket = true;
    if (event.ticket_price && event.ticket_price > 0 && userRole === "viewer") {
      const { data: ticket } = await supabase
        .from("tickets")
        .select("id")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      hasTicket = !!ticket;
    }

    // Check user role in event
    const { data: participant } = await supabase
      .from("event_participants")
      .select("role, permissions")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();

    const actualRole = participant?.role || userRole;

    // Generate permissions based on role
    const getPermissions = (role: string, hasTicket: boolean) => {
      switch (role) {
        case "host":
          return {
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
            hidden: false,
            recorder: false,
          };

        case "streamer":
          return {
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
            hidden: false,
            recorder: false,
          };

        case "viewer":
          return {
            roomJoin: hasTicket,
            canPublish: false,
            canSubscribe: hasTicket,
            canPublishData: false,
            hidden: false,
            recorder: false,
          };

        default:
          return { roomJoin: false };
      }
    };

    const tokenPermissions = getPermissions(actualRole, hasTicket);

    if (!tokenPermissions.roomJoin) {
      return new Response("Access denied - ticket required", {
        status: 403,
        headers: corsHeaders,
      });
    }

    console.log({ LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_WS_URL });
    // Create LiveKit access token
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: user.id,
      name: user.email || `User ${user.id}`,
    });

    at.addGrant(tokenPermissions);

    const token = await at.toJwt();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token in database
    await supabase.from("event_participants").upsert({
      event_id: eventId,
      user_id: user.id,
      role: actualRole,
      permissions: participant?.permissions || [],
      livekit_token: token,
      token_expires_at: expiresAt.toISOString(),
      last_seen: new Date().toISOString(),
    });

    const response: CreateTokenResponse = {
      token,
      roomName: event.livekit_room_name,
      serverUrl: LIVEKIT_WS_URL,
      expiresAt: expiresAt.toISOString(),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating LiveKit token:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
