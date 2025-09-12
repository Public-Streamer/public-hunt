import { supabaseBrowser } from '@/lib/supabase/browser';

interface ViewerCountUpdate {
  eventId: string;
  participantCount: number;
  streamerCount: number;
  timestamp: Date;
}

class ViewerCountService {
  private updateQueue: Map<string, ViewerCountUpdate> = new Map();
  private isProcessing = false;
  private batchInterval = 2000; // 2 seconds
  private batchTimer: NodeJS.Timeout | null = null;

  // Add an update to the queue
  public queueUpdate(eventId: string, participantCount: number, streamerCount = 0) {
    this.updateQueue.set(eventId, {
      eventId,
      participantCount,
      streamerCount,
      timestamp: new Date()
    });

    this.scheduleBatchProcess();
  }

  // Get current viewer count for an event
  public async getViewerCount(eventId: string): Promise<number> {
    try {
      const supabase = supabaseBrowser();
      
      const { data, error } = await supabase.rpc('get_event_viewer_count', {
        event_id_param: eventId
      });

      if (error) {
        console.error('Error fetching viewer count:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Failed to get viewer count:', error);
      return 0;
    }
  }

  // Update viewer count for multiple events in batch
  public async batchUpdateViewerCounts(updates: ViewerCountUpdate[]): Promise<void> {
    if (updates.length === 0) return;

    try {
      const supabase = supabaseBrowser();
      
      // Process updates in parallel
      const updatePromises = updates.map(async (update) => {
        const actualViewerCount = Math.max(0, update.participantCount - update.streamerCount);
        
        return supabase.rpc('update_event_viewer_count_filtered', {
          event_id_param: update.eventId,
          participant_count: update.participantCount,
          streamer_count: update.streamerCount
        });
      });

      const results = await Promise.allSettled(updatePromises);
      
      // Log any failures
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to update viewer count for event ${updates[index].eventId}:`, result.reason);
        } else if (result.value.error) {
          console.error(`Database error updating viewer count for event ${updates[index].eventId}:`, result.value.error);
        }
      });

      console.log(`✅ Batch updated viewer counts for ${updates.length} events`);
    } catch (error) {
      console.error('Failed to batch update viewer counts:', error);
    }
  }

  // Schedule batch processing
  private scheduleBatchProcess() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      this.processBatch();
    }, this.batchInterval);
  }

  // Process queued updates in batch
  private async processBatch() {
    if (this.isProcessing || this.updateQueue.size === 0) {
      return;
    }

    this.isProcessing = true;
    
    try {
      const updates = Array.from(this.updateQueue.values());
      this.updateQueue.clear();
      
      await this.batchUpdateViewerCounts(updates);
    } catch (error) {
      console.error('Error processing viewer count batch:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Force immediate processing of queued updates
  public async flushQueue(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    await this.processBatch();
  }

  // Clean up resources
  public destroy() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    this.updateQueue.clear();
  }
}

// Export singleton instance
export const viewerCountService = new ViewerCountService();

// Helper function to get accurate viewer count (participants - streamers/hosts)
export function calculateAccurateViewerCount(
  totalParticipants: number,
  activeStreamers: number = 0,
  hosts: number = 0
): number {
  // Subtract streamers and hosts from total participants to get actual viewers
  return Math.max(0, totalParticipants - activeStreamers - hosts);
}

// Helper function to get participant role counts from LiveKit room
export function analyzeParticipantRoles(participants: any[]): {
  viewers: number;
  streamers: number;
  hosts: number;
} {
  let viewers = 0;
  let streamers = 0;
  let hosts = 0;

  participants.forEach(participant => {
    const metadata = participant.metadata ? JSON.parse(participant.metadata) : {};
    const role = metadata.role || 'viewer';
    
    switch (role) {
      case 'host':
        hosts++;
        break;
      case 'streamer':
        streamers++;
        break;
      default:
        viewers++;
        break;
    }
  });

  return { viewers, streamers, hosts };
}