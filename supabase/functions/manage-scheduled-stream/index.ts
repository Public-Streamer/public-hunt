import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { RoomServiceClient } from "https://esm.sh/livekit-server-sdk@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ScheduledStreamRequest {
  eventId?: string;
  action:
  | 'create_schedule'
  | 'update_schedule'
  | 'cancel_schedule'
  | 'get_schedule'
  | 'get_upcoming_streams'
  | 'check_scheduled_streams'
  | 'create_room_for_scheduled_stream'
  | 'process_notifications';
  scheduleData?: {
    scheduledStartTime: string;
    scheduledEndTime?: string;
    timeZone?: string;
    automaticRoomCreation?: boolean;
    recurrencePattern?: string;
    recurrenceEndDate?: string;
  };
  scheduleId?: string;
  userId?: string;
}

interface ScheduledStreamResponse {
  success: boolean;
  schedule?: any;
  schedules?: any[];
  error?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    const {
      eventId,
      action,
      scheduleData,
      scheduleId,
      userId,
    }: ScheduledStreamRequest = await req.json();

    // Verify user has access to this event (if eventId provided)
    if (eventId) {
      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("id, created_by")
        .eq("id", eventId)
        .single();

      if (eventError || !event) {
        throw new Error("Event not found or access denied");
      }

      // Check if user is host
      if (event.created_by !== user.id) {
        throw new Error("Only event hosts can manage streaming schedules");
      }
    }

    // Handle different actions
    switch (action) {
      case 'create_schedule': {
        if (!eventId || !scheduleData) {
          throw new Error("Event ID and schedule data are required");
        }

        // Create new streaming schedule
        const { data: newSchedule, error: scheduleError } = await supabase
          .from("streaming_schedule")
          .insert({
            event_id: eventId,
            scheduled_start_time: scheduleData.scheduledStartTime,
            scheduled_end_time: scheduleData.scheduledEndTime,
            time_zone: scheduleData.timeZone || 'UTC',
            automatic_room_creation: scheduleData.automaticRoomCreation || false,
            recurrence_pattern: scheduleData.recurrencePattern || 'none',
            recurrence_end_date: scheduleData.recurrenceEndDate,
            status: 'scheduled',
            metadata: {
              created_by: user.id,
              created_at: new Date().toISOString(),
            },
          })
          .select()
          .single();

        if (scheduleError) {
          throw new Error("Failed to create schedule: " + scheduleError.message);
        }

        // Update event with schedule information
        await supabase
          .from("events")
          .update({
            scheduled_start_time: scheduleData.scheduledStartTime,
            scheduled_end_time: scheduleData.scheduledEndTime,
            automatic_room_creation: scheduleData.automaticRoomCreation || false,
            time_zone: scheduleData.timeZone || 'UTC',
            recurrence_pattern: scheduleData.recurrencePattern || 'none',
            recurrence_end_date: scheduleData.recurrenceEndDate,
          })
          .eq("id", eventId);

        return new Response(JSON.stringify({
          success: true,
          schedule: newSchedule,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case 'update_schedule': {
        if (!scheduleId || !scheduleData) {
          throw new Error("Schedule ID and schedule data are required");
        }

        // Update existing schedule
        const { data: updatedSchedule, error: updateError } = await supabase
          .from("streaming_schedule")
          .update({
            scheduled_start_time: scheduleData.scheduledStartTime,
            scheduled_end_time: scheduleData.scheduledEndTime,
            time_zone: scheduleData.timeZone || 'UTC',
            automatic_room_creation: scheduleData.automaticRoomCreation,
            recurrence_pattern: scheduleData.recurrencePattern || 'none',
            recurrence_end_date: scheduleData.recurrenceEndDate,
            updated_at: new Date().toISOString(),
          })
          .eq("id", scheduleId)
          .select()
          .single();

        if (updateError) {
          throw new Error("Failed to update schedule: " + updateError.message);
        }

        // Update event with new schedule information
        if (updatedSchedule.event_id) {
          await supabase
            .from("events")
            .update({
              scheduled_start_time: scheduleData.scheduledStartTime,
              scheduled_end_time: scheduleData.scheduledEndTime,
              automatic_room_creation: scheduleData.automaticRoomCreation || false,
              time_zone: scheduleData.timeZone || 'UTC',
              recurrence_pattern: scheduleData.recurrencePattern || 'none',
              recurrence_end_date: scheduleData.recurrenceEndDate,
            })
            .eq("id", updatedSchedule.event_id);
        }

        return new Response(JSON.stringify({
          success: true,
          schedule: updatedSchedule,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case 'cancel_schedule': {
        if (!scheduleId) {
          throw new Error("Schedule ID is required");
        }

        // Cancel the schedule
        const { data: cancelledSchedule, error: cancelError } = await supabase
          .from("streaming_schedule")
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq("id", scheduleId)
          .select()
          .single();

        if (cancelError) {
          throw new Error("Failed to cancel schedule: " + cancelError.message);
        }

        // Create cancellation notifications
        await supabase
          .from("scheduled_stream_notifications")
          .insert({
            schedule_id: scheduleId,
            user_id: user.id,
            notification_type: 'cancelled',
            notification_method: 'in_app',
            notification_status: 'pending',
            notification_content: {
              title: "Stream Cancelled",
              message: `The scheduled stream "${cancelledSchedule.event_id}" has been cancelled.`,
              eventId: cancelledSchedule.event_id,
            },
            scheduled_send_time: new Date().toISOString(),
          });

        return new Response(JSON.stringify({
          success: true,
          schedule: cancelledSchedule,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case 'get_schedule': {
        if (!eventId) {
          throw new Error("Event ID is required");
        }

        // Get schedule for event
        const { data: schedule, error: scheduleError } = await supabase
          .from("streaming_schedule")
          .select("*")
          .eq("event_id", eventId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (scheduleError) {
          return new Response(JSON.stringify({
            success: false,
            error: "No schedule found for this event",
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 404,
          });
        }

        return new Response(JSON.stringify({
          success: true,
          schedule,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case 'get_upcoming_streams': {
        // Get upcoming streams for user (either as host or participant)
        const now = new Date().toISOString();

        // Get streams where user is host
        const { data: hostedStreams, error: hostedError } = await supabase
          .from("streaming_schedule")
          .select(`
            *,
            events:events(id, name, description, date, time, ticket_price, is_live, media_urls)
          `)
          .eq("status", "scheduled")
          .gt("scheduled_start_time", now)
          .order("scheduled_start_time", { ascending: true })
          .returns<any[]>();

        if (hostedError) {
          console.error("Error fetching hosted streams:", hostedError);
        }

        // Get streams where user has tickets
        const { data: ticketedStreams, error: ticketedError } = await supabase
          .from("tickets")
          .select(`
            events:events!inner(
              id,
              name,
              description,
              date,
              time,
              ticket_price,
              is_live,
              media_urls,
              streaming_schedule:streaming_schedule!inner(
                *,
                events:events(id)
              )
            )
          `)
          .eq("tickets.user_id", user.id)
          .eq("streaming_schedule.status", "scheduled")
          .gt("streaming_schedule.scheduled_start_time", now)
          .order("streaming_schedule.scheduled_start_time", { ascending: true })
          .returns<any[]>();

        if (ticketedError) {
          console.error("Error fetching ticketed streams:", ticketedError);
        }

        // Combine and deduplicate streams
        const allStreams = [...(hostedStreams || []), ...(ticketedStreams || [])];

        return new Response(JSON.stringify({
          success: true,
          schedules: allStreams,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case 'check_scheduled_streams': {
        // This would be called by a cron job or scheduled function
        // Check for streams that should start soon and create rooms automatically
        const now = new Date();
        const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000).toISOString();

        // Find streams that need rooms created (automatic_room_creation = true, room_created = false)
        const { data: streamsToProcess, error: fetchError } = await supabase
          .from("streaming_schedule")
          .select("*, events:events(id, name, livekit_room_name)")
          .eq("automatic_room_creation", true)
          .eq("room_created", false)
          .eq("status", "scheduled")
          .lt("scheduled_start_time", tenMinutesFromNow)
          .gt("scheduled_start_time", fiveMinutesFromNow);

        if (fetchError) {
          console.error("Error fetching streams to process:", fetchError);
          return new Response(JSON.stringify({
            success: false,
            error: "Failed to check scheduled streams",
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          });
        }

        // Initialize LiveKit client
        const roomService = new RoomServiceClient(
          Deno.env.get('LIVEKIT_WS_URL')!,
          Deno.env.get('LIVEKIT_API_KEY')!,
          Deno.env.get('LIVEKIT_API_SECRET')!
        );

        // Process each stream
        const results = [];
        for (const stream of streamsToProcess || []) {
          try {
            // Create LiveKit room if it doesn't exist
            let roomName = stream.events.livekit_room_name;
            let roomSid = null;

            if (!roomName) {
              roomName = `event-${stream.event_id}`;

              // Create room in LiveKit
              const room = await roomService.createRoom({
                name: roomName,
                emptyTimeout: 10 * 60, // 10 minutes
                metadata: JSON.stringify({ eventId: stream.event_id, type: 'scheduled' }),
              });
              roomSid = room.sid;

              // Register room in database
              await supabase
                .from('livekit_rooms')
                .insert({
                  event_id: stream.event_id,
                  room_name: roomName,
                  livekit_room_sid: room.sid,
                  is_active: true,
                  room_settings: { source: 'scheduled_automation' },
                });

              // Link to event
              await supabase
                .from("events")
                .update({
                  livekit_room_name: roomName,
                })
                .eq("id", stream.event_id);
            }

            // Mark room as created in schedule
            await supabase
              .from("streaming_schedule")
              .update({
                room_created: true,
                room_creation_time: new Date().toISOString(),
              })
              .eq("id", stream.id);

            results.push({
              success: true,
              streamId: stream.id,
              eventId: stream.event_id,
              roomName: roomName,
              roomSid: roomSid
            });
          } catch (error: any) {
            console.error(`Error processing stream ${stream.id}:`, error);
            results.push({
              success: false,
              streamId: stream.id,
              error: error.message,
            });
          }
        }

        // --- NEW: Check for reminders (15 mins before) ---
        const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000).toISOString();
        const { data: streamsReminders } = await supabase
          .from("streaming_schedule")
          .select("id, event_id, events(name, created_by)")
          .eq("status", "scheduled")
          .eq("reminder_sent", false)
          .lt("scheduled_start_time", fifteenMinutesFromNow)
          .gt("scheduled_start_time", now.toISOString());

        for (const stream of streamsReminders || []) {
          // Create notification
          await supabase.from("scheduled_stream_notifications").insert({
            schedule_id: stream.id,
            user_id: stream.events.created_by, // Notify host for now, ideally all ticket holders
            notification_type: 'reminder',
            notification_method: 'in_app',
            notification_content: {
              title: "Stream Starting Soon",
              message: `Your stream for ${stream.events.name} starts in 15 minutes.`,
              eventId: stream.event_id
            },
            scheduled_send_time: new Date().toISOString()
          });

          // Mark reminder as sent
          await supabase.from("streaming_schedule")
            .update({ reminder_sent: true })
            .eq("id", stream.id);
        }

        return new Response(JSON.stringify({
          success: true,
          processedStreams: results,
          remindersSent: streamsReminders?.length || 0
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case 'process_notifications': {
        // Simulate sending notifications
        const { data: pendingNotifications } = await supabase
          .from("scheduled_stream_notifications")
          .select("*")
          .eq("notification_status", "pending")
          .lt("scheduled_send_time", new Date().toISOString())
          .limit(50);

        let processed = 0;
        for (const notif of pendingNotifications || []) {
          // In real app: Send Email/Push here
          console.log(`[Mock Send] Sending ${notif.notification_type} to ${notif.user_id}:`, notif.notification_content);

          await supabase
            .from("scheduled_stream_notifications")
            .update({
              notification_status: 'sent',
              actual_send_time: new Date().toISOString()
            })
            .eq("id", notif.id);
          processed++;
        }

        return new Response(JSON.stringify({
          success: true,
          processed
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case 'create_room_for_scheduled_stream': {
        // Manual trigger to create room for a scheduled stream
        if (!scheduleId) {
          throw new Error("Schedule ID is required");
        }

        const { data: schedule, error: scheduleError } = await supabase
          .from("streaming_schedule")
          .select("*, events:events(id, name, livekit_room_name)")
          .eq("id", scheduleId)
          .single();

        if (scheduleError || !schedule) {
          throw new Error("Schedule not found");
        }

        // Create LiveKit room if it doesn't exist
        if (!schedule.events.livekit_room_name) {
          const roomName = `event-${schedule.event_id}`;
          await supabase
            .from("events")
            .update({
              livekit_room_name: roomName,
            })
            .eq("id", schedule.event_id);
        }

        // Mark room as created
        await supabase
          .from("streaming_schedule")
          .update({
            room_created: true,
            room_creation_time: new Date().toISOString(),
          })
          .eq("id", scheduleId);

        return new Response(JSON.stringify({
          success: true,
          roomName: schedule.events.livekit_room_name || `event-${schedule.event_id}`,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      default:
        throw new Error("Invalid action");
    }
  } catch (error: any) {
    console.error("Scheduled streaming error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});