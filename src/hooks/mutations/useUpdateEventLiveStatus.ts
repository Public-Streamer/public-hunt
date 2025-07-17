import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EventData } from "../queries/useEventQuery";

interface UpdateLiveStatusParams {
  eventId: string;
  isLive: boolean;
}

export const useUpdateEventLiveStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, isLive }: UpdateLiveStatusParams) => {
      const { error } = await supabase
        .from("events")
        .update({ is_live: isLive })
        .eq("id", eventId);

      if (error) {
        throw new Error(`Failed to update live status: ${error.message}`);
      }

      return { eventId, isLive };
    },
    onMutate: async ({ eventId, isLive }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["event", eventId] });

      // Snapshot the previous value
      const previousEvent = queryClient.getQueryData<EventData>(["event", eventId]);

      // Optimistically update to the new value
      queryClient.setQueryData<EventData>(["event", eventId], (old) => {
        if (!old) return old;
        return { ...old, is_live: isLive };
      });

      // Return a context object with the snapshotted value
      return { previousEvent };
    },
    onError: (err, { eventId }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousEvent) {
        queryClient.setQueryData(["event", eventId], context.previousEvent);
      }
      console.error("Error updating live status:", err);
    },
    onSuccess: ({ eventId }) => {
      // Invalidate and refetch event data to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });
};