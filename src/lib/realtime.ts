import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface DeltaEvent {
  type: 'stream' | 'scorecard';
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
}

export interface RealtimeSubscription {
  dispose: () => void;
}

// Batching utility
class DeltaBatcher {
  private buffer: DeltaEvent[] = [];
  private timeoutId: NodeJS.Timeout | null = null;
  private callback: (deltas: DeltaEvent[]) => void;

  constructor(callback: (deltas: DeltaEvent[]) => void) {
    this.callback = callback;
  }

  add(delta: DeltaEvent) {
    this.buffer.push(delta);
    
    // Cancel existing timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Set new timeout for batch flush
    this.timeoutId = setTimeout(() => {
      this.flush();
    }, 50); // 50ms batch window
  }

  private flush() {
    if (this.buffer.length > 0) {
      const deltas = [...this.buffer];
      this.buffer = [];
      this.callback(deltas);
    }
    this.timeoutId = null;
  }

  destroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.buffer = [];
  }
}

export function subscribeEvent(
  eventId: string,
  onDelta: (deltas: DeltaEvent[]) => void
): RealtimeSubscription {
  const batcher = new DeltaBatcher(onDelta);
  let channel: RealtimeChannel | null = null;

  try {
    channel = supabase.channel(`event:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_streams',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          batcher.add({
            type: 'stream',
            operation: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            data: payload.new || payload.old
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_scoreboard',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          batcher.add({
            type: 'scorecard',
            operation: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            data: payload.new || payload.old
          });
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] Channel status for event ${eventId}:`, status);
      });

    return {
      dispose: async () => {
        console.log(`[Realtime] Disposing subscription for event ${eventId}`);
        batcher.destroy();
        if (channel) {
          try {
            await supabase.removeChannel(channel);
          } catch (error) {
            console.warn('[Realtime] Error removing channel:', error);
          }
          channel = null;
        }
      }
    };
  } catch (error) {
    console.error('[Realtime] Error setting up subscription:', error);
    batcher.destroy();
    
    return {
      dispose: () => {
        // Already cleaned up
      }
    };
  }
}

// Watchdog polling for fallback
export class WatchdogPoller {
  private intervalId: NodeJS.Timeout | null = null;
  private pollCount = 0;
  private maxPolls = 3; // Poll at 0s, 10s, 20s
  private stopped = false;

  constructor(
    private fetchState: () => Promise<void>,
    private onRealtimeConnected: () => void
  ) {}

  start() {
    if (this.stopped) return;

    this.poll();
    this.scheduleNext();
  }

  stop() {
    this.stopped = true;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  onRealtimeEvent() {
    // Stop polling once realtime is working
    this.onRealtimeConnected();
    this.stop();
  }

  private async poll() {
    if (this.stopped || this.pollCount >= this.maxPolls) {
      this.stop();
      return;
    }

    try {
      await this.fetchState();
      this.pollCount++;
    } catch (error) {
      console.error('[Watchdog] Poll failed:', error);
      this.pollCount++;
    }
  }

  private scheduleNext() {
    if (this.stopped || this.pollCount >= this.maxPolls) {
      return;
    }

    this.intervalId = setTimeout(() => {
      this.poll();
      this.scheduleNext();
    }, 10000); // 10 second intervals
  }
}