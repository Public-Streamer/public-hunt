import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client for bypassing RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;
    
    // Get user session for access control
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract token from "Bearer token" format
    const token = authHeader.replace('Bearer ', '');
    
    // Verify user session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Check if user has access to this event (ticket or host/streamer role)
    const [ticketResult, eventResult, participantResult] = await Promise.all([
      // Check for paid ticket
      supabase
        .from('tickets')
        .select('status')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle(),
      
      // Check if user is event host
      supabase
        .from('events')
        .select('created_by, ticket_price')
        .eq('id', eventId)
        .single(),
      
      // Check if user is participant (host/streamer)
      supabase
        .from('event_participants')
        .select('role')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .in('role', ['host', 'streamer'])
        .maybeSingle()
    ]);

    const event = eventResult.data;
    const hasTicket = !!ticketResult.data;
    const isHost = event?.created_by === user.id;
    const isParticipant = !!participantResult.data;
    const isFreeEvent = !event?.ticket_price || event.ticket_price <= 0;

    // Grant access if: free event, has ticket, is host, or is participant
    const hasAccess = isFreeEvent || hasTicket || isHost || isParticipant;
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch current event state
    const [streamsResult, scorecardsResult] = await Promise.all([
      // Get active streams
      supabase
        .from('event_streams')
        .select(`
          id,
          streamer_id,
          stream_name,
          stream_type,
          is_active,
          livekit_track_sid,
          created_at,
          user_profiles!event_streams_streamer_id_fkey(display_name)
        `)
        .eq('event_id', eventId)
        .in('is_active', [true])
        .order('created_at', { ascending: true }),

      // Get latest scorecards
      supabase
        .from('event_scoreboard')
        .select('*')
        .eq('event_id', eventId)
        .order('updated_at', { ascending: false })
    ]);

    if (streamsResult.error) {
      console.error('Error fetching streams:', streamsResult.error);
    }

    if (scorecardsResult.error) {
      console.error('Error fetching scorecards:', scorecardsResult.error);
    }

    // Transform streams data
    const streams = (streamsResult.data || []).map((stream: any) => ({
      streamId: stream.id,
      streamerId: stream.streamer_id,
      title: stream.stream_name || `${stream.user_profiles?.display_name || 'Unknown'} Stream`,
      livekitRoom: `event-${eventId}`,
      livekitTrackIds: stream.livekit_track_sid ? [stream.livekit_track_sid] : [],
      status: stream.is_active ? 'live' : 'ended',
      startedAt: stream.created_at
    }));

    // Transform scorecards data
    const scorecards = (scorecardsResult.data || []).map((card: any) => ({
      cardId: card.id,
      division: card.scoreboard_type,
      heat: card.team_name,
      competitorId: card.team_name,
      fields: {
        teamName: card.team_name,
        teamColor: card.team_color,
        score: card.score,
        customFields: card.custom_fields || {}
      },
      lastUpdatedAt: card.updated_at
    }));

    const snapshot = {
      eventId,
      asOf: new Date().toISOString(),
      streams,
      scorecards
    };

    return NextResponse.json(snapshot, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error in event state API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}