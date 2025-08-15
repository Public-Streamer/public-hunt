/**
 * Utilities for generating shareable event URLs with social media previews
 */

import { supabase } from "@/integrations/supabase/client";

export function getShareableEventUrl(eventId: string, slug?: string): string {
  const functionsOrigin = "https://zmfugicftfwvuudensdo.supabase.co";
  const eventIdentifier = slug || eventId;
  // Return Edge Function URL for crawlers (serves meta tags) and redirects humans
  return `${functionsOrigin}/event-meta-tags/${eventIdentifier}`;
}

export function getDirectEventUrl(eventId: string, slug?: string): string {
  const baseUrl = window.location.origin;
  const eventIdentifier = slug || eventId;

  // Return direct event page URL (for internal navigation)
  return `${baseUrl}/event/${eventIdentifier}`;
}

export async function generateEventShareData(eventId: string) {
  try {
    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error || !event) {
      throw new Error("Event not found");
    }

    const shareUrl = getShareableEventUrl(eventId, event.slug);
    const directUrl = getDirectEventUrl(eventId, event.slug);

    return {
      shareUrl,
      directUrl,
      title: event.name,
      description:
        event.description ||
        `Join ${event.name} - Live streaming event on Public Streamer`,
      image:
        event?.media_urls?.[0] || `${window.location.origin}/placeholder.svg`,
    };
  } catch (error) {
    console.error("Error generating share data:", error);
    return null;
  }
}
