import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Calendar, Clock, DollarSign, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Event {
  id: string;
  title: string;
  description: string;
  scheduled_time: string;
  admission_price: number;
  status: 'upcoming' | 'live' | 'completed';
  category: string;
  attendee_count: number;
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
      // Mock data for now - replace with actual Supabase query
      const mockEvents: Event[] = [
        {
          id: '1',
          title: 'Epic Gaming Tournament',
          description: 'Join us for an intense gaming competition',
          scheduled_time: '2024-03-15T19:00:00Z',
          admission_price: 5.99,
          status: 'upcoming',
          category: 'Gaming',
          attendee_count: 45
        },
        {
          id: '2',
          title: 'Live Music Session',
          description: 'Acoustic guitar and vocals performance',
          scheduled_time: '2024-03-10T20:00:00Z',
          admission_price: 3.99,
          status: 'completed',
          category: 'Music',
          attendee_count: 78
        }
      ];
      setEvents(mockEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-red-500';
      case 'upcoming': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
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
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{event.category}</Badge>
                    <Badge className={`text-white ${getStatusColor(event.status)}`}>
                      {event.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(event.scheduled_time).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(event.scheduled_time).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4" />
                      <span>${event.admission_price}</span>
                    </div>
                    <span>{event.attendee_count} attendees</span>
                  </div>
                  <Link to={`/events/${event.id}`}>
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