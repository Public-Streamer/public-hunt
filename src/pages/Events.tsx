import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Eye, ChevronDown, ChevronUp, Plus, History, Clock, DollarSign } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import EventRankingControls, { SortOption } from '@/components/EventRankingControls';
import ScheduledEventsGrid from '@/components/ScheduledEventsGrid';
import PastEventsGrid from '@/components/PastEventsGrid';
import { supabase } from '@/integrations/supabase/client';

interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  ticket_price: number;
  is_live: boolean;
  viewer_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const Events: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('most-live-viewers');
  const [scheduledSortBy, setScheduledSortBy] = useState<SortOption>('most-live-viewers');
  const [activeTab, setActiveTab] = useState('live');
  const [liveEvents, setLiveEvents] = useState<Event[]>([]);
  const [scheduledEvents, setScheduledEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightedEvent, setHighlightedEvent] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    fetchEvents();
    
    // Check if there's an event parameter in URL to highlight
    const eventParam = searchParams.get('event');
    if (eventParam) {
      setHighlightedEvent(eventParam);
      // Clear highlight after 3 seconds
      setTimeout(() => setHighlightedEvent(null), 3000);
    }
    
    // Set up real-time subscription for live events
    const subscription = supabase
      .channel('events-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [searchParams]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      console.log('Fetching events...');
      
      // Fetch live events
      const { data: liveEventsData, error: liveError } = await supabase
        .from('events')
        .select('*')
        .eq('is_live', true)
        .order('viewer_count', { ascending: false });

      if (liveError) {
        console.error('Error fetching live events:', liveError);
        throw liveError;
      }

      // Fetch scheduled events (not live, including events with null created_by)
      const today = new Date().toISOString().split('T')[0];
      const { data: scheduledEventsData, error: scheduledError } = await supabase
        .from('events')
        .select('*')
        .eq('is_live', false)
        .order('date', { ascending: true });

      if (scheduledError) {
        console.error('Error fetching scheduled events:', scheduledError);
        throw scheduledError;
      }

      console.log('Live events:', liveEventsData);
      console.log('Scheduled events:', scheduledEventsData);

      setLiveEvents(liveEventsData || []);
      setScheduledEvents(scheduledEventsData || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };
  
  function getTimeUntilStart(startDate: Date): string {
    const now = new Date();
    const diff = startDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`;
    return 'starting soon';
  }
  
  const sortEvents = (events: Event[], sortOption: SortOption) => {
    return [...events].sort((a, b) => {
      switch (sortOption) {
        case 'most-views':
          return (b.viewer_count || 0) - (a.viewer_count || 0);
        case 'least-views':
          return (a.viewer_count || 0) - (b.viewer_count || 0);
        case 'most-revenue':
          return (b.ticket_price || 0) - (a.ticket_price || 0);
        case 'least-revenue':
          return (a.ticket_price || 0) - (b.ticket_price || 0);
        case 'most-live-viewers':
          return (b.viewer_count || 0) - (a.viewer_count || 0);
        case 'least-live-viewers':
          return (a.viewer_count || 0) - (b.viewer_count || 0);
        case 'most-subscribers':
          return (b.viewer_count || 0) - (a.viewer_count || 0);
        case 'least-subscribers':
          return (a.viewer_count || 0) - (b.viewer_count || 0);
        case 'most-popular':
          return (b.viewer_count || 0) - (a.viewer_count || 0);
        case 'least-popular':
          return (a.viewer_count || 0) - (b.viewer_count || 0);
        default:
          return (b.viewer_count || 0) - (a.viewer_count || 0);
      }
    });
  };
  
  const filterEvents = (events: Event[]) => {
    return events.filter(event => {
      const matchesKeyword = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            event.category?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // For member search, we'll need to implement participant lookup later
      const matchesMember = memberSearch === '';
      
      return matchesKeyword && matchesMember;
    });
  };
  
  const filteredLiveEvents = sortEvents(filterEvents(liveEvents), sortBy);
  
  const handleEventClick = (eventId: string) => {
    navigate(`/event/${eventId}`);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Events</h1>
        
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
            <Button 
              onClick={() => navigate('/create?tab=event')} 
              className="mb-4 w-full md:w-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none hover:from-purple-600 hover:to-pink-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Event
            </Button>
            
            <EventRankingControls
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              sortBy={sortBy}
              onSortChange={setSortBy}
              memberSearch={memberSearch}
              onMemberSearchChange={setMemberSearch}
              activeTab={activeTab}
            />
            
            {loading ? (
              <div className="text-center py-8">
                <div className="text-lg">Loading events...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLiveEvents.map((event, index) => (
                  <TooltipWrapper key={event.id} content={`View ${event.name} - ${event.viewer_count} viewers`}>
                    <Card 
                      className={`hover:shadow-lg transition-all cursor-pointer relative ${
                        highlightedEvent === event.id ? 'ring-4 ring-purple-500 ring-opacity-50 shadow-xl' : ''
                      }`}
                      onClick={() => handleEventClick(event.id)}
                    >
                      <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                        #{index + 1}
                      </div>
                      <CardHeader className="pt-8">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{event.name}</CardTitle>
                          <TooltipWrapper content="This event is currently live">
                            <Badge className="bg-red-500">LIVE</Badge>
                          </TooltipWrapper>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-2">{event.category}</p>
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                          <TooltipWrapper content="Event price">
                            <span className="font-semibold">${event.ticket_price}</span>
                          </TooltipWrapper>
                          <TooltipWrapper content="Event location">
                            <span className="text-xs">{event.location}</span>
                          </TooltipWrapper>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                          <TooltipWrapper content="Current viewers">
                            <span className="flex items-center">
                              <Eye className="h-3 w-3 mr-1" />
                              {event.viewer_count || 0} viewers
                            </span>
                          </TooltipWrapper>
                          <span>{new Date(event.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-2 line-clamp-2">
                          {event.description}
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipWrapper>
                ))}
                {filteredLiveEvents.length === 0 && !loading && (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500 text-lg">No live events at the moment.</p>
                    <p className="text-gray-400 mt-2">Create your first live event!</p>
                  </div>
                )}
              </div>
            )}
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
            
            {loading ? (
              <div className="text-center py-8">
                <div className="text-lg">Loading scheduled events...</div>
              </div>
            ) : (
            <ScheduledEventsGrid
                events={scheduledEvents.map(event => ({
                  id: event.id,
                  title: event.name,
                  channelName: event.category || 'General',
                  startDate: event.date,
                  startTime: event.time,
                  startDateTime: new Date(`${event.date}T${event.time}`),
                  views: event.viewer_count || 0,
                  liveViews: 0,
                  rating: '4.5',
                  price: event.ticket_price || 0,
                  ticketRevenue: 0,
                  ticketSales: 0,
                  timeUntilStart: getTimeUntilStart(new Date(`${event.date}T${event.time}`)),
                  participants: [],
                  description: event.description || '',
                  subscribers: 0
                }))}
                searchTerm={searchTerm}
                memberSearch={memberSearch}
                sortBy={scheduledSortBy}
              />
            )}
          </TabsContent>
          
          <TabsContent value="past" className="space-y-6">
            <PastEventsGrid />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Events;