import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EventData } from "./useEventQuery";

export const useEventLiveSubscription = (eventId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!eventId) return;

    // Subscribe to real-time changes for this specific event
    const channel = supabase
      .channel(`event-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`,
        },
        (payload) => {
          console.log('Event live status changed:', payload.new);
          
          // Update the React Query cache with the new data
          queryClient.setQueryData<EventData>(["event", eventId], (old) => {
            if (!old) return old;
            return { ...old, ...payload.new } as EventData;
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [eventId, queryClient]);
};