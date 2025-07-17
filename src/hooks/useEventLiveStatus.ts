import { useEffect, useRef } from "react";
import { TrackReference } from "@livekit/components-react";
import { useUpdateEventLiveStatus } from "./mutations/useUpdateEventLiveStatus";

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
  const updateLiveStatus = useUpdateEventLiveStatus();

  useEffect(() => {
    // Clear any existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounce the update to avoid too frequent database calls
    updateTimeoutRef.current = setTimeout(() => {
      const hasActiveCameras = !!(
        localCameraTrack || otherCameraTracks.length > 0
      );

      const shouldGoLive = goLive && hasActiveCameras && !currentIsLive;
      const shouldStopLive = !goLive && !hasActiveCameras && currentIsLive;

      // Add extra logging to debug the issue
      console.log("Live status check:", {
        goLive,
        hasActiveCameras,
        currentIsLive,
        shouldGoLive,
        shouldStopLive,
        localCameraTrack: !!localCameraTrack,
        otherCamerasCount: otherCameraTracks.length
      });

      // Only update if the status has changed and we have a clear decision
      if (shouldGoLive) {
        console.log("Setting event as live in database...");
        updateLiveStatus.mutate({ eventId, isLive: true });
      } else if (shouldStopLive) {
        console.log("Setting event as not live in database...");
        updateLiveStatus.mutate({ eventId, isLive: false });
      }
    }, 1000); // Increase debounce to 1 second

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
    updateLiveStatus,
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
