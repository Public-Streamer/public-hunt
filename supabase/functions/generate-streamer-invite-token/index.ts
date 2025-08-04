import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AccessToken } from "https://esm.sh/livekit-server-sdk@2.13.1";

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
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const livekitApiKey = Deno.env.get('LIVEKIT_API_KEY');
    const livekitApiSecret = Deno.env.get('LIVEKIT_API_SECRET');
    const livekitWsUrl = Deno.env.get('LIVEKIT_WS_URL');

    if (!supabaseUrl || !supabaseServiceRoleKey || !livekitApiKey || !livekitApiSecret || !livekitWsUrl) {
      throw new Error('Missing required environment variables');
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { eventId } = await req.json();
    if (!eventId) {
      throw new Error('Event ID is required');
    }

    console.log('Generating streamer invite token for event:', eventId);

    // Verify user is the event host
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new Error('Event not found');
    }

    if (event.created_by !== user.id) {
      throw new Error('Only event hosts can generate invite tokens');
    }

    // Generate temporary LiveKit token for streamers
    const at = new AccessToken(livekitApiKey, livekitApiSecret, {
      identity: `invite-${eventId}-${Date.now()}`,
      ttl: '24h', // Token expires in 24 hours
    });

    const roomName = event.livekit_room_name || `event-${eventId}`;
    
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      canUpdateOwnMetadata: true,
    });

    const inviteToken = await at.toJwt();

    console.log('Streamer invite token generated successfully');

    return new Response(
      JSON.stringify({
        token: inviteToken,
        roomName,
        serverUrl: livekitWsUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-streamer-invite-token function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});