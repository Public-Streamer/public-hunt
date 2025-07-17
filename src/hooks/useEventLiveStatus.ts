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
  const queryClient = useQueryClient();

  // Simple effect to invalidate query cache when tracks change
  // The database triggers will handle all the complex logic
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Invalidate event query to refetch latest status
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [eventId, queryClient, goLive, localCameraTrack, otherCameraTracks.length]);
};
