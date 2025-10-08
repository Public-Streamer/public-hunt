import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface AdImpressionTrackingState {
  sessionId: string | null;
  startTime: number | null;
  twoSecondReached: boolean;
  lastHeartbeat: number;
}

export const useAdImpressionTracking = (adId: string, eventId: string | null) => {
  const [state, setState] = useState<AdImpressionTrackingState>({
    sessionId: null,
    startTime: null,
    twoSecondReached: false,
    lastHeartbeat: 0,
  });

  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  // Start tracking a new ad impression
  const startTracking = useCallback(() => {
    const sessionId = uuidv4();
    const startTime = Date.now();

    setState({
      sessionId,
      startTime,
      twoSecondReached: false,
      lastHeartbeat: startTime,
    });

    console.log('Ad impression tracking started:', { sessionId, adId, eventId });

    // Start heartbeat interval (every 5 seconds)
    heartbeatInterval.current = setInterval(() => {
      const currentTime = Date.now();
      const duration = Math.floor((currentTime - startTime) / 1000);
      
      // Send heartbeat
      supabase.functions.invoke('record-ad-impression', {
        body: {
          sessionId,
          adId,
          eventId: eventId ?? null,
          duration,
          isHeartbeat: true,
        },
      }).then(({ error }) => {
        if (error) {
          console.error('Heartbeat error:', error);
        }
      });

      setState(prev => ({ ...prev, lastHeartbeat: currentTime }));
    }, 5000);

    return sessionId;
  }, [adId, eventId]);

  // Mark 2-second threshold reached
  const markTwoSecondThreshold = useCallback(async () => {
    if (!state.sessionId || state.twoSecondReached) return;

    console.log('2-second threshold reached for session:', state.sessionId);

    const { error } = await supabase.functions.invoke('record-ad-impression', {
      body: {
        sessionId: state.sessionId,
        adId,
        eventId: eventId ?? null,
        duration: 2,
        twoSecondThreshold: true,
      },
    });

    if (error) {
      console.error('Error marking 2-second threshold:', error);
    } else {
      setState(prev => ({ ...prev, twoSecondReached: true }));
    }
  }, [state.sessionId, state.twoSecondReached, adId, eventId]);

  // Update duration (called by heartbeat)
  const updateDuration = useCallback(async (currentSeconds: number) => {
    if (!state.sessionId) return;

    const { error } = await supabase.functions.invoke('record-ad-impression', {
      body: {
        sessionId: state.sessionId,
        adId,
        eventId: eventId ?? null,
        duration: Math.floor(currentSeconds),
        isHeartbeat: true,
      },
    });

    if (error) {
      console.error('Error updating duration:', error);
    }
  }, [state.sessionId, adId, eventId]);

  // Record skip event
  const recordSkip = useCallback(async (currentSeconds: number) => {
    if (!state.sessionId) return;

    console.log('Ad skipped at:', currentSeconds);

    const { error } = await supabase.functions.invoke('record-ad-impression', {
      body: {
        sessionId: state.sessionId,
        adId,
        eventId: eventId ?? null,
        duration: Math.floor(currentSeconds),
        skipClicked: true,
        isFinal: true,
      },
    });

    if (error) {
      console.error('Error recording skip:', error);
    }

    // Cleanup
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
  }, [state.sessionId, adId, eventId]);

  // Complete tracking (ad finished)
  const completeTracking = useCallback(async (finalDuration: number) => {
    if (!state.sessionId) return;

    console.log('Ad completed, final duration:', finalDuration);

    const { error } = await supabase.functions.invoke('record-ad-impression', {
      body: {
        sessionId: state.sessionId,
        adId,
        eventId: eventId ?? null,
        duration: Math.floor(finalDuration),
        isFinal: true,
      },
    });

    if (error) {
      console.error('Error completing tracking:', error);
    }

    // Cleanup
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
  }, [state.sessionId, adId, eventId]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
  }, []);

  return {
    sessionId: state.sessionId,
    startTracking,
    markTwoSecondThreshold,
    updateDuration,
    recordSkip,
    completeTracking,
    cleanup,
  };
};
