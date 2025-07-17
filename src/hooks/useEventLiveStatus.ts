import { useEffect, useRef } from "react";
import { TrackReference } from "@livekit/components-react";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

interface UseEventLiveStatusProps {
  eventId: string;
  localCameraTrack?: TrackReference;
  otherCameraTracks: TrackReference[];
  currentIsLive: boolean;
  goLive: boolean;
  userId?: string;
}

export const useEventLiveStatus = ({
  eventId,
  localCameraTrack,
  otherCameraTracks,
  currentIsLive,
  goLive,
  userId,
}: UseEventLiveStatusProps) => {
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  const queryClient = useQueryClient();

  // Check for active streams in database (excluding current user)
  const checkActiveStreams = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("event_streams")
        .select("id")
        .eq("event_id", eventId)
        .eq("is_active", true)
        .neq("streamer_id", userId || "");

      if (error) {
        console.error("Error checking active streams:", error);
        return false;
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      console.error("Failed to check active streams:", error);
      return false;
    }
  };

  useEffect(() => {
    // Clear any existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounce the update to avoid too frequent database calls
    updateTimeoutRef.current = setTimeout(async () => {
      try {
        const hasActiveCameras = !!(
          localCameraTrack || otherCameraTracks.length > 0
        );

        // Check database for other active streams instead of local tracks
        const isOthersLive = await checkActiveStreams();

        const shouldGoLive = goLive && hasActiveCameras && !currentIsLive;
        const shouldStopLive = !goLive && !isOthersLive && currentIsLive;

        console.log({
          hasActiveCameras,
          isOthersLive,
          currentIsLive,
          goLive,
          shouldGoLive,
          shouldStopLive,
        });
        // Only update if the status has changed
        if (shouldGoLive) {
          console.log("going live...");
          const { error } = await supabase
            .from("events")
            .update({ is_live: true })
            .eq("id", eventId);

          if (error) {
            console.error("Error updating event live status:", error);
          } else {
            // Update cache directly instead of invalidating to prevent reconnection
            queryClient.setQueryData(["event", eventId], (oldData: any) => {
              if (oldData) {
                return { ...oldData, is_live: true };
              }
              return oldData;
            });
            console.log(`Event ${eventId} live status updated to: true`);
          }
        } else if (shouldStopLive) {
          console.log("stopping live...");
          const { error } = await supabase
            .from("events")
            .update({ is_live: false })
            .eq("id", eventId);

          if (error) {
            console.error("Error updating event live status:", error);
          } else {
            console.log(`Event ${eventId} live status updated to: false`);
            // Update cache directly instead of invalidating to prevent reconnection
            queryClient.setQueryData(["event", eventId], (oldData: any) => {
              if (oldData) {
                return { ...oldData, is_live: false };
              }
              return oldData;
            });
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
  }, [
    eventId,
    localCameraTrack,
    otherCameraTracks.length,
    currentIsLive,
    goLive,
    queryClient,
    userId,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);
};
