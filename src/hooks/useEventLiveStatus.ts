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

      console.log({ goLive, hasActiveCameras, currentIsLive });
      const shouldGoLive = goLive && hasActiveCameras && !currentIsLive;
      const shouldStopLive = !goLive && !hasActiveCameras && currentIsLive;

      // Only update if the status has changed
      if (shouldGoLive) {
        console.log("going live...");
        updateLiveStatus.mutate({ eventId, isLive: true });
      } else if (shouldStopLive) {
        console.log("stopping live...");
        updateLiveStatus.mutate({ eventId, isLive: false });
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
