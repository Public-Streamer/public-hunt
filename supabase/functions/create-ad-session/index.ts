import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateAdSessionRequest {
  eventId: string;
  adId: string;
  viewerCount: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { eventId, adId, viewerCount }: CreateAdSessionRequest = await req.json();

    console.log('Creating ad session:', { eventId, adId, viewerCount, userId: user.id });

    // Verify user is the event host
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, created_by, ticket_price')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (event.created_by !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Only event hosts can trigger ads' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Only allow ads on free events
    if (event.ticket_price && event.ticket_price > 0) {
      return new Response(
        JSON.stringify({ error: 'Ads are only allowed on free events' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify ad exists and has budget
    const { data: ad, error: adError } = await supabase
      .from('ads')
      .select('id, title, budget_remaining, campaign_status')
      .eq('id', adId)
      .single();

    if (adError || !ad) {
      return new Response(
        JSON.stringify({ error: 'Ad not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (ad.campaign_status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Ad is not active' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (ad.budget_remaining <= 0) {
      return new Response(
        JSON.stringify({ error: 'Ad has no remaining budget' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create ad session
    const { data: adSession, error: sessionError } = await supabase
      .from('event_ad_sessions')
      .insert({
        event_id: eventId,
        ad_id: adId,
        triggered_by: user.id,
        viewer_count: viewerCount,
        status: 'active'
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating ad session:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create ad session' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Ad session created successfully:', adSession.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sessionId: adSession.id,
        adTitle: ad.title 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating ad session:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});