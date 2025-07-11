import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Star } from 'lucide-react';

const Browse: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();
  
  // Generate 100 channels with 1-50 events each, 5% live
  const channels = Array.from({ length: 100 }, (_, i) => {
    const eventCount = Math.floor(Math.random() * 50) + 1;
    return {
      id: i + 1,
      name: `Channel ${i + 1}`,
      description: `Premium content from Channel ${i + 1}`,
      subscribers: Math.floor(Math.random() * 50000) + 1000,
      views: Math.floor(Math.random() * 500000) + 5000,
      rating: (Math.random() * 2 + 3).toFixed(1),
      isLive: Math.random() < 0.05,
      eventCount
    };
  });
  
  // Generate events from channels
  const events = channels.flatMap(channel => 
    Array.from({ length: channel.eventCount }, (_, i) => ({
      id: `${channel.id}-${i + 1}`,
      title: `${channel.name} Event ${i + 1}`,
      channelName: channel.name,
      channelId: channel.id,
      views: Math.floor(Math.random() * 25000) + 100,
      rating: (Math.random() * 2 + 3).toFixed(1),
      isLive: channel.isLive && i === 0,
      price: Math.floor(Math.random() * 25) + 5,
      isReplay: i > 0
    }))
  );
  
  const filteredChannels = channels
    .filter(channel => channel.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.views - a.views);
  
  const filteredEvents = events
    .filter(event => event.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.views - a.views);
  
  const topChannels = filteredChannels.slice(0, 10);
  const topEvents = filteredEvents.slice(0, 10);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'channels') {
      navigate('/channels');
    } else if (value === 'events') {
      navigate('/events');
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Browse Streamura</h1>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search events or channels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Top Rated</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <div className="grid gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Top Channels ({channels.length} total)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topChannels.map(channel => (
                  <Card key={channel.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{channel.name}</CardTitle>
                        {channel.isLive && <Badge className="bg-red-500">LIVE</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-2">{channel.description}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                        <span className="flex items-center"><Users className="h-4 w-4 mr-1" />{channel.subscribers.toLocaleString()}</span>
                        <span className="flex items-center"><Star className="h-4 w-4 mr-1" />{channel.rating}</span>
                      </div>
                      <p className="text-xs text-gray-400">{channel.eventCount} events • {channel.views.toLocaleString()} views</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Top Events ({events.length} total)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topEvents.map(event => (
                  <Card key={event.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <div className="flex gap-2">
                          {event.isLive && <Badge className="bg-red-500">LIVE</Badge>}
                          {event.isReplay && <Badge variant="outline">REPLAY</Badge>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-2">{event.channelName}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span className="font-semibold">${event.price}</span>
                        <span className="flex items-center"><Star className="h-4 w-4 mr-1" />{event.rating}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{event.views.toLocaleString()} views</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Browse;