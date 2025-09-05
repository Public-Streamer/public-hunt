import React, { useState, useEffect, useCallback } from 'react';

import {
  Eye,
  History,
  Clock,
  User,
  Edit2,
  Trash2,
  Loader,
  Play,
  Plus,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import EventRankingControls, {
  SortOption,
} from '@/components/EventRankingControls';
import ScheduledEventsGrid from '@/components/ScheduledEventsGrid';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/contexts/AppContext';
import EditEventModal from '@/components/EditEventModal';
import { useToast } from '@/hooks/use-toast';
import MediaBackground from '@/components/MediaBackground';
import PastEvents from './PastEvents';

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
  slug?: string;
  media_urls?: string[];
}

const Events: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('most-live-viewers');
  const [scheduledSortBy, setScheduledSortBy] =
    useState<SortOption>('starts-soon');
  const [mySortBy, setMySortBy] = useState<SortOption>('starts-soon');
  const [pastSortBy, setPastSortBy] = useState<SortOption>('newest');
  const [activeTab, setActiveTab] = useState('live');
  const [liveEvents, setLiveEvents] = useState<Event[]>([]);
  const [scheduledEvents, setScheduledEvents] = useState<Event[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightedEvent, setHighlightedEvent] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUserProfile, isAuthenticated } = useAppContext();
  const { toast } = useToast();

  // Ensure sort options are valid per tab and set defaults
  useEffect(() => {
    const liveAllowed: SortOption[] = [
      'most-live-viewers',
      'newest',
      'oldest',
      'alphabetical',
    ];
    const scheduledAllowed: SortOption[] = ['starts-soon', 'alphabetical'];
    const myAllowed: SortOption[] = ['newest', 'oldest', 'alphabetical'];
    const pastAllowed: SortOption[] = [
      'newest',
      'oldest',
      'alphabetical',
      'most-views',
    ];

    if (activeTab === 'live' && !liveAllowed.includes(sortBy)) {
      setSortBy('most-live-viewers');
    }
    if (
      activeTab === 'scheduled' &&
      !scheduledAllowed.includes(scheduledSortBy)
    ) {
      setScheduledSortBy('starts-soon');
    }
    if (activeTab === 'my-events' && !myAllowed.includes(mySortBy)) {
      setMySortBy('alphabetical');
    }
    if (activeTab === 'past' && !pastAllowed.includes(pastSortBy)) {
      setPastSortBy('newest');
    }
  }, [activeTab]);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);

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
      const pad = (n: number) => String(n).padStart(2, '0');

      // Use *local* date/time (toISOString() is UTC and can be off for Asia/Dhaka)
      const now = new Date();
      const todayLocal = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
        now.getDate()
      )}`; // YYYY-MM-DD
      const currentTimeLocal = `${pad(now.getHours())}:${pad(
        now.getMinutes()
      )}:${pad(now.getSeconds())}`; // HH:MM:SS

      const { data: scheduledEventsData, error: scheduledError } =
        await supabase
          .from('events')
          .select('*')
          // date > today  OR  (date = today AND time >= now)
          .or(
            `date.gt.${todayLocal},and(date.eq.${todayLocal},time.gte.${currentTimeLocal})`
          )
          .order('date', { ascending: true })
          .order('time', { ascending: true, nullsFirst: false });

      if (scheduledError) {
        console.error('Error fetching scheduled events:', scheduledError);
        throw scheduledError;
      }

      // Fetch past events (not live, events that have already occurred)
      const { data: pastEventsData, error: pastEventsError } = await supabase
        .from('events')
        .select('*')
        .eq('is_live', false)
        // date < today OR (date = today AND time < now)
        .or(
          `date.lt.${todayLocal},and(date.eq.${todayLocal},time.lt.${currentTimeLocal})`
        )
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      if (pastEventsError) {
        console.error('Error fetching past events:', pastEventsError);
        throw pastEventsError;
      }

      // Fetch user's own events if authenticated
      let myEventsData = [];
      if (currentUserProfile?.user_id) {
        const { data, error: myEventsError } = await supabase
          .from('events')
          .select('*')
          .eq('created_by', currentUserProfile.user_id)
          .order('created_at', { ascending: false });

        if (myEventsError) {
          console.error('Error fetching my events:', myEventsError);
        } else {
          myEventsData = data || [];
        }
      }

      setLiveEvents(liveEventsData || []);
      setScheduledEvents(scheduledEventsData || []);
      setPastEvents(pastEventsData || []);
      setMyEvents(myEventsData);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserProfile?.user_id]);

  const upsertById = useCallback((list: Event[], item: Event) => {
    const idx = list.findIndex((e) => e.id === item.id);
    if (idx >= 0) {
      const copy = list.slice();
      copy[idx] = item;
      return copy;
    }
    return [item, ...list];
  }, []);

  const removeById = useCallback((list: Event[], id: string) => {
    return list.filter((e) => e.id !== id);
  }, []);

  const isScheduledEvent = useCallback((e: Event) => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toISOString().slice(11, 19);
    return !e.is_live && e.date >= today && e.time >= nowTime;
  }, []);

  const handleUpsertEvent = useCallback(
    (e: Event) => {
      const mine =
        !!currentUserProfile?.user_id &&
        e.created_by === currentUserProfile.user_id;
      const live = !!e.is_live;
      const scheduled = isScheduledEvent(e);

      setLiveEvents((prev) =>
        live ? upsertById(prev, e) : removeById(prev, e.id)
      );
      setScheduledEvents((prev) =>
        scheduled ? upsertById(prev, e) : removeById(prev, e.id)
      );
      setMyEvents((prev) =>
        mine ? upsertById(prev, e) : removeById(prev, e.id)
      );
    },
    [currentUserProfile?.user_id, isScheduledEvent, upsertById, removeById]
  );

  // Realtime-only delete handler (renamed to avoid clashing with UI delete handler below)
  const handleDeleteEventRt = useCallback(
    (id: string) => {
      setLiveEvents((prev) => removeById(prev, id));
      setScheduledEvents((prev) => removeById(prev, id));
      setMyEvents((prev) => removeById(prev, id));
    },
    [removeById]
  );

  useEffect(() => {
    fetchEvents();

    // Check if there's an event parameter in URL to highlight
    const eventParam = searchParams.get('event');
    if (eventParam) {
      setHighlightedEvent(eventParam);
      // Clear highlight after 3 seconds
      setTimeout(() => setHighlightedEvent(null), 3000);
    }

    // Set up real-time subscription for events
    // Local type to avoid using 'any' for realtime payload
    type PostgresChangeEvent<T> = {
      eventType: 'INSERT' | 'UPDATE' | 'DELETE';
      new: T | null;
      old: Partial<T> | null;
    };

    const subscription = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        (payload) => {
          const {
            eventType,
            new: newRow,
            old: oldRow,
          } = payload as unknown as PostgresChangeEvent<Event>;
          try {
            if (eventType === 'INSERT' || eventType === 'UPDATE') {
              if (newRow) {
                handleUpsertEvent(newRow);
              }
            } else if (eventType === 'DELETE') {
              if (oldRow?.id) {
                handleDeleteEventRt(oldRow.id as string);
              }
            }
          } catch (err) {
            console.error('Realtime events handler error:', err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [searchParams, fetchEvents, handleUpsertEvent, handleDeleteEventRt]);

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
    if (!events.length) return [];

    return [...events].sort((a, b) => {
      // Helper function to parse date safely
      const getEventDate = (event: Event): Date => {
        try {
          if (event.date && event.time) {
            return new Date(`${event.date}T${event.time}`);
          }
          return new Date(event.created_at);
        } catch (e) {
          return new Date(0); // Fallback to epoch if date parsing fails
        }
      };

      const dateA = getEventDate(a);
      const dateB = getEventDate(b);
      const now = new Date();

      // Calculate time until start for each event
      const timeUntilStartA = Math.max(0, dateA.getTime() - now.getTime());
      const timeUntilStartB = Math.max(0, dateB.getTime() - now.getTime());

      // Get values with null/undefined fallbacks
      const getValue = (event: Event, key: keyof Event) => {
        const val = event[key];
        if (val === null || val === undefined) return 0;
        if (typeof val === 'number') return val;
        if (typeof val === 'string' && !isNaN(Number(val))) return Number(val);
        return 0;
      };

      // Main sorting logic
      switch (sortOption) {
        // View-based sorting
        case 'most-views':
        case 'most-live-viewers':
          return getValue(b, 'viewer_count') - getValue(a, 'viewer_count');

        case 'least-views':
        case 'least-live-viewers':
          return getValue(a, 'viewer_count') - getValue(b, 'viewer_count');

        // Date-based sorting
        case 'newest':
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

        case 'oldest':
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );

        case 'starts-soon':
          return timeUntilStartA - timeUntilStartB;

        // Alphabetical sorting
        case 'alphabetical':
          return (a.name || '').localeCompare(b.name || '');

        // Revenue/sales sorting
        case 'most-revenue':
          return (
            (getValue(b, 'ticket_price') || 0) -
            (getValue(a, 'ticket_price') || 0)
          );

        case 'least-revenue':
          return (
            (getValue(a, 'ticket_price') || 0) -
            (getValue(b, 'ticket_price') || 0)
          );

        // Popularity/engagement
        case 'most-popular':
          return (b.viewer_count || 0) - (a.viewer_count || 0);

        case 'least-popular':
          return (a.viewer_count || 0) - (b.viewer_count || 0);

        // Default to most viewers if sort option is not recognized
        default:
          return (b.viewer_count || 0) - (a.viewer_count || 0);
      }
    });
  };

  const filterEvents = (events: Event[]) => {
    // Normalize and prepare search terms once
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();
    const normalizedMemberSearch = memberSearch.trim().toLowerCase();
    const searchTerms = normalizedSearchTerm.split(/\s+/).filter(Boolean);
    const memberSearchTerms = normalizedMemberSearch
      .split(/\s+/)
      .filter(Boolean);

    return events.filter((event) => {
      // Skip if no search criteria
      if (!searchTerms.length && !memberSearchTerms.length) {
        return true;
      }

      // Keyword search
      const searchText = [
        event.name,
        // event.description || "",
        event.category || '',
      ]
        .join(' ')
        .toLowerCase();

      const matchesKeyword =
        searchTerms.length === 0 ||
        searchTerms.every((term) => {
          // Create a regex pattern that matches whole words only
          const wordPattern = new RegExp(
            `\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
            'i'
          );

          // Check for exact word matches in the search text
          const hasExactWord = wordPattern.test(searchText);

          // Also check for word starts if no exact match found
          if (!hasExactWord) {
            const wordStartsPattern = new RegExp(
              `\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
              'i'
            );
            return searchText
              .split(/\s+/)
              .some((word) => wordStartsPattern.test(word));
          }

          return true;
        });

      // Member search
      // const matchesMember = memberSearchTerms.length === 0 ||
      //   (event.participants || []).some(participant =>
      //     memberSearchTerms.every(term =>
      //       participant.toLowerCase().includes(term)
      //     )
      //   );

      return matchesKeyword;
    });
  };

  const filteredLiveEvents = sortEvents(filterEvents(liveEvents), sortBy);
  const filteredMyEvents = sortEvents(filterEvents(myEvents), mySortBy);
  const filteredPastEvents = sortEvents(filterEvents(pastEvents), sortBy);

  const handleEventClick = (event: Event & { slug?: string }) => {
    const eventUrl = event.slug ? `/event/${event.slug}` : `/event/${event.id}`;
    navigate(eventUrl);
  };

  const handleEditEvent = (eventId: string) => {
    setEditingEventId(eventId);
    setEditModalOpen(true);
  };

  const handleEventUpdated = () => {
    fetchEvents();
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('created_by', currentUserProfile?.user_id);

      if (error) throw error;

      // Remove the event from local state
      setMyEvents(myEvents.filter((event) => event.id !== eventId));

      toast({
        title: 'Event deleted',
        description: 'The event has been successfully deleted.',
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the event. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">🏆 Ranked Events</h1>
        <p className="text-lg text-gray-600 mb-6">
          Join the hottest events ranked by popularity, live viewers, and
          engagement
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className={`grid w-full ${
              isAuthenticated ? 'grid-cols-4' : 'grid-cols-3'
            } gap-2 sm:gap-4 p-2 bg-transparent`}
          >
            <TooltipWrapper content="View all currently live streaming events happening right now">
              <TabsTrigger
                value="live"
                className="flex items-center justify-center px-2 sm:px-6 py-3 sm:py-4 text-xs sm:text-base font-bold min-h-[60px] sm:min-h-[70px] rounded-xl transition-all duration-200 border-2 border-red-300 bg-gradient-to-r from-red-50 to-red-100 text-red-800 shadow-lg hover:shadow-xl hover:scale-105 hover:from-red-100 hover:to-red-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:border-red-500 data-[state=active]:shadow-red-300"
              >
                <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-3 text-center">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full animate-pulse data-[state=active]:bg-white flex-shrink-0" />
                  <div className="flex flex-col sm:flex-row sm:space-x-1">
                    <span className="text-xs sm:text-base font-bold leading-tight">
                      Live
                    </span>
                    <span className="text-xs sm:text-base font-bold leading-tight">
                      Events
                    </span>
                  </div>
                </div>
              </TabsTrigger>
            </TooltipWrapper>
            <TooltipWrapper content="View upcoming scheduled events that are planned for the future">
              <TabsTrigger
                value="scheduled"
                className="flex items-center justify-center px-2 sm:px-6 py-3 sm:py-4 text-xs sm:text-base font-bold min-h-[60px] sm:min-h-[70px] rounded-xl transition-all duration-200 border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 shadow-lg hover:shadow-xl hover:scale-105 hover:from-blue-100 hover:to-blue-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-500 data-[state=active]:shadow-blue-300"
              >
                <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-3 text-center">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-blue-600" />
                  <div className="flex flex-col sm:flex-row sm:space-x-1">
                    <span className="text-xs sm:text-base font-bold leading-tight">
                      Scheduled
                    </span>
                    <span className="text-xs sm:text-base font-bold leading-tight">
                      Events
                    </span>
                  </div>
                </div>
              </TabsTrigger>
            </TooltipWrapper>
            <TooltipWrapper content="View previously completed events that have already finished">
              <TabsTrigger
                value="past"
                className="flex items-center justify-center px-2 sm:px-6 py-3 sm:py-4 text-xs sm:text-base font-bold min-h-[60px] sm:min-h-[70px] rounded-xl transition-all duration-200 border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 shadow-lg hover:shadow-xl hover:scale-105 hover:from-purple-100 hover:to-purple-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:border-purple-500 data-[state=active]:shadow-purple-300"
              >
                <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-3 text-center">
                  <History className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-purple-600" />
                  <div className="flex flex-col sm:flex-row sm:space-x-1">
                    <span className="text-xs sm:text-base font-bold leading-tight">
                      Past
                    </span>
                    <span className="text-xs sm:text-base font-bold leading-tight">
                      Events
                    </span>
                  </div>
                </div>
              </TabsTrigger>
            </TooltipWrapper>
            {isAuthenticated && (
              <TooltipWrapper content="View events you have created">
                <TabsTrigger
                  value="my-events"
                  className="flex items-center justify-center px-2 sm:px-6 py-3 sm:py-4 text-xs sm:text-base font-bold min-h-[60px] sm:min-h-[70px] rounded-xl transition-all duration-200 border-2 border-green-300 bg-gradient-to-r from-green-50 to-green-100 text-green-800 shadow-lg hover:shadow-xl hover:scale-105 hover:from-green-100 hover:to-green-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:border-green-500 data-[state=active]:shadow-green-300"
                >
                  <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-3 text-center">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-green-600" />
                    <div className="flex flex-col sm:flex-row sm:space-x-1">
                      <span className="text-xs sm:text-base font-bold leading-tight">
                        My
                      </span>
                      <span className="text-xs sm:text-base font-bold leading-tight">
                        Events
                      </span>
                    </div>
                  </div>
                </TabsTrigger>
              </TooltipWrapper>
            )}
          </TabsList>

          <TabsContent value="live" className="space-y-6">
            {/* <Button
              onClick={() => navigate("/create?tab=event")}
              className="mb-4 w-full md:w-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none hover:from-purple-600 hover:to-pink-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Event
            </Button> */}
            <h1 className="text-3xl font-bold mb-4">Live Events</h1>

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
                <div className=" flex items-center justify-center">
                  <Loader className="h-8 w-8 animate-spin" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLiveEvents.map((event, index) => (
                  <TooltipWrapper
                    key={event.id}
                    content={`View ${event.name} - ${event.viewer_count} viewers`}
                  >
                    <Card
                      className={`hover:shadow-lg transition-all cursor-pointer relative ${
                        highlightedEvent === event.id
                          ? 'ring-4 ring-purple-500 ring-opacity-50 shadow-xl'
                          : ''
                      }`}
                      onClick={() => handleEventClick(event)}
                    >
                      <MediaBackground
                        mediaUrls={event?.media_urls || []}
                        className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100"
                      />
                      <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                        #{index + 1}
                      </div>
                      <CardHeader className="pt-8">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {event?.name}
                          </CardTitle>
                          <TooltipWrapper content="This event is currently live">
                            <Badge className="bg-red-500">LIVE</Badge>
                          </TooltipWrapper>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xs text-gray-600 mt-2 line-clamp-2">
                          {event.description}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {event?.category}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                          <TooltipWrapper content="Event price">
                            <span className="font-semibold text-green-600">
                              ${event?.ticket_price}
                            </span>
                          </TooltipWrapper>
                          <TooltipWrapper content="Event location">
                            <span className="text-xs">{event?.location}</span>
                          </TooltipWrapper>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                          <TooltipWrapper content="Current viewers">
                            <span className="flex items-center">
                              <Eye className="h-3 w-3 mr-1" />
                              {event?.viewer_count || 0} viewers
                            </span>
                          </TooltipWrapper>
                          <span>
                            {new Date(event?.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="py-2">
                          <Button
                            onClick={() => handleEventClick(event)}
                            className="w-full mb-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          >
                            <Play className="h-4 w-4 ml-2" /> Watch Now{' '}
                            {event?.ticket_price > 0
                              ? `- $${event.ticket_price}`
                              : ''}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipWrapper>
                ))}
                {filteredLiveEvents.length === 0 && !loading && (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500 text-lg">
                      No live events at the moment.
                    </p>
                    <p className="text-gray-400 mt-2">
                      Create your first live event!
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-6">
            <h1 className="text-3xl font-bold mb-4">Scheduled Events</h1>
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
                <div className=" flex items-center justify-center">
                  <Loader className="h-8 w-8 animate-spin" />
                </div>
              </div>
            ) : (
              <ScheduledEventsGrid
                events={scheduledEvents.map((event) => ({
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
                  timeUntilStart: getTimeUntilStart(
                    new Date(`${event.date}T${event.time}`)
                  ),
                  participants: [],
                  description: event.description || '',
                  subscribers: 0,
                  slug: event.slug,
                  media_urls: event?.media_urls,
                }))}
                searchTerm={searchTerm}
                memberSearch={memberSearch}
                sortBy={scheduledSortBy}
              />
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-6">
            <h1 className="text-3xl font-bold mb-4">Past Events</h1>
            <PastEvents
              events={filteredPastEvents.map((event) => ({
                id: event.id,
                title: event.name,
                channelName: event.category || 'General',
                startDate: event.date,
                startTime: event.time,
                views: event.viewer_count || 0,
                rating: '0', // Default rating
                price: event.ticket_price || 0,
                ticketRevenue: 0, // Default value
                timeUntilStart: getTimeUntilStart(
                  new Date(`${event.date}T${event.time}`)
                ),
                startDateTime: new Date(`${event.date}T${event.time}`),
                participants: [],
                description: event.description || '',
                subscribers: 0, // Default value
                slug: event.slug,
                media_urls: event.media_urls,
                channel_id: '', // Add required field
                is_live: event.is_live,
                category: event.category,
                ticketSales: 0, // Default value
                visibility: 'public' as const, // Default visibility
                tags: [], // Default empty tags
              }))}
            />
          </TabsContent>

          {isAuthenticated && (
            <TabsContent value="my-events" className="space-y-6">
              <Button
                onClick={() => navigate('/create?tab=event')}
                className="mb-4 w-full md:w-auto bg-gradient-to-r from-green-500 to-emerald-500 text-white border-none hover:from-green-600 hover:to-emerald-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Event
              </Button>

              <EventRankingControls
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                sortBy={mySortBy}
                onSortChange={setMySortBy}
                memberSearch={memberSearch}
                onMemberSearchChange={setMemberSearch}
                activeTab={activeTab}
              />

              {loading ? (
                <div className="text-center py-8">
                  <div className=" flex items-center justify-center">
                    <Loader className="h-8 w-8 animate-spin" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMyEvents.map((event, index) => (
                    <TooltipWrapper
                      key={event.id}
                      content={`View ${event.name} - ${event.viewer_count} viewers`}
                    >
                      <Card
                        className={`hover:shadow-lg transition-all cursor-pointer relative h-full ${
                          highlightedEvent === event.id
                            ? 'ring-4 ring-green-500 ring-opacity-50 shadow-xl'
                            : ''
                        }`}
                      >
                        <MediaBackground
                          mediaUrls={event.media_urls || []}
                          className="aspect-video"
                        />

                        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                          #{index + 1}
                        </div>

                        {/* Edit and Delete buttons for user's own events */}
                        {currentUserProfile &&
                          event.created_by === currentUserProfile.user_id && (
                            <div className="absolute top-2 right-2 z-10 flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300 px-2 py-1 h-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditEvent(event.id);
                                }}
                              >
                                <Edit2 className="h-3 w-3 mr-1 text-green-600" />
                                <span className="text-green-600 text-xs">
                                  Edit
                                </span>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300 px-2 py-1 h-7"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3 text-red-600" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Event
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "
                                      <strong>{event.name}</strong>"? This
                                      action cannot be undone and will
                                      permanently remove the event and all
                                      associated data.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDeleteEvent(event.id)
                                      }
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete Event
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        <div onClick={() => handleEventClick(event)}>
                          <CardHeader className="pt-8 h-full">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">
                                {event.name}
                              </CardTitle>
                              {event.is_live && (
                                <TooltipWrapper content="This event is currently live">
                                  <Badge className="bg-red-500">LIVE</Badge>
                                </TooltipWrapper>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <p className="text-sm text-gray-600 h-full">
                              {event.category}
                            </p>
                            <div className="text-xs text-gray-600 mt-2 line-clamp-4 h-full">
                              {event.description}
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-500 h-full">
                              <TooltipWrapper content="Event location">
                                <span className="text-xs">
                                  {event.location}
                                </span>
                              </TooltipWrapper>
                              <TooltipWrapper content="Event price">
                                <span className="font-semibold text-green-600">
                                  ${event.ticket_price}
                                </span>
                              </TooltipWrapper>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-400 mb-1 h-full">
                              <TooltipWrapper content="Current viewers">
                                <span className="flex items-center">
                                  <Eye className="h-3 w-3 mr-1" />
                                  {event.viewer_count || 0} viewers
                                </span>
                              </TooltipWrapper>
                              <span>
                                {new Date(
                                  event.created_at
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    </TooltipWrapper>
                  ))}
                  {filteredMyEvents.length === 0 && !loading && (
                    <div className="col-span-full text-center py-8">
                      <p className="text-gray-500 text-lg">
                        You haven't created any events yet.
                      </p>
                      <p className="text-gray-400 mt-2">
                        Create your first event to get started!
                      </p>
                      <Button
                        onClick={() => navigate('/create?tab=event')}
                        className="mt-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Event
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Edit Event Modal */}
      {editingEventId && (
        <EditEventModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingEventId(null);
          }}
          eventId={editingEventId}
          onEventUpdated={handleEventUpdated}
        />
      )}
    </div>
  );
};

export default Events;
