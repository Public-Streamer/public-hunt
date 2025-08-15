'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { StreamsGrid } from '@/components/Viewer/StreamsGrid';
import { ScorecardsPanel } from '@/components/Viewer/ScorecardsPanel';
import { subscribeEvent, WatchdogPoller } from '@/lib/realtime';
import type { DeltaEvent, RealtimeSubscription } from '@/lib/realtime';
import {
  mergeSnapshot,
  applyStreamDelta,
  applyScorecardDelta,
  getStreamsArray,
  getScorecardsArray,
  type Snapshot,
  type ViewerState
} from '@/lib/viewerState';
import { supabase } from '@/integrations/supabase/client';

interface ViewerClientProps {
  eventId: string;
  initialState: Snapshot;
}

export default function ViewerClient({ eventId, initialState }: ViewerClientProps) {
  const [state, setState] = useState<ViewerState>(() => 
    mergeSnapshot(null, initialState)
  );
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);
  const watchdogRef = useRef<WatchdogPoller | null>(null);
  const mountedRef = useRef(true);
  const isReinitializingRef = useRef(false);

  // Fetch fresh state from API
  const fetchState = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session');
      }

      const response = await fetch(`/api/events/${eventId}/state`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Cache-Control': 'no-store'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const snapshot: Snapshot = await response.json();
      
      if (mountedRef.current) {
        setState(prev => mergeSnapshot(prev, snapshot));
      }
    } catch (error) {
      console.error('[ViewerClient] Failed to fetch state:', error);
      
      if (mountedRef.current) {
        toast.error('Failed to update event data', {
          description: 'Using cached data. Will retry automatically.'
        });
      }
    }
  }, [eventId]);

  // Handle batched realtime deltas
  const handleDeltas = useCallback((deltas: DeltaEvent[]) => {
    if (!mountedRef.current) return;

    setState(prevState => {
      let newState = prevState;
      
      for (const delta of deltas) {
        try {
          if (delta.type === 'stream') {
            newState = applyStreamDelta(newState, delta.data, delta.operation);
          } else if (delta.type === 'scorecard') {
            newState = applyScorecardDelta(newState, delta.data, delta.operation);
          }
        } catch (error) {
          console.error('[ViewerClient] Error applying delta:', error, delta);
        }
      }
      
      return newState;
    });

    // Mark realtime as connected on first delta
    if (!isConnected) {
      setIsConnected(true);
      setIsReconnecting(false);
      
      // Stop watchdog polling
      if (watchdogRef.current) {
        watchdogRef.current.onRealtimeEvent();
      }
    }
  }, [isConnected]);

  // Reinitialize function for focus/visibility events
  const reinitialize = useCallback(async () => {
    if (isReinitializingRef.current || !mountedRef.current) return;
    
    isReinitializingRef.current = true;
    setIsReconnecting(true);
    setIsConnected(false);

    try {
      // Cancel existing subscriptions
      if (subscriptionRef.current) {
        subscriptionRef.current.dispose();
        subscriptionRef.current = null;
      }
      
      if (watchdogRef.current) {
        watchdogRef.current.stop();
        watchdogRef.current = null;
      }

      // Fresh fetch
      await fetchState();

      if (!mountedRef.current) return;

      // Restart realtime
      const subscription = subscribeEvent(eventId, handleDeltas);
      subscriptionRef.current = subscription;

      // Restart watchdog
      const watchdog = new WatchdogPoller(
        fetchState,
        () => {
          if (mountedRef.current) {
            setIsConnected(true);
            setIsReconnecting(false);
          }
        }
      );
      watchdogRef.current = watchdog;
      watchdog.start();

    } catch (error) {
      console.error('[ViewerClient] Reinitialize failed:', error);
    } finally {
      isReinitializingRef.current = false;
    }
  }, [eventId, fetchState, handleDeltas]);

  // Setup realtime and watchdog on mount
  useEffect(() => {
    let mounted = true;

    const initRealtime = async () => {
      // Do immediate fresh fetch
      await fetchState();

      if (!mounted) return;

      // Setup realtime subscription
      const subscription = subscribeEvent(eventId, handleDeltas);
      subscriptionRef.current = subscription;

      // Setup watchdog for first 30 seconds
      const watchdog = new WatchdogPoller(
        fetchState,
        () => {
          if (mounted) {
            setIsConnected(true);
            setIsReconnecting(false);
          }
        }
      );
      watchdogRef.current = watchdog;
      watchdog.start();

      // Set reconnecting state after brief delay if no realtime events
      setTimeout(() => {
        if (mounted && !isConnected) {
          setIsReconnecting(true);
        }
      }, 2000);
    };

    initRealtime();

    return () => {
      mounted = false;
      mountedRef.current = false;
      
      if (subscriptionRef.current) {
        subscriptionRef.current.dispose();
        subscriptionRef.current = null;
      }
      
      if (watchdogRef.current) {
        watchdogRef.current.stop();
        watchdogRef.current = null;
      }
    };
  }, [eventId, handleDeltas, fetchState, isConnected]);

  // Handle visibility and focus events for re-entry
  useEffect(() => {
    const onFocus = () => {
      if (mountedRef.current && !isReinitializingRef.current) {
        reinitialize();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mountedRef.current && !isReinitializingRef.current) {
        reinitialize();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [reinitialize]);

  // Handle connection status changes
  useEffect(() => {
    const handleOnline = () => {
      if (mountedRef.current && !isConnected && !isReinitializingRef.current) {
        reinitialize();
      }
    };

    const handleOffline = () => {
      if (mountedRef.current) {
        setIsConnected(false);
        toast.info('Connection lost', {
          description: 'Showing cached data. Will reconnect automatically.'
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [reinitialize, isConnected]);

  const streams = getStreamsArray(state);
  const scorecards = getScorecardsArray(state);
  const hasLiveStreams = streams.length > 0;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Status Bar */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : isReconnecting ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span>
              {isConnected ? 'Live' : isReconnecting ? 'Reconnecting...' : 'Offline'}
            </span>
          </div>
          <span>Last updated {new Date(state.asOf).toLocaleTimeString()}</span>
        </div>
        
        {hasLiveStreams && (
          <span>{streams.length} live stream{streams.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Streams Section */}
        <div className="lg:col-span-2">
          <StreamsGrid 
            streams={streams}
            eventId={eventId}
            hasLiveStreams={hasLiveStreams}
          />
        </div>

        {/* Scorecards Section */}
        <div className="lg:col-span-1">
          <ScorecardsPanel 
            scorecards={scorecards}
            eventId={eventId}
          />
        </div>
      </div>

      {/* Mobile-first responsive adjustments */}
      <style jsx>{`
        @media (max-width: 1024px) {
          .container {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }
      `}</style>
    </div>
  );
}