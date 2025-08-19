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
import { useAppContext } from "@/contexts/AppContext";

const Index: React.FC = () => {
  // Comprehensive React Query for events with social data
  const { user } = useAppContext();
  const {
    data: eventsWithSocial = [],
    isLoading: isEventsLoading,
    error: eventsError,
  } = useQuery({
    queryKey: ["all-events-with-social", user?.id],
    queryFn: async () => {
      // Get all events with channel info
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select(`
          *,
          channels ( name, description )
        `)
        .order("created_at", { ascending: false });

      if (eventsError) {
        throw new Error(eventsError.message || "Error fetching events");
      }

      if (!events || events.length === 0) return [];

      const eventIds = events.map(e => e.id);

      // Get likes count and user's like status for all events
      const { data: likesData, error: likesError } = await supabase
        .from("event_likes")
        .select("event_id, user_id, display_name, created_at")
        .in("event_id", eventIds);

      // Get comments count for all events
      const { data: commentsData, error: commentsError } = await supabase
        .from("event_comments")
        .select("event_id, id")
        .in("event_id", eventIds)
        .is("parent_comment_id", null);

      if (likesError || commentsError) {
        console.warn("Error fetching social data:", likesError || commentsError);
      }

      // Process social data by event
      const socialDataByEvent = events.reduce((acc, event) => {
        const eventLikes = likesData?.filter(like => like.event_id === event.id) || [];
        const eventComments = commentsData?.filter(comment => comment.event_id === event.id) || [];
        const userHasLiked = user ? eventLikes.some(like => like.user_id === user.id) : false;
        const recentLikers = eventLikes
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 3)
          .map(like => like.display_name);

        acc[event.id] = {
          likes_count: eventLikes.length,
          comments_count: eventComments.length,
          user_has_liked: userHasLiked,
          recent_likers: recentLikers,
          all_likes: eventLikes
        };
        return acc;
      }, {} as Record<string, any>);

      return events.map((event) => ({
        // Event data
        id: event.id,
        title: event.name,
        description:
          event.description ||
          event.channels?.description ||
          "No description available",
        price: Number(event.ticket_price) || 0,
        date: event.date || new Date().toISOString().split("T")[0],
        time: event.time || "12:00 PM",
        duration: "2 hours",
        viewers: event.viewer_count || 0,
        streamerCount: 2,
        isLive: event.is_live || false,
        media_urls: event.media_urls,
        slug: event.slug,
        // Social data
        social: socialDataByEvent[event.id] || {
          likes_count: 0,
          comments_count: 0,
          user_has_liked: false,
          recent_likers: [],
          all_likes: []
        }
      }));
    },
  });

  // Realtime updates for events list
  const queryClient = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("public:events-home")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["all-events-with-social"] });
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
      <LiveEventSpotlight 
        liveEvents={eventsWithSocial.filter(event => event.isLive).slice(0, 6)} 
        isLoading={isEventsLoading}
        error={eventsError}
      />

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
              <EventGrid 
                events={eventsWithSocial} 
                onSocialUpdate={() => queryClient.invalidateQueries({ queryKey: ["all-events-with-social"] })}
              />
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
