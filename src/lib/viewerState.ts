// Pure state management utilities for viewer page

export interface Stream {
  streamId: string;
  streamerId: string;
  title: string;
  livekitRoom: string;
  livekitTrackIds?: string[];
  status: 'live' | 'paused' | 'ended';
  startedAt?: string;
}

export interface Scorecard {
  cardId: string;
  division?: string;
  heat?: string;
  competitorId?: string;
  fields: Record<string, string | number | null>;
  lastUpdatedAt: string;
}

export interface Snapshot {
  eventId: string;
  asOf: string;
  streams: Stream[];
  scorecards: Scorecard[];
}

export interface ViewerState {
  asOf: string;
  streams: Record<string, Stream>;
  scorecards: Record<string, Scorecard>;
}

// Pure function to merge snapshot into state
export function mergeSnapshot(prev: ViewerState | null, snap: Snapshot): ViewerState {
  const streams: Record<string, Stream> = {};
  const scorecards: Record<string, Scorecard> = {};

  // Convert arrays to records for O(1) lookups
  snap.streams.forEach(stream => {
    streams[stream.streamId] = stream;
  });

  snap.scorecards.forEach(card => {
    scorecards[card.cardId] = card;
  });

  return {
    asOf: snap.asOf,
    streams,
    scorecards
  };
}

// Pure function to apply stream delta
export function applyStreamDelta(
  prev: ViewerState,
  row: any,
  op: 'INSERT' | 'UPDATE' | 'DELETE'
): ViewerState {
  const newStreams = { ...prev.streams };

  if (op === 'DELETE') {
    delete newStreams[row.id];
  } else {
    // INSERT or UPDATE
    const stream: Stream = {
      streamId: row.id,
      streamerId: row.streamer_id,
      title: row.stream_name || `Stream ${row.id.slice(0, 8)}`,
      livekitRoom: `event-${row.event_id}`,
      livekitTrackIds: row.livekit_track_sid ? [row.livekit_track_sid] : [],
      status: row.is_active ? 'live' : 'ended',
      startedAt: row.created_at
    };
    newStreams[row.id] = stream;
  }

  return {
    ...prev,
    streams: newStreams,
    asOf: new Date().toISOString()
  };
}

// Pure function to apply scorecard delta
export function applyScorecardDelta(
  prev: ViewerState,
  row: any,
  op: 'INSERT' | 'UPDATE' | 'DELETE'
): ViewerState {
  const newScorecards = { ...prev.scorecards };

  if (op === 'DELETE') {
    delete newScorecards[row.id];
  } else {
    // INSERT or UPDATE
    const scorecard: Scorecard = {
      cardId: row.id,
      division: row.scoreboard_type,
      heat: row.team_name,
      competitorId: row.team_name,
      fields: {
        teamName: row.team_name,
        teamColor: row.team_color,
        score: row.score,
        customFields: row.custom_fields || {}
      },
      lastUpdatedAt: row.updated_at
    };
    newScorecards[row.id] = scorecard;
  }

  return {
    ...prev,
    scorecards: newScorecards,
    asOf: new Date().toISOString()
  };
}

// Helper to get streams as array
export function getStreamsArray(state: ViewerState): Stream[] {
  return Object.values(state.streams).filter(stream => stream.status === 'live');
}

// Helper to get scorecards as array
export function getScorecardsArray(state: ViewerState): Scorecard[] {
  return Object.values(state.scorecards);
}