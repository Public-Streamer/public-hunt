import { useEffect, useRef } from "react";
import { TrackReference } from "@livekit/components-react";
import { supabase } from "@/lib/supabase";

interface UseEventLiveStatusProps {
  eventId: string;
  localCameraTrack?: TrackReference;
  otherCameraTracks: TrackReference[];
  currentIsLive: boolean;
  goLive: boolean;
}

export const useEventLiveStatus = ({
  eventId,
  localCameraTrack,
  otherCameraTracks,
  currentIsLive,
  goLive,
}: UseEventLiveStatusProps) => {
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear any existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounce the update to avoid too frequent database calls
    updateTimeoutRef.current = setTimeout(async () => {
      try {
        const hasActiveCameras = !!(localCameraTrack || otherCameraTracks.length > 0);
        const shouldGoLive = goLive && hasActiveCameras && !currentIsLive;
        
        // Only update if the status has changed
        if (shouldGoLive) {
          const { error } = await supabase
            .from("events")
            .update({ is_live: true })
            .eq("id", eventId);

          if (error) {
            console.error("Error updating event live status:", error);
          } else {
            console.log(`Event ${eventId} live status updated to: true`);
          }
        }
      } catch (error) {
        console.error("Failed to update event live status:", error);
      }
    }, 500); // 500ms debounce

    // Cleanup function
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [eventId, localCameraTrack, otherCameraTracks.length, currentIsLive, goLive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);
};