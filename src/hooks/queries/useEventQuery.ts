import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EventData {
  id: string;
  name: string;
  description: string | null;
  date: string | null;
  time: string | null;
  location: string | null;
  category: string | null;
  media_urls: string[] | null;
  ticket_price: number | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_live: boolean | null;
  livekit_room_name: string | null;
  viewer_count: number | null;
  max_participants: number | null;
  stream_quality: string | null;
  stream_url: string | null;
  channel_id: string | null;
}

export const useEventQuery = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ["event", eventId],
    queryFn: async (): Promise<EventData> => {
      if (!eventId) {
        throw new Error("Event ID is required");
      }

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch event: ${error.message}`);
      }

      return data;
    },
    enabled: !!eventId,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchInterval: 10000, // Refetch every 10 seconds to keep live status updated
  });
};