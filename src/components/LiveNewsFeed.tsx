import React, { useState, useEffect } from 'react';
import { Eye, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LiveEvent {
  id: string;
  title: string;
  description: string;
  viewers: number;
  streamerCount: number;
  startTime: string;
  thumbnail: string;
  channelName: string;
}

const LiveNewsFeed: React.FC = () => {
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for live events - in production this would come from Supabase
  const mockLiveEvents: LiveEvent[] = [
    {
      id: '1',
      title: 'Concert in the Park',
      description: 'Live music performance with multiple camera angles',
      viewers: 2345,
      streamerCount: 4,
      startTime: '2024-01-20T20:00:00Z',
      thumbnail: '',
      channelName: 'Music Live',
    },
    {
      id: '2',
      title: 'Sports Tournament Finals',
      description: 'Championship match with live commentary',
      viewers: 1876,
      streamerCount: 6,
      startTime: '2024-01-20T18:00:00Z',
      thumbnail: '',
      channelName: 'Sports Central',
    },
    {
      id: '3',
      title: 'Tech Conference Keynote',
      description: 'Latest technology announcements',
      viewers: 1234,
      streamerCount: 3,
      startTime: '2024-01-20T14:00:00Z',
      thumbnail: '',
      channelName: 'Tech Today',
    },
    {
      id: '4',
      title: 'Cooking Masterclass',
      description: 'Professional chef demonstration',
      viewers: 892,
      streamerCount: 2,
      startTime: '2024-01-20T16:00:00Z',
      thumbnail: '',
      channelName: 'Culinary Arts',
    },
    {
      id: '5',
      title: 'Art Gallery Opening',
      description: 'Virtual gallery tour and artist interviews',
      viewers: 567,
      streamerCount: 3,
      startTime: '2024-01-20T19:00:00Z',
      thumbnail: '',
      channelName: 'Art World',
    },
  ];

  useEffect(() => {
    // Simulate loading and sort by viewers (highest first)
    const timer = setTimeout(() => {
      const sortedEvents = [...mockLiveEvents].sort(
        (a, b) => b.viewers - a.viewers
      );
      setLiveEvents(sortedEvents);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            Live Events Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          Live Events Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {liveEvents.map((event, index) => (
            <div key={event.id} className="border-b pb-4 last:border-b-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {event.channelName}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-sm mb-1">{event.title}</h4>
                  <p className="text-xs text-gray-600 mb-2">
                    {event.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {event.viewers.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {event.streamerCount} cams
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(event.startTime)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveNewsFeed;
