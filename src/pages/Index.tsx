import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import Hero from '@/components/Hero';
import EventGrid from '@/components/EventGrid';
import StageView from '@/components/StageView';
import LiveNewsFeed from '@/components/LiveNewsFeed';

const Index: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useAppContext();
  const [currentView, setCurrentView] = useState<'home' | 'stage'>('home');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  // Mock data for demonstration
  const mockEvents = [
    {
      id: '1',
      title: 'Concert in the Park',
      description: 'Live music performance with multiple camera angles',
      price: 15,
      date: '2024-01-20',
      time: '8:00 PM',
      duration: '2 hours',
      viewers: 1234,
      streamerCount: 4,
      isLive: true,
      thumbnail: ''
    },
    {
      id: '2',
      title: 'Cooking Masterclass',
      description: 'Professional chef cooking demonstration',
      price: 25,
      date: '2024-01-21',
      time: '2:00 PM',
      duration: '1.5 hours',
      viewers: 567,
      streamerCount: 3,
      isLive: false,
      thumbnail: ''
    },
    {
      id: '3',
      title: 'Sports Tournament',
      description: 'Live sports event with commentary',
      price: 20,
      date: '2024-01-22',
      time: '6:00 PM',
      duration: '3 hours',
      viewers: 2345,
      streamerCount: 6,
      isLive: true,
      thumbnail: ''
    }
  ];

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
    const event = mockEvents.find(e => e.id === selectedEvent);
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
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <EventGrid 
              events={mockEvents}
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