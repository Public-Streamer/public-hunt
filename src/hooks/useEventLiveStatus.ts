import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface UseEventLiveStatusProps {
  eventId: string;
  goLive: boolean;
}

export const useEventLiveStatus = ({
  eventId,
  goLive,
}: UseEventLiveStatusProps) => {
  const queryClient = useQueryClient();

  // Simple effect to invalidate query cache when go live status changes
  // The database triggers will handle all the complex logic
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Invalidate event query to refetch latest status
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [eventId, queryClient, goLive]);
};
