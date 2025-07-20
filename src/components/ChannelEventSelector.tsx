import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Users, Calendar, Tv, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Channel {
  id: string;
  name: string;
  description?: string;
  category?: string;
  subscriber_count?: number;
}

interface Event {
  id: string;
  name: string;
  description?: string;
  date?: string;
  viewer_count?: number;
  channel_name?: string;
}

interface ChannelEventSelectorProps {
  selectedChannels: string[];
  selectedEvents: string[];
  onChannelsChange: (channels: string[]) => void;
  onEventsChange: (events: string[]) => void;
}

export const ChannelEventSelector: React.FC<ChannelEventSelectorProps> = ({
  selectedChannels,
  selectedEvents,
  onChannelsChange,
  onEventsChange
}) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [channelSearch, setChannelSearch] = useState('');
  const [eventSearch, setEventSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadChannelsAndEvents();
  }, []);

  const loadChannelsAndEvents = async () => {
    setLoading(true);
    try {
      // Load channels
      const { data: channelsData } = await supabase
        .from('channels')
        .select('id, name, description, category')
        .limit(20);

      // Load upcoming and recent events
      const { data: eventsData } = await supabase
        .from('events')
        .select(`
          id, 
          name, 
          description, 
          date, 
          viewer_count,
          channels(name)
        `)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // Last 30 days or future
        .order('date', { ascending: false })
        .limit(20);

      if (channelsData) {
        setChannels(channelsData);
      }

      if (eventsData) {
        const processedEvents = eventsData.map(event => ({
          ...event,
          channel_name: event.channels?.name || 'Unknown Channel'
        }));
        setEvents(processedEvents);
      }
    } catch (error) {
      console.error('Error loading channels and events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(channelSearch.toLowerCase()) ||
    channel.description?.toLowerCase().includes(channelSearch.toLowerCase())
  );

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(eventSearch.toLowerCase()) ||
    event.description?.toLowerCase().includes(eventSearch.toLowerCase()) ||
    event.channel_name?.toLowerCase().includes(eventSearch.toLowerCase())
  );

  const handleChannelToggle = (channelId: string) => {
    if (selectedChannels.includes(channelId)) {
      onChannelsChange(selectedChannels.filter(id => id !== channelId));
    } else {
      onChannelsChange([...selectedChannels, channelId]);
    }
  };

  const handleEventToggle = (eventId: string) => {
    if (selectedEvents.includes(eventId)) {
      onEventsChange(selectedEvents.filter(id => id !== eventId));
    } else {
      onEventsChange([...selectedEvents, eventId]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Target Specific Channels & Events</CardTitle>
        <CardDescription className="text-xs">
          Choose specific channels or events to show your ads to their audiences for better targeting.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="channels" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="channels" className="text-xs">
              <Tv className="h-3 w-3 mr-1" />
              Channels ({selectedChannels.length})
            </TabsTrigger>
            <TabsTrigger value="events" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              Events ({selectedEvents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="channels" className="space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search channels..."
                value={channelSearch}
                onChange={(e) => setChannelSearch(e.target.value)}
                className="pl-8 text-sm"
              />
            </div>

            {selectedChannels.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Selected Channels:</Label>
                <div className="flex flex-wrap gap-1">
                  {selectedChannels.map(channelId => {
                    const channel = channels.find(c => c.id === channelId);
                    return channel ? (
                      <Badge key={channelId} variant="secondary" className="text-xs">
                        {channel.name}
                        <button
                          onClick={() => handleChannelToggle(channelId)}
                          className="ml-1 text-xs hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {loading ? (
                <div className="text-center py-4 text-sm text-gray-500">Loading channels...</div>
              ) : filteredChannels.length > 0 ? (
                filteredChannels.map(channel => (
                  <div key={channel.id} className="flex items-start space-x-2 p-2 border rounded-lg hover:bg-gray-50">
                    <Checkbox
                      id={`channel-${channel.id}`}
                      checked={selectedChannels.includes(channel.id)}
                      onCheckedChange={() => handleChannelToggle(channel.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <Label htmlFor={`channel-${channel.id}`} className="text-sm font-medium cursor-pointer">
                        {channel.name}
                      </Label>
                      {channel.description && (
                        <p className="text-xs text-gray-500 truncate">{channel.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {channel.category && (
                          <Badge variant="outline" className="text-xs">{channel.category}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-sm text-gray-500">
                  {channelSearch ? 'No channels found matching your search.' : 'No channels available.'}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search events..."
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                className="pl-8 text-sm"
              />
            </div>

            {selectedEvents.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Selected Events:</Label>
                <div className="flex flex-wrap gap-1">
                  {selectedEvents.map(eventId => {
                    const event = events.find(e => e.id === eventId);
                    return event ? (
                      <Badge key={eventId} variant="secondary" className="text-xs">
                        {event.name}
                        <button
                          onClick={() => handleEventToggle(eventId)}
                          className="ml-1 text-xs hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {loading ? (
                <div className="text-center py-4 text-sm text-gray-500">Loading events...</div>
              ) : filteredEvents.length > 0 ? (
                filteredEvents.map(event => (
                  <div key={event.id} className="flex items-start space-x-2 p-2 border rounded-lg hover:bg-gray-50">
                    <Checkbox
                      id={`event-${event.id}`}
                      checked={selectedEvents.includes(event.id)}
                      onCheckedChange={() => handleEventToggle(event.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <Label htmlFor={`event-${event.id}`} className="text-sm font-medium cursor-pointer">
                        {event.name}
                      </Label>
                      {event.description && (
                        <p className="text-xs text-gray-500 truncate">{event.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Tv className="h-3 w-3" />
                          {event.channel_name}
                        </div>
                        {event.date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(event.date).toLocaleDateString()}
                          </div>
                        )}
                        {event.viewer_count && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {event.viewer_count} viewers
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-sm text-gray-500">
                  {eventSearch ? 'No events found matching your search.' : 'No events available.'}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {(selectedChannels.length > 0 || selectedEvents.length > 0) && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700 text-sm font-medium">
              <Star className="h-4 w-4" />
              Targeted Advertising Active
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Your ads will be shown to audiences of {selectedChannels.length} selected channels and {selectedEvents.length} selected events.
              This typically improves engagement rates by 20-40%.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};