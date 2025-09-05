import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import Header from './Header';
import Hero from './Hero';
import EventGrid from './EventGrid';
import StageView from './StageView';

const AppLayout: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useAppContext();
  const isMobile = useIsMobile();
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
      media_urls: [],
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
      media_urls: [],
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
      media_urls: [],
    },
  ];

  const mockStreams = [
    {
      id: '1',
      title: 'Main Stage',
      streamer: 'Camera 1',
      viewers: 456,
      isLive: true,
      thumbnail: '',
    },
    {
      id: '2',
      title: 'Audience View',
      streamer: 'Camera 2',
      viewers: 234,
      isLive: true,
      thumbnail: '',
    },
    {
      id: '3',
      title: 'Backstage',
      streamer: 'Camera 3',
      viewers: 123,
      isLive: true,
      thumbnail: '',
    },
  ];

  const handlePurchase = (eventId: string) => {
    alert(`Purchasing ticket for event ${eventId}`);
  };

  const handleWatch = (eventId: string) => {
    setSelectedEvent(eventId);
    setCurrentView('stage');
  };

  const handleGetStarted = () => {
    alert('Get Started clicked - would show signup/login modal');
  };

  const handleLogin = () => {
    alert('Login clicked - would show login modal');
  };

  if (currentView === 'stage' && selectedEvent) {
    const event = mockEvents.find((e) => e.id === selectedEvent);
    return (
      <div className="min-h-screen">
        <Header onLoginClick={handleLogin} />
        <StageView
          eventTitle={event?.title || 'Live Event'}
          streams={mockStreams}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header onLoginClick={handleLogin} />
      <Hero onGetStarted={handleGetStarted} />
      <EventGrid
        events={mockEvents}
        // Removed onPurchase and onWatch props to match updated EventGrid API
      />
    </div>
  );
};

export default AppLayout;
