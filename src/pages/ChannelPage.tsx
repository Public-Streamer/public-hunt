import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, History, Users, Star, Eye } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import EventRankingControls, {
  SortOption,
} from '@/components/EventRankingControls';
import ScheduledEventsGrid from '@/components/ScheduledEventsGrid';
import ChannelPastEventsGrid from '@/components/ChannelPastEventsGrid';
import SocialMediaSection from '@/components/SocialMediaSection';
import SocialShareMenu from '@/components/SocialShareMenu';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import { supabase } from '@/lib/supabase';

interface Channel {
  id: string;
  name: string;
  description: string;
  user_id: string;
  category: string;
  media_urls: string[];
  created_at: string;
  updated_at: string;
  owner_first_name: string;
  owner_last_name: string;
  owner_email: string;
}

const ChannelPage: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('most-live-viewers');
  const [scheduledSortBy, setScheduledSortBy] = useState<SortOption>('newest');
  const [pastSortBy, setPastSortBy] = useState<SortOption>('most-views');
  const [activeTab, setActiveTab] = useState('live');
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState(0);
  const [views, setViews] = useState(0);
  const [rating, setRating] = useState(0);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (channelId) {
      fetchChannelData();
    }
  }, [channelId]);

  const fetchChannelData = async () => {
    try {
      const { data: channelData, error } = await supabase
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .single();

      if (error) {
        console.error('Error fetching channel:', error);
        return;
      }

      setChannel(channelData);
      setSubscribers(Math.floor(Math.random() * 50000) + 1000);
      setViews(Math.floor(Math.random() * 500000) + 5000);
      setRating(Math.random() * 2 + 3);
      setIsLive(Math.random() < 0.3);
    } catch (error) {
      console.error('Error fetching channel data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading channel...</div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Channel Not Found</h2>
        <p className="text-gray-600">
          The channel you're looking for doesn't exist.
        </p>
      </div>
    );
  }

  const channelUrl = `${window.location.origin}/channel/${channelId}`;

  // Generate mock live events for this channel
  const liveEvents = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    title: `Live Event ${i + 1}`,
    channelName: channel.name,
    views: Math.floor(Math.random() * 25000) + 100,
    liveViews: Math.floor(Math.random() * 5000) + 10,
    rating: (Math.random() * 2 + 3).toFixed(1),
    isLive: true,
    price: Math.floor(Math.random() * 25) + 5,
    ticketRevenue: Math.floor(Math.random() * 50000) + 1000,
    participants: [`User${i}`, `Participant${i + 1}`],
    description: `Description for event ${i + 1}`,
  }));

  // Generate mock scheduled events for this channel
  const scheduledEvents = Array.from({ length: 8 }, (_, i) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30) + 1);
    startDate.setHours(
      Math.floor(Math.random() * 24),
      Math.floor(Math.random() * 60)
    );

    return {
      id: `${i + 100}`,
      title: `Scheduled Event ${i + 1}`,
      channelName: channel.name,
      startDate: startDate.toLocaleDateString(),
      startTime: startDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      startDateTime: startDate,
      timeUntilStart: `${Math.floor(Math.random() * 30) + 1} days`,
      views: Math.floor(Math.random() * 15000) + 500,
      rating: (Math.random() * 2 + 3).toFixed(1),
      price: Math.floor(Math.random() * 30) + 10,
      ticketRevenue: Math.floor(Math.random() * 30000) + 2000,
      participants: [`User${i + 100}`, `Participant${i + 101}`],
      description: `Upcoming event ${i + 1} description`,
    };
  }).sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());

  // Generate mock past events for this channel
  const pastEvents = Array.from({ length: 15 }, (_, i) => {
    const recordedDate = new Date();
    recordedDate.setDate(
      recordedDate.getDate() - Math.floor(Math.random() * 365)
    );

    const visibilityOptions = ['public', 'private', 'selected'];
    const visibility =
      visibilityOptions[Math.floor(Math.random() * visibilityOptions.length)];

    return {
      id: i + 200,
      title: `Past Event ${i + 1}`,
      channelName: channel.name,
      description: `Recorded event ${i + 1} from ${channel.name}`,
      duration: `${Math.floor(Math.random() * 3) + 1}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      views: Math.floor(Math.random() * 100000) + 1000,
      rating: Math.random() * 2 + 3,
      price: Math.floor(Math.random() * 50) + 5,
      revenue: Math.floor(Math.random() * 100000) + 5000,
      recordedDate: recordedDate.toISOString(),
      visibility: visibility as 'public' | 'private' | 'selected',
      thumbnail: '/placeholder.svg',
      participants: [`User${i + 200}`, `Participant${i + 201}`],
    };
  });

  const sortEvents = (events: any[], sortOption: SortOption) => {
    return [...events].sort((a, b) => {
      switch (sortOption) {
        case 'most-views':
          return b.views - a.views;
        case 'least-views':
          return a.views - b.views;
        case 'most-revenue':
          return b.ticketRevenue - a.ticketRevenue;
        case 'least-revenue':
          return a.ticketRevenue - b.ticketRevenue;
        case 'most-live-viewers':
          return (b.liveViews || 0) - (a.liveViews || 0);
        case 'least-live-viewers':
          return (a.liveViews || 0) - (b.liveViews || 0);
        case 'most-popular':
          return (
            b.views * parseFloat(b.rating) - a.views * parseFloat(a.rating)
          );
        case 'least-popular':
          return (
            a.views * parseFloat(a.rating) - b.views * parseFloat(b.rating)
          );
        default:
          return b.liveViews - a.liveViews;
      }
    });
  };

  const filterEvents = (events: any[]) => {
    return events.filter((event) => {
      const matchesKeyword =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMember =
        memberSearch === '' ||
        event.participants?.some((participant: string) =>
          participant.toLowerCase().includes(memberSearch.toLowerCase())
        );

      return matchesKeyword && matchesMember;
    });
  };

  const filteredLiveEvents = sortEvents(filterEvents(liveEvents), sortBy);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Channel Header */}
      <div className="mb-8">
        {/* Channel Thumbnail */}
        {channel.media_urls && channel.media_urls.length > 0 && (
          <div className="mb-6 relative">
            <img
              src={channel.media_urls[0]}
              alt={`${channel.name} thumbnail`}
              className="w-full h-64 object-cover rounded-lg shadow-md"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg flex items-end">
              <div className="p-6 text-white">
                <h1 className="text-4xl font-bold mb-2">{channel.name}</h1>
                <p className="text-lg opacity-90">{channel.description}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">{channel.name}</h1>
          {isLive && <Badge className="bg-red-500">LIVE</Badge>}
        </div>
        <p className="text-gray-600 mb-4">{channel.description}</p>

        {/* Channel Creator Info */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Created by:</strong> {channel.owner_first_name}{' '}
            {channel.owner_last_name}
          </p>
          <p className="text-sm text-gray-700">
            <strong>Category:</strong> {channel.category}
          </p>
          <p className="text-sm text-gray-700">
            <strong>Created:</strong>{' '}
            {new Date(channel.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center space-x-6 text-sm text-gray-500">
          <span className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            {subscribers.toLocaleString()} subscribers
          </span>
          <span className="flex items-center">
            <Star className="h-4 w-4 mr-1" />
            {rating.toFixed(1)}
          </span>
          <span>{views.toLocaleString()} total views</span>
        </div>
      </div>

      {/* Social Media Section */}
      <div className="mb-8">
        <SocialMediaSection channelId={channelId} type="channel" />
      </div>

      {/* Events Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="live">Live Events</TabsTrigger>
          <TabsTrigger value="scheduled">
            <Clock className="h-4 w-4 mr-2" />
            Scheduled Events
          </TabsTrigger>
          <TabsTrigger value="past">
            <History className="h-4 w-4 mr-2" />
            Past Events
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-6">
          <EventRankingControls
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortBy={sortBy}
            onSortChange={setSortBy}
            memberSearch={memberSearch}
            onMemberSearchChange={setMemberSearch}
            activeTab={activeTab}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLiveEvents.map((event) => (
              <TooltipWrapper
                key={event.id}
                content={`View ${event.title} - ${event.liveViews} live viewers`}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      <Badge className="bg-red-500">LIVE</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                      <span className="font-semibold">${event.price}</span>
                      <span className="flex items-center">
                        <Star className="h-4 w-4 mr-1" />
                        {event.rating}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {event.liveViews} live
                      </span>
                      <span>{event.views.toLocaleString()} total views</span>
                    </div>
                    <div className="mt-3">
                      <SocialMediaSection
                        eventId={event.id.toString()}
                        type="event"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TooltipWrapper>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <EventRankingControls
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortBy={scheduledSortBy}
            onSortChange={setScheduledSortBy}
            memberSearch={memberSearch}
            onMemberSearchChange={setMemberSearch}
            activeTab={activeTab}
          />

          <ScheduledEventsGrid
            events={scheduledEvents}
            searchTerm={searchTerm}
            memberSearch={memberSearch}
            sortBy={scheduledSortBy}
          />
        </TabsContent>

        <TabsContent value="past" className="space-y-6">
          <EventRankingControls
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortBy={pastSortBy}
            onSortChange={setPastSortBy}
            memberSearch={memberSearch}
            onMemberSearchChange={setMemberSearch}
            activeTab={activeTab}
          />

          <ChannelPastEventsGrid
            events={pastEvents}
            searchTerm={searchTerm}
            memberSearch={memberSearch}
            sortBy={pastSortBy}
          />
        </TabsContent>
      </Tabs>

      {/* Social Share Menu */}
      <div className="mt-8">
        <SocialShareMenu
          title={channel.name}
          url={channelUrl}
          description={channel.description}
        />
      </div>
    </div>
  );
};

export default ChannelPage;
