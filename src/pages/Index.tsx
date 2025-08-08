import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
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

const Index: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useAppContext();
  const [currentView, setCurrentView] = useState<'home' | 'stage'>('home');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select(`
            *,
            channels (
              name,
              description
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching events:', error);
          return;
        }

        const formattedEvents = data?.map(event => ({
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

        })) || [];

        setEvents(formattedEvents);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  

 
  // const handleWatch = (eventId: string) => {
  //   setSelectedEvent(eventId);
  //   setCurrentView('stage');
  // };

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
        <div className="container mx-auto px-4">
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
        <div className="container mx-auto px-4">
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