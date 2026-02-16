import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Stripe } from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RecordingRequest {
  eventId: string;
  action: 'start' | 'stop' | 'get_status' | 'update_settings';
  streamId?: string;
  recordingSettings?: {
    quality?: string;
    autoRecord?: boolean;
    storageLimit?: number;
  };
}

interface RecordingResponse {
  success: boolean;
  recording?: {
    id: string;
    eventId: string;
    status: string;
    recordingUrl?: string;
    duration?: number;
    fileSize?: number;
  };
  error?: string;
}

serve(async (req) => {
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

    const { eventId, action, streamId, recordingSettings }: RecordingRequest = await req.json();

    // Verify user has access to this event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, created_by, recording_enabled, auto_record")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      throw new Error("Event not found or access denied");
    }

    // Check if user is host or has recording permissions
    if (event.created_by !== user.id) {
      // Check if user is assigned as streamer with recording permissions
      const { data: streamerData } = await supabase
        .from("event_streamers")
        .select("*")
        .eq("event_id", eventId)
        .eq("streamer_id", user.id)
        .single();

      if (!streamerData) {
        throw new Error("Only event hosts can manage recordings");
      }
    }

    // Handle different actions
    switch (action) {
      case 'start': {
        // Check if recording is already in progress
        const { data: existingRecording } = await supabase
          .from("recordings")
          .select("id, status")
          .eq("event_id", eventId)
          .eq("status", 'recording')
          .single();

        if (existingRecording) {
          return new Response(JSON.stringify({
            success: false,
            error: "Recording already in progress"
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          });
        }

        // Create new recording record
        const recordingName = `Recording-${eventId}-${new Date().toISOString()}`;
        const recordingKey = `recordings/${user.id}/${eventId}/${Date.now()}.mp4`;

        const { data: newRecording, error: recordingError } = await supabase
          .from("recordings")
          .insert({
            event_id: eventId,
            stream_id: streamId,
            recording_name: recordingName,
            recording_url: recordingKey,
            status: 'recording',
            starts_at: new Date().toISOString(),
            quality: recordingSettings?.quality || 'HD',
            is_public: false,
            metadata: {
              initiated_by: user.id,
              settings: recordingSettings
            }
          })
          .select()
          .single();

        if (recordingError) {
          throw new Error("Failed to create recording: " + recordingError.message);
        }

        // In a real implementation, this would trigger the actual recording process
        // For this demo, we'll simulate it by updating the status after a delay

        return new Response(JSON.stringify({
          success: true,
          recording: {
            id: newRecording.id,
            eventId: newRecording.event_id,
            status: newRecording.status,
            recordingUrl: newRecording.recording_url,
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case 'stop': {
        // Find active recording
        const { data: activeRecording } = await supabase
          .from("recordings")
          .select("id, status")
          .eq("event_id", eventId)
          .eq("status", 'recording')
          .single();

        if (!activeRecording) {
          return new Response(JSON.stringify({
            success: false,
            error: "No active recording found"
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 404,
          });
        }

        // Update recording status
        const { error: updateError } = await supabase
          .from("recordings")
          .update({
            status: 'processing',
            ends_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("id", activeRecording.id);

        if (updateError) {
          throw new Error("Failed to stop recording: " + updateError.message);
        }

        // In a real implementation, this would trigger the processing pipeline
        // For this demo, we'll simulate processing completion

        return new Response(JSON.stringify({
          success: true,
          recording: {
            id: activeRecording.id,
            eventId,
            status: 'processing'
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case 'get_status': {
        // Get current recording status
        const { data: recording, error: recordingError } = await supabase
          .from("recordings")
          .select("id, event_id, status, recording_url, duration, file_size, starts_at, ends_at")
          .eq("event_id", eventId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (recordingError) {
          return new Response(JSON.stringify({
            success: false,
            error: "No recordings found for this event"
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 404,
          });
        }

        // Calculate duration if available
        let duration = recording.duration;
        if (recording.starts_at && recording.ends_at && !duration) {
          const startTime = new Date(recording.starts_at).getTime();
          const endTime = new Date(recording.ends_at).getTime();
          duration = Math.floor((endTime - startTime) / 1000);
        }

        return new Response(JSON.stringify({
          success: true,
          recording: {
            id: recording.id,
            eventId: recording.event_id,
            status: recording.status,
            recordingUrl: recording.recording_url,
            duration,
            fileSize: recording.file_size
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case 'update_settings': {
        // Update event recording settings
        const { error: updateError } = await supabase
          .from("events")
          .update({
            recording_enabled: recordingSettings?.autoRecord || false,
            auto_record: recordingSettings?.autoRecord || false,
            recording_quality: recordingSettings?.quality || 'HD',
            recording_storage_limit: recordingSettings?.storageLimit || 1024
          })
          .eq("id", eventId);

        if (updateError) {
          throw new Error("Failed to update recording settings: " + updateError.message);
        }

        return new Response(JSON.stringify({
          success: true,
          recording: {
            eventId,
            status: 'settings_updated'
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      default:
        throw new Error("Invalid action");
    }
  } catch (error) {
    console.error("Recording management error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});