import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Eye, ChevronDown, ChevronUp, Plus, History, Clock, DollarSign } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useNavigate } from 'react-router-dom';
import CreateEventForm from '@/components/CreateEventForm';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import EventRankingControls, { SortOption } from '@/components/EventRankingControls';
import ScheduledEventsGrid from '@/components/ScheduledEventsGrid';

const Events: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('most-live-viewers');
  const [scheduledSortBy, setScheduledSortBy] = useState<SortOption>('most-live-viewers');
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('live');
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    category: '',
    price: '',
    maxAttendees: ''
  });
  
  // Generate mock live events
  const liveEvents = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    title: `Live Event ${i + 1}`,
    channelName: `Channel ${Math.floor(i / 2) + 1}`,
    views: Math.floor(Math.random() * 25000) + 100,
    liveViews: Math.floor(Math.random() * 5000) + 10,
    rating: (Math.random() * 2 + 3).toFixed(1),
    isLive: true,
    price: Math.floor(Math.random() * 25) + 5,
    ticketRevenue: Math.floor(Math.random() * 50000) + 1000,
    participants: [`User${i}`, `Participant${i + 1}`],
    description: `Description for event ${i + 1}`,
    subscribers: Math.floor(Math.random() * 10000) + 500
  }));
  
  // Generate mock scheduled events
  const scheduledEvents = Array.from({ length: 30 }, (_, i) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30) + 1);
    startDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
    
    const timeUntilStart = getTimeUntilStart(startDate);
    
    return {
      id: i + 100,
      title: `Scheduled Event ${i + 1}`,
      channelName: `Channel ${Math.floor(i / 3) + 1}`,
      startDate: startDate.toLocaleDateString(),
      startTime: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      startDateTime: startDate,
      views: Math.floor(Math.random() * 15000) + 500,
      liveViews: Math.floor(Math.random() * 3000) + 5,
      rating: (Math.random() * 2 + 3).toFixed(1),
      price: Math.floor(Math.random() * 30) + 10,
      ticketRevenue: Math.floor(Math.random() * 30000) + 2000,
      timeUntilStart,
      participants: [`User${i + 100}`, `Participant${i + 101}`],
      description: `Upcoming event ${i + 1} description`,
      subscribers: Math.floor(Math.random() * 8000) + 300
    };
  }).sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());
  
  function getTimeUntilStart(startDate: Date): string {
    const now = new Date();
    const diff = startDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`;
    return 'starting soon';
  }
  
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
        case 'most-subscribers':
          return (b.subscribers || 0) - (a.subscribers || 0);
        case 'least-subscribers':
          return (a.subscribers || 0) - (b.subscribers || 0);
        case 'most-popular':
          return (b.views * parseFloat(b.rating)) - (a.views * parseFloat(a.rating));
        case 'least-popular':
          return (a.views * parseFloat(a.rating)) - (b.views * parseFloat(b.rating));
        default:
          return (b.liveViews || 0) - (a.liveViews || 0);
      }
    });
  };
  
  const filterEvents = (events: any[]) => {
    return events.filter(event => {
      const matchesKeyword = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            event.channelName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesMember = memberSearch === '' || 
                           event.participants?.some((participant: string) => 
                             participant.toLowerCase().includes(memberSearch.toLowerCase())
                           );
      
      return matchesKeyword && matchesMember;
    });
  };
  
  const filteredLiveEvents = sortEvents(filterEvents(liveEvents), sortBy);
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Event created:', formData);
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      category: '',
      price: '',
      maxAttendees: ''
    });
    setIsCreateFormOpen(false);
  };
  
  const handleMediaUpload = (files: any[]) => {
    console.log('Media uploaded:', files);
  };
  
  const isFormValid = formData.title && formData.description && formData.date && 
                     formData.time && formData.location && formData.category;
  
  const handleEventClick = (eventId: number) => {
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
            <TabsTrigger value="past" onClick={() => navigate('/past-events')}>
              <History className="h-4 w-4 mr-2" />
              Past Events
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="live" className="space-y-6">
            <Collapsible open={isCreateFormOpen} onOpenChange={setIsCreateFormOpen}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="outline" 
                  className="mb-4 w-full md:w-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none hover:from-purple-600 hover:to-pink-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Event
                  {isCreateFormOpen ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mb-6">
                <CreateEventForm 
                  formData={{
                    name: formData.title,
                    description: formData.description,
                    date: formData.date,
                    time: formData.time,
                    location: formData.location,
                    category: formData.category,
                    ticketPrice: parseFloat(formData.price) || 0
                  }}
                  onInputChange={handleInputChange}
                  onSubmit={handleSubmit}
                  onMediaUpload={handleMediaUpload}
                  isValid={Boolean(isFormValid)}
                  canCreateEvent={Boolean(isFormValid)}
                />
              </CollapsibleContent>
            </Collapsible>
            
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
              {filteredLiveEvents.map((event, index) => (
                <TooltipWrapper key={event.id} content={`View ${event.title} - ${event.liveViews} live viewers`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer relative" onClick={() => handleEventClick(event.id)}>
                    <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                      #{index + 1}
                    </div>
                    <CardHeader className="pt-8">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <TooltipWrapper content="This event is currently live">
                          <Badge className="bg-red-500">LIVE</Badge>
                        </TooltipWrapper>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-2">{event.channelName}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                        <TooltipWrapper content="Event price">
                          <span className="font-semibold">${event.price}</span>
                        </TooltipWrapper>
                        <TooltipWrapper content="Event rating">
                          <span className="flex items-center">
                            <Star className="h-4 w-4 mr-1" />
                            {event.rating}
                          </span>
                        </TooltipWrapper>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <TooltipWrapper content="Current live viewers">
                          <span className="flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            {event.liveViews} live
                          </span>
                        </TooltipWrapper>
                        <span>{event.views.toLocaleString()} total views</span>
                      </div>
                      <div className="flex justify-end">
                        <TooltipWrapper content="Total ticket revenue">
                          <span className="flex items-center font-semibold text-green-600 text-xs">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {event.ticketRevenue.toLocaleString()}
                          </span>
                        </TooltipWrapper>
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
        </Tabs>
      </div>
    </div>
  );
};

export default Events;