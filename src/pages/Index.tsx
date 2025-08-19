import React, { useState, useEffect } from "react";
import Hero from "@/components/Hero";
import EventSearchBox from "@/components/EventSearchBox";
import LiveEventSpotlight from "@/components/LiveEventSpotlight";
import TrendingChannels from "@/components/TrendingChannels";
import UpcomingEvents from "@/components/UpcomingEvents";
import LiveFeed from "@/components/LiveFeed";
import TrendingEpisodes from "@/components/TrendingEpisodes";
import EventGrid from "@/components/EventGrid";
import StageView from "@/components/StageView";
import LiveNewsFeed from "@/components/LiveNewsFeed";
import FeaturedAdsCarousel from "@/components/FeaturedAdsCarousel";
import TrendingAnalyticsPanel from "@/components/TrendingAnalyticsPanel";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const Index: React.FC = () => {
  // React Query for events with consolidated social data
  const {
    data: events = [],
    isLoading: isEventsLoading,
    error: eventsError,
  } = useQuery({
    queryKey: ["all-events-consolidated"],
    queryFn: async () => {
      // Get current user for personalized data
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      const { data, error } = await supabase.rpc('get_events_with_social_data', {
        user_id_param: userId
      });

      if (error) {
        console.error('RPC Error:', error);
        // Fallback to basic query if RPC fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("events")
          .select(`
            *, 
            channels ( name, description )
          `)
          .order("created_at", { ascending: false });

        if (fallbackError) {
          throw new Error(fallbackError.message || "Error fetching events");
        }

        return fallbackData?.map((event) => ({
          id: event.id,
          title: event.name,
          description: event.description || event.channels?.description || "No description available",
          price: Number(event.ticket_price) || 0,
          date: event.date || new Date().toISOString().split("T")[0],
          time: event.time || "12:00 PM",
          duration: "2 hours",
          viewers: event.viewer_count || 0,
          streamerCount: 2,
          isLive: event.is_live || false,
          media_urls: event.media_urls,
          slug: event.slug,
          // Default social data for fallback
          likes_count: 0,
          comments_count: 0,
          user_has_liked: false,
          user_has_ticket: false,
          recent_likers: []
        })) || [];
      }

      return data?.map((event: any) => ({
        id: event.id,
        title: event.name,
        description: event.description || event.channel_description || "No description available",
        price: Number(event.ticket_price) || 0,
        date: event.date || new Date().toISOString().split("T")[0],
        time: event.time || "12:00 PM",
        duration: "2 hours",
        viewers: event.viewer_count || 0,
        streamerCount: 2,
        isLive: event.is_live || false,
        media_urls: event.media_urls,
        slug: event.slug,
        // Social data from joins
        likes_count: event.likes_count || 0,
        comments_count: event.comments_count || 0,
        user_has_liked: event.user_has_liked || false,
        user_has_ticket: event.user_has_ticket || false,
        recent_likers: event.recent_likers || []
      })) || [];
    },
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  // Filter live events from the consolidated data
  const liveEvents = events.filter(event => event.isLive);

  // Realtime updates for events list
  const queryClient = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("public:events-home")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["all-events"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <div className="bg-white min-h-screen">
      {/* Search Bar at the top */}
      <div className="bg-muted/50 py-6">
        <div className="container mx-auto px-2">
          <EventSearchBox />
        </div>
      </div>

      {/* Hero Section - Preserved */}
      <Hero />

      {/* Live Event Spotlight - Top 3 trending live events */}
      <LiveEventSpotlight />

      {/* Trending Channels */}
      {/* <TrendingChannels /> */}

      {/* Upcoming Events */}
      {/* <UpcomingEvents /> */}

      {/* Live Feed - All live events sorted by popularity */}
      {/* <LiveFeed /> */}

      {/* Trending Episodes Carousel */}
      {/* <TrendingEpisodes /> */}

      {/* Original EventGrid and LiveNewsFeed in side layout */}
      <div className="py-8">
        <div className="container mx-auto px-2">
          <div className="">
            <div className="">
              {/* <h2 className="text-2xl font-bold mb-6">All Events</h2> */}
              <EventGrid events={events} />
            </div>
            {/* <div className="lg:col-span-1">
              <LiveNewsFeed />
            </div> */}
          </div>
        </div>
      </div>

      {/* Ad Data and Analytics - Moved to bottom (deprioritized) */}
      {/* <div className="bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-semibold mb-6 text-muted-foreground">Advertisement Performance</h2>
          <FeaturedAdsCarousel />
          <div className="mt-8">
            <TrendingAnalyticsPanel />
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default Index;
