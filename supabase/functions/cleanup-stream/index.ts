import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { eventId, userId, action } = await req.json();

    if (action === 'stop_stream' && eventId && userId) {
      console.log(`Emergency cleanup for event ${eventId}, user ${userId}`);

      // Update participant status to not live
      await supabase
        .from('event_participants')
        .update({ 
          is_live: false, 
          is_active: false,
          last_seen: new Date().toISOString()
        })
        .eq('event_id', eventId)
        .eq('user_id', userId);

      // Update event streams to inactive
      await supabase
        .from('event_streams')
        .update({ is_active: false })
        .eq('event_id', eventId)
        .eq('streamer_id', userId);

      // Check if there are any other live participants
      const { data: liveParticipants } = await supabase
        .from('event_participants')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_live', true)
        .in('role', ['host', 'streamer']);

      // If no live participants, mark event as not live
      if (!liveParticipants || liveParticipants.length === 0) {
        await supabase
          .from('events')
          .update({ 
            is_live: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', eventId);

        console.log(`Event ${eventId} marked as not live - no active participants`);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Stream cleaned up successfully' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );

  } catch (error) {
    console.error('Cleanup error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});