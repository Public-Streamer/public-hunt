import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import Hero from '@/components/Hero';
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
          thumbnail: event.media_urls?.[0] || ''
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

  const mockStreams = [
    {
      id: '1',
      title: 'Main Stage',
      streamer: 'Camera 1',
      viewers: 456,
      isLive: true,
      thumbnail: ''
    },
    {
      id: '2',
      title: 'Audience View',
      streamer: 'Camera 2',
      viewers: 234,
      isLive: true,
      thumbnail: ''
    },
    {
      id: '3',
      title: 'Backstage',
      streamer: 'Camera 3',
      viewers: 123,
      isLive: true,
      thumbnail: ''
    }
  ];

  const handlePurchase = (eventId: string) => {
    alert(`Purchasing ticket for event ${eventId}`);
  };

  const handleWatch = (eventId: string) => {
    setSelectedEvent(eventId);
    setCurrentView('stage');
  };

  if (currentView === 'stage' && selectedEvent) {
    const event = events.find(e => e.id === selectedEvent);
    return (
      <StageView 
        eventTitle={event?.title || 'Live Event'} 
        streams={mockStreams} 
      />
    );
  }

  return (
    <div className="bg-white">
      <Hero />
      <FeaturedAdsCarousel />
      <TrendingAnalyticsPanel />
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <EventGrid 
              events={events}
              onPurchase={handlePurchase}
              onWatch={handleWatch}
            />
          </div>
          <div className="lg:col-span-1">
            <LiveNewsFeed />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;