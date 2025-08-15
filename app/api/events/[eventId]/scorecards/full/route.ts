import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { FullScorecardDTO } from '@/lib/types';
import { resolveMediaUrls } from '@/lib/storageUrls';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    // Check access: valid ticket OR event staff
    const [ticketResult, eventResult, participantResult] = await Promise.all([
      // Check for paid ticket
      supabase
        .from('tickets')
        .select('status')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .in('status', ['paid', 'granted', 'active'])
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

    // Query latest scorecards with all fields
    const { data: scorecards, error: scorecardsError } = await supabase
      .from('event_scoreboard')
      .select(`
        id,
        event_id,
        team_name,
        team_color,
        score,
        custom_fields,
        updated_at,
        created_by
      `)
      .eq('event_id', eventId)
      .order('updated_at', { ascending: false });

    if (scorecardsError) {
      console.error('Error fetching scorecards:', scorecardsError);
      return NextResponse.json({ error: 'Failed to fetch scorecards' }, { status: 500 });
    }

    // Transform to FullScorecardDTO with media URL resolution
    const scorecardsWithUrls = await resolveMediaUrls(scorecards || []);
    
    const fullScorecards: FullScorecardDTO[] = scorecardsWithUrls.map((card) => {
      const customFields = card.custom_fields || {};
      
      return {
        cardId: card.id,
        eventId: card.event_id,
        teamName: card.team_name || 'Unknown Team',
        dogName: customFields.dog_name || '',
        handlerName: customFields.handler_name || '',
        city: customFields.city || '',
        state: customFields.state || '',
        breed: customFields.breed || '',
        age: customFields.age ? parseInt(customFields.age) : null,
        
        strike: {
          value: customFields.strikes ? parseInt(customFields.strikes) : null,
          status: customFields.strike_status || null
        },
        tree: {
          value: customFields.trees ? parseInt(customFields.trees) : null,
          status: customFields.tree_status || null
        },
        
        judgesNotes: customFields.judge_notes || null,
        
        pedigreeImageUrl: card.pedigreeImageUrl || null,
        photoImageUrl: card.photoImageUrl || null,
        
        updatedAt: card.updated_at
      };
    });

    return NextResponse.json(fullScorecards, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error in full scorecards API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}