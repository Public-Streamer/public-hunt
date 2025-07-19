
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AccessToken } from "https://esm.sh/livekit-server-sdk@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Authorization, x-client-info, apikey, content-type",
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
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log("🔧 Environment check:", {
      hasLiveKitKey: !!LIVEKIT_API_KEY,
      hasLiveKitSecret: !!LIVEKIT_API_SECRET,
      hasLiveKitUrl: !!LIVEKIT_WS_URL,
      hasSupabaseUrl: !!SUPABASE_URL,
      hasServiceRoleKey: !!SUPABASE_SERVICE_ROLE_KEY,
    });

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_WS_URL) {
      console.error("❌ Missing LiveKit credentials");
      throw new Error("LiveKit credentials not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("❌ Missing Supabase credentials");
      throw new Error("Supabase credentials not configured");
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    console.log("🔐 Auth header received:", !!authHeader);

    if (!authHeader) {
      console.error("❌ No authorization header provided");
      return new Response("Unauthorized - No auth header", {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Create Supabase client with service role for admin operations
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    console.log("🔍 Attempting to verify user with token...");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("❌ User verification error:", userError);
      return new Response("Unauthorized - Invalid token", {
        status: 401,
        headers: corsHeaders,
      });
    }

    if (!user) {
      console.error("❌ No user found with provided token");
      return new Response("Unauthorized - User not found", {
        status: 401,
        headers: corsHeaders,
      });
    }

    console.log("✅ User authenticated:", { userId: user.id, email: user.email });

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

    console.log("📋 Token request details:", { eventId, userRole, userId: user.id });

    // CRITICAL FIX: Look up the actual LiveKit room from livekit_rooms table
    console.log("🔍 Looking up LiveKit room for event:", eventId);
    const { data: livekitRoom, error: roomError } = await supabase
      .from("livekit_rooms")
      .select("*")
      .eq("event_id", eventId)
      .eq("is_active", true)
      .maybeSingle();

    if (roomError) {
      console.error("❌ Error looking up LiveKit room:", roomError);
      return new Response("Failed to lookup room", {
        status: 500,
        headers: corsHeaders,
      });
    }

    console.log("🏠 LiveKit room lookup result:", livekitRoom ? {
      roomName: livekitRoom.room_name,
      roomSid: livekitRoom.livekit_room_sid,
      isActive: livekitRoom.is_active,
      eventId: livekitRoom.event_id
    } : null);

    // If no active room exists, only hosts can request tokens (they need to create room first)
    if (!livekitRoom) {
      console.warn("⚠️ No active LiveKit room found for event:", eventId);
      
      // Check if user is the event host
      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("created_by")
        .eq("id", eventId)
        .single();

      if (eventError || !event) {
        console.error("❌ Event not found:", eventError);
        return new Response("Event not found", {
          status: 404,
          headers: corsHeaders,
        });
      }

      if (event.created_by !== user.id) {
        console.error("❌ Non-host user trying to join non-existent room");
        return new Response("No active stream found for this event. Only the event host can start streaming.", {
          status: 403,
          headers: corsHeaders,
        });
      }

      console.log("🎯 Host requesting token for event without active room - this should trigger room creation first");
      return new Response("No active room found. Please create the room first.", {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Get event details for role verification
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      console.error("❌ Event not found:", eventError);
      return new Response("Event not found", {
        status: 404,
        headers: corsHeaders,
      });
    }

    console.log("📅 Event details:", {
      eventId,
      createdBy: event.created_by,
      userId: user.id,
    });

    // Determine user's actual role in the event
    let actualRole = userRole; // fallback to provided role

    // Check if user is host (event creator)
    if (event.created_by === user.id) {
      actualRole = "host";
      console.log("👑 User is event host");
    } else {
      // Check if user is assigned as streamer
      const { data: streamerData } = await supabase
        .from("event_streamers")
        .select("*")
        .eq("event_id", eventId)
        .eq("streamer_id", user.id)
        .single();

      if (streamerData) {
        actualRole = "streamer";
        console.log("🎥 User is assigned streamer");
      } else {
        actualRole = "viewer";
        console.log("👀 User is viewer");
      }
    }

    // Validate that the passed userRole matches the determined role (security check)
    if (userRole !== "viewer" && userRole !== actualRole) {
      console.warn(
        `⚠️ Role mismatch: passed=${userRole}, actual=${actualRole}. Using actual role.`
      );
    }

    console.log("🎭 Final role determination:", {
      passedRole: userRole,
      actualRole,
    });

    // Check if user has ticket for paid events (only for viewers)
    let hasTicket = true;
    if (
      event.ticket_price &&
      event.ticket_price > 0 &&
      actualRole === "viewer"
    ) {
      const { data: ticket } = await supabase
        .from("tickets")
        .select("id")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      hasTicket = !!ticket;
      console.log("🎫 Ticket check for viewer:", {
        hasTicket,
        ticketPrice: event.ticket_price,
      });
    }

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
      console.error("❌ Access denied - ticket required");
      return new Response("Access denied - ticket required", {
        status: 403,
        headers: corsHeaders,
      });
    }

    // CRITICAL: Use the actual room name from livekit_rooms table, not from events table
    const actualRoomName = livekitRoom.room_name;
    console.log("🏠 Using ACTUAL room name from database:", actualRoomName);
    console.log("🔗 Room SID from database:", livekitRoom.livekit_room_sid);
    
    // Create LiveKit access token with unique identity
    const uniqueIdentity = `${user.id}-${eventId}`;
    console.log("🆔 Creating token with identity:", uniqueIdentity);
    
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: uniqueIdentity,
      name: user.email || `User ${user.id}`,
    });

    // CRITICAL: Use the actual room name from the database
    at.addGrant({
      ...tokenPermissions,
      room: actualRoomName, // This is the ACTUAL room name from livekit_rooms table
    });

    const token = await at.toJwt();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store/update participant information for tracking
    await supabase.from("event_participants").upsert({
      event_id: eventId,
      user_id: user.id,
      role: actualRole,
      permissions: [],
      livekit_token: token,
      token_expires_at: expiresAt.toISOString(),
      last_seen: new Date().toISOString(),
    });

    const response: CreateTokenResponse = {
      token,
      roomName: actualRoomName, // Return the ACTUAL room name
      serverUrl: LIVEKIT_WS_URL,
      expiresAt: expiresAt.toISOString(),
    };

    console.log(`✅ Token created successfully for user ${user.id} in event ${eventId}:`, {
      roomName: response.roomName,
      roomSid: livekitRoom.livekit_room_sid,
      identity: uniqueIdentity,
      role: actualRole,
      permissions: tokenPermissions,
      databaseRoomId: livekitRoom.id
    });

    console.log("🎯 CRITICAL VERIFICATION - Room Mapping:", {
      "Event ID": eventId,
      "Database Room Name": livekitRoom.room_name,
      "Database Room SID": livekitRoom.livekit_room_sid,
      "Token Room Name": response.roomName,
      "Room Active": livekitRoom.is_active,
      "Match Check": livekitRoom.room_name === response.roomName ? "✅ MATCH" : "❌ MISMATCH"
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error creating LiveKit token:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
