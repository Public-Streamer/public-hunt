import React, { useState, useEffect } from 'react';
import Hero from '@/components/Hero';
import SearchBar from '@/components/SearchBar';
import LiveEventSpotlight from '@/components/LiveEventSpotlight';
import TrendingChannels from '@/components/TrendingChannels';
import UpcomingEvents from '@/components/UpcomingEvents';
import LiveFeed from '@/components/LiveFeed';
import TrendingEpisodes from '@/components/TrendingEpisodes';
import EventGrid from '@/components/EventGrid';
import StageView from '@/components/StageView';
import LiveNewsFeed from '@/components/LiveNewsFeed';
import FeaturedAdsCarousel from '@/components/FeaturedAdsCarousel';
import TrendingAnalyticsPanel from '@/components/TrendingAnalyticsPanel';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const Index: React.FC = () => {
 

  // React Query for events
  const {
    data: events = [],
    isLoading: isEventsLoading,
    error: eventsError
  } = useQuery({
    queryKey: ['all-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`*, channels ( name, description )`)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message || 'Error fetching events');
      }

      return (
        data?.map(event => ({
          id: event.id,
          title: event.name,
          description: event.description || event.channels?.description || 'No description available',
          price: Number(event.ticket_price) || 0,
          date: event.date || new Date().toISOString().split('T')[0],
          time: event.time || '12:00 PM',
          duration: '2 hours',
          viewers: event.viewer_count || 0,
          streamerCount: 2,
          isLive: event.is_live || false,
          thumbnail: event.media_urls?.[0],
          slug: event.slug
        })) || []
      );
    }
  });

  // Realtime updates for events list
  const queryClient = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel('public:events-home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        queryClient.invalidateQueries({ queryKey: ['all-events'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  
// console.log(events);

  // if (currentView === 'stage' && selectedEvent) {
  //   const event = events.find(e => e.id === selectedEvent);
  //   return (
  //     <StageView 
  //       eventTitle={event?.title || 'Live Event'} 
  //       streams={mockStreams} 
  //     />
  //   );
  // }

  return (
    <div className="bg-white min-h-screen">
      {/* Search Bar at the top */}
      <div className="bg-muted/50 py-6">
        <div className="container mx-auto px-2">
          <SearchBar />
        </div>
      </div>

      {/* Hero Section - Preserved */}
      <Hero />

      {/* Live Event Spotlight - Top 3 trending live events */}
      <LiveEventSpotlight  />

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
                events={events}
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