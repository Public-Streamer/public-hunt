import { useState, useEffect, useRef } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { subscribeEvent, type DeltaEvent } from '@/lib/realtime';
import { mergeSnapshot, applyStreamDelta, type ViewerState } from '@/lib/viewerState';

interface UseRealtimeViewerCountOptions {
  eventId: string;
  participantCount?: number;
  streamerCount?: number;
  debounceMs?: number;
}

interface ViewerCountResult {
  viewerCount: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useRealtimeViewerCount({
  eventId,
  participantCount = 0,
  streamerCount = 0,
  debounceMs = 1000
}: UseRealtimeViewerCountOptions): ViewerCountResult {
  const [viewerCount, setViewerCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const subscriptionRef = useRef<{ dispose: () => void } | null>(null);
  const viewerStateRef = useRef<ViewerState | null>(null);

  // Function to update viewer count in database
  const updateViewerCountInDb = async (count: number) => {
    try {
      const supabase = supabaseBrowser();
      
      // Use our new database function for accurate updates
      const { error } = await supabase.rpc('update_event_viewer_count_filtered', {
        event_id_param: eventId,
        participant_count: participantCount,
        streamer_count: streamerCount
      });

      if (error) {
        console.error('Error updating viewer count in database:', error);
        setError(error.message);
      } else {
        console.log(`✅ Updated viewer count for event ${eventId}: ${count}`);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Failed to update viewer count:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Debounced update function
  const debouncedUpdate = (count: number) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      updateViewerCountInDb(count);
    }, debounceMs);
  };

  // Calculate viewer count from participant data
  const calculateViewerCount = (state: ViewerState | null): number => {
    if (!state) return Math.max(0, participantCount - streamerCount);
    
    // Get active streams count to determine streamers
    const activeStreams = Object.values(state.streams).filter(s => s.status === 'live');
    const activeStreamersCount = activeStreams.length;
    
    // Calculate viewers = total participants - active streamers
    return Math.max(0, participantCount - activeStreamersCount);
  };

  // Handle realtime deltas
  const handleDeltas = (deltas: DeltaEvent[]) => {
    try {
      let currentState = viewerStateRef.current;
      
      for (const delta of deltas) {
        if (delta.type === 'stream' && currentState) {
          currentState = applyStreamDelta(currentState, delta.data, delta.operation);
        }
      }
      
      if (currentState) {
        viewerStateRef.current = currentState;
        const newCount = calculateViewerCount(currentState);
        setViewerCount(newCount);
        debouncedUpdate(newCount);
      }
    } catch (err) {
      console.error('Error processing realtime deltas:', err);
      setError(err instanceof Error ? err.message : 'Delta processing error');
    }
  };

  // Initialize and fetch current state
  useEffect(() => {
    let mounted = true;
    
    const initializeViewerCount = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const supabase = supabaseBrowser();
        
        // Fetch current event state
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('viewer_count')
          .eq('id', eventId)
          .single();

        if (eventError) {
          throw eventError;
        }

        // Fetch current streams state
        const { data: streamsData, error: streamsError } = await supabase
          .from('event_streams')
          .select('*')
          .eq('event_id', eventId);

        if (streamsError) {
          throw streamsError;
        }

        if (!mounted) return;

        // Create initial state
        const initialState: ViewerState = {
          asOf: new Date().toISOString(),
          streams: {},
          scorecards: {}
        };

        // Convert streams to state format
        (streamsData || []).forEach(stream => {
          initialState.streams[stream.id] = {
            streamId: stream.id,
            streamerId: stream.streamer_id || '',
            title: stream.stream_name || `Stream ${stream.id.slice(0, 8)}`,
            livekitRoom: `event-${eventId}`,
            livekitTrackIds: stream.livekit_track_sid ? [stream.livekit_track_sid] : [],
            status: stream.is_active ? 'live' : 'ended',
            startedAt: stream.created_at
          };
        });

        viewerStateRef.current = initialState;
        
        // Calculate initial viewer count
        const initialCount = calculateViewerCount(initialState);
        setViewerCount(initialCount);
        
        // Subscribe to realtime updates
        const subscription = subscribeEvent(eventId, handleDeltas);
        subscriptionRef.current = subscription;

        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing viewer count:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Initialization error');
          setIsLoading(false);
        }
      }
    };

    initializeViewerCount();

    return () => {
      mounted = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (subscriptionRef.current) {
        subscriptionRef.current.dispose();
      }
    };
  }, [eventId]);

  // Update viewer count when participant counts change
  useEffect(() => {
    const newCount = calculateViewerCount(viewerStateRef.current);
    if (newCount !== viewerCount) {
      setViewerCount(newCount);
      debouncedUpdate(newCount);
    }
  }, [participantCount, streamerCount]);

  return {
    viewerCount,
    isLoading,
    error,
    lastUpdated
  };
}