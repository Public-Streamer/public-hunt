import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { RoomServiceClient } from "https://esm.sh/livekit-server-sdk@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ManageRoomRequest {
  action: "create" | "close" | "update" | "get_info" | "cleanup";
  eventId: string;
  roomConfig?: {
    maxParticipants?: number;
    emptyTimeout?: number;
    enableRecording?: boolean;
    nodeId?: string;
    metadata?: Record<string, any>;
  };
}

interface ManageRoomResponse {
  success: boolean;
  room?: {
    sid: string;
    name: string;
    maxParticipants: number;
    numParticipants: number;
    creationTime: string;
    turnPassword: string;
    enabledCodecs: string[];
    metadata: string;
  };
  error?: string;
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

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_WS_URL) {
      throw new Error("LiveKit credentials not configured");
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header received:", !!authHeader);

    if (!authHeader) {
      console.error("No authorization header provided");
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
    const { action, eventId, roomConfig }: ManageRoomRequest = await req.json();

    if (!eventId) {
      return new Response("Event ID is required", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*, livekit_room_name, created_by")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return new Response("Event not found", {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Check if user is authorized to manage the room
    if (event.created_by !== user.id) {
      // Check if user is a participant with host/streamer role
      const { data: participant } = await supabase
        .from("event_participants")
        .select("role")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .single();

      // Also check if user is in event_streamers table
      const { data: streamer } = await supabase
        .from("event_streamers")
        .select("role_type")
        .eq("event_id", eventId)
        .eq("streamer_id", user.id)
        .single();

      const hasParticipantPermission =
        participant && ["host", "streamer"].includes(participant.role);
      const hasStreamerPermission =
        streamer && streamer.role_type === "Streamers";

      if (!hasParticipantPermission && !hasStreamerPermission) {
        return new Response("Forbidden - insufficient permissions", {
          status: 403,
          headers: corsHeaders,
        });
      }
    }

    // Initialize LiveKit client
    const roomClient = new RoomServiceClient(
      LIVEKIT_WS_URL,
      LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET
    );

    let response: ManageRoomResponse;

    switch (action) {
      case "create":
        try {
          const roomOptions = {
            name: event.livekit_room_name,
            maxParticipants: roomConfig?.maxParticipants || 100,
            emptyTimeout: roomConfig?.emptyTimeout || 300,
            metadata: JSON.stringify({
              eventId,
              createdBy: user.id,
              ...roomConfig?.metadata,
            }),
          };

          const room = await roomClient.createRoom(roomOptions);

          console.log(`✅ LiveKit room created successfully:`, {
            requestedName: event.livekit_room_name,
            actualName: room.name,
            sid: room.sid,
            maxParticipants: room.maxParticipants,
          });

          // Verify room name consistency
          if (room.name !== event.livekit_room_name) {
            console.warn(
              `⚠️ Room name mismatch! Requested: ${event.livekit_room_name}, Actual: ${room.name}`
            );
          }

          // Update database with ACTUAL room info from LiveKit
          await supabase.from("livekit_rooms").upsert({
            event_id: eventId,
            room_name: room.name, // Use actual room name from LiveKit
            livekit_room_sid: room.sid, // Use actual SID from LiveKit
            is_active: true,
            max_participants: room.maxParticipants, // Use actual value
            recording_enabled: roomConfig?.enableRecording || false,
            room_settings: {
              ...roomOptions,
              actualRoomName: room.name,
              actualSid: room.sid,
            },
          });

          console.log(
            `✅ Database updated with room details for event ${eventId}`
          );

          // Mark event as live
          await supabase
            .from("events")
            .update({
              is_live: true,
              stream_url: LIVEKIT_WS_URL,
            })
            .eq("id", eventId);

          response = {
            success: true,
            room: {
              sid: room.sid,
              name: room.name,
              maxParticipants: room.maxParticipants,
              numParticipants: room.numParticipants,
              creationTime: new Date(
                Number(room.creationTime) * 1000
              ).toISOString(),
              turnPassword: room.turnPassword,
              enabledCodecs: room.enabledCodecs.map((c) => c.mime),
              metadata: room.metadata,
            },
          };
        } catch (error) {
          console.error("Error creating room:", error);
          response = {
            success: false,
            error: error.message,
          };
        }
        break;

      case "close":
        try {
          await roomClient.deleteRoom(event.livekit_room_name);

          // Update database
          await supabase
            .from("livekit_rooms")
            .update({
              is_active: false,
              closed_at: new Date().toISOString(),
            })
            .eq("event_id", eventId);

          await supabase
            .from("events")
            .update({
              livekit_room_name: null,
            })
            .eq("id", eventId);

          response = { success: true };
        } catch (error) {
          console.error("Error closing room:", error);
          response = {
            success: false,
            error: error.message,
          };
        }
        break;

      case "get_info":
        try {
          const rooms = await roomClient.listRooms([event.livekit_room_name]);
          const room = rooms[0];

          if (room) {
            response = {
              success: true,
              room: {
                sid: room.sid,
                name: room.name,
                maxParticipants: room.maxParticipants,
                numParticipants: room.numParticipants,
                creationTime: new Date(
                  Number(room.creationTime) * 1000
                ).toISOString(),
                turnPassword: room.turnPassword,
                enabledCodecs: room.enabledCodecs.map((c) => c.mime),
                metadata: room.metadata,
              },
            };
          } else {
            response = {
              success: false,
              error: "Room not found",
            };
          }
        } catch (error) {
          console.error("Error getting room info:", error);
          response = {
            success: false,
            error: error.message,
          };
        }
        break;

      case "cleanup":
        try {
          console.log(`🧹 Starting cleanup of inactive rooms...`);

          // Get all inactive rooms from database
          const { data: inactiveRooms, error: roomError } = await supabase
            .from("livekit_rooms")
            .select("*")
            .eq("is_active", false);

          if (roomError) throw roomError;

          if (!inactiveRooms || inactiveRooms.length === 0) {
            console.log(`✅ No inactive rooms to clean up`);
            response = { success: true, message: "No rooms to clean up" };
            break;
          }

          console.log(
            `🧹 Found ${inactiveRooms.length} inactive rooms to clean up`
          );
          let cleanedCount = 0;

          // Delete each room from LiveKit server
          for (const room of inactiveRooms) {
            try {
              await roomClient.deleteRoom(room.room_name);
              cleanedCount++;
              console.log(
                `✅ Cleaned up room: ${room.room_name} (SID: ${room.livekit_room_sid})`
              );
            } catch (roomDelError) {
              console.warn(
                `⚠️ Failed to delete room ${room.room_name}:`,
                roomDelError.message
              );
              // Continue with other rooms even if one fails
            }
          }

          response = {
            success: true,
            message: `Cleaned up ${cleanedCount}/${inactiveRooms.length} rooms`,
            cleaned: cleanedCount,
            total: inactiveRooms.length,
          };

          console.log(
            `✅ Cleanup completed: ${cleanedCount}/${inactiveRooms.length} rooms cleaned`
          );
        } catch (error) {
          console.error("❌ Error during cleanup:", error);
          response = {
            success: false,
            error: error.message,
          };
        }
        break;

      default:
        response = {
          success: false,
          error: "Invalid action",
        };
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in manage-livekit-room:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
