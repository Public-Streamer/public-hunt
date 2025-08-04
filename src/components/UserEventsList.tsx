import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Calendar, Clock, DollarSign, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  time: string;
  ticket_price: number;
  is_live: boolean;
  category: string;
  viewer_count: number;
  created_at: string;
  slug?: string;
}

interface UserEventsListProps {
  userId: string;
}

const UserEventsList: React.FC<UserEventsListProps> = ({ userId }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserEvents();
  }, [userId]);

  const fetchUserEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (event: Event) => {
    if (event.is_live) return 'bg-red-500';
    
    const eventDate = new Date(`${event.date}T${event.time}`);
    const now = new Date();
    
    if (eventDate > now) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const getStatusText = (event: Event) => {
    if (event.is_live) return 'live';
    
    const eventDate = new Date(`${event.date}T${event.time}`);
    const now = new Date();
    
    if (eventDate > now) return 'upcoming';
    return 'completed';
  };

  if (loading) {
    return <div className="text-center py-4">Loading events...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">My Events ({events.length})</h3>
      {events.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">No events created yet</p>
            <div className="text-center mt-4">
              <Link to="/create">
                <Button>Create Your First Event</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{event.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{event.category}</Badge>
                    <Badge className={`text-white ${getStatusColor(event)}`}>
                      {getStatusText(event)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{event.date ? new Date(event.date).toLocaleDateString() : 'No date set'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{event.time || 'No time set'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4" />
                      <span>${event.ticket_price}</span>
                    </div>
                    <span>{event.viewer_count || 0} viewers</span>
                  </div>
                  <Link to={event.slug ? `/event/${event.slug}` : `/event/${event.id}`}>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserEventsList;