import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImpressionRequest {
  sessionId: string;
  adId: string;
  eventId: string;
  duration: number;
  twoSecondThreshold?: boolean;
  skipClicked?: boolean;
  isHeartbeat?: boolean;
  isFinal?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      sessionId,
      adId,
      eventId,
      duration,
      twoSecondThreshold = false,
      skipClicked = false,
      isHeartbeat = false,
      isFinal = false,
    }: ImpressionRequest = await req.json();

    console.log('Recording ad impression:', {
      sessionId,
      adId,
      eventId,
      duration,
      twoSecondThreshold,
      skipClicked,
      isHeartbeat,
      isFinal,
    });

    // Extract viewer metadata
    const viewerIp = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Check if impression already exists (for initial insert)
    if (!isHeartbeat && !isFinal) {
      const { data: existing } = await supabase
        .from('ad_impressions')
        .select('id')
        .eq('viewer_session_id', sessionId)
        .eq('ad_id', adId)
        .maybeSingle();

      if (existing) {
        console.log('Impression already exists for session:', sessionId);
        return new Response(
          JSON.stringify({ error: 'Duplicate impression' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Create initial impression record
      const { error: insertError } = await supabase
        .from('ad_impressions')
        .insert({
          ad_id: adId,
          event_id: eventId,
          viewer_session_id: sessionId,
          viewer_ip: viewerIp,
          user_agent: userAgent,
          view_duration_seconds: duration,
          viewed_at_2s: twoSecondThreshold,
          skip_clicked: skipClicked,
        });

      if (insertError) {
        console.error('Error inserting impression:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to record impression' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('Initial impression recorded successfully');
    } else {
      // Update existing impression (heartbeat or final)
      const updateData: any = {
        view_duration_seconds: duration,
      };

      if (twoSecondThreshold) {
        updateData.viewed_at_2s = true;
      }

      if (skipClicked) {
        updateData.skip_clicked = true;
      }

      const { error: updateError } = await supabase
        .from('ad_impressions')
        .update(updateData)
        .eq('viewer_session_id', sessionId)
        .eq('ad_id', adId);

      if (updateError) {
        console.error('Error updating impression:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update impression' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (isFinal) {
        console.log('Final impression update recorded');
      } else if (isHeartbeat) {
        console.log('Heartbeat update recorded');
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in record-ad-impression:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
