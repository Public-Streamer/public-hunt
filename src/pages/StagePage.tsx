import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Video } from 'lucide-react';
import LivestreamGrid from '@/components/LivestreamGrid';
import BulletinBoard from '@/components/BulletinBoard';

const StagePage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  
  // Mock data - in real app, fetch from API
  const event = {
    id: eventId || '1',
    title: 'Championship Finals 2024',
    isLive: true,
    viewers: 15420,
    startTime: '8:00 PM EST'
  };
  
  const streams = [
    {
      id: '1',
      title: 'Main Camera',
      streamerName: 'Director View',
      viewers: 8500,
      isLive: true,
      thumbnail: '/placeholder.svg'
    },
    {
      id: '2',
      title: 'Player 1 Cam',
      streamerName: 'Alex Johnson',
      viewers: 3200,
      isLive: true,
      thumbnail: '/placeholder.svg'
    },
    {
      id: '3',
      title: 'Player 2 Cam',
      streamerName: 'Sarah Chen',
      viewers: 2800,
      isLive: true,
      thumbnail: '/placeholder.svg'
    },
    {
      id: '4',
      title: 'Audience Cam',
      streamerName: 'Crowd View',
      viewers: 1200,
      isLive: true,
      thumbnail: '/placeholder.svg'
    },
    {
      id: '5',
      title: 'Commentary',
      streamerName: 'Mike & Tom',
      viewers: 4500,
      isLive: true,
      thumbnail: '/placeholder.svg'
    },
    {
      id: '6',
      title: 'Replay Cam',
      streamerName: 'Instant Replay',
      viewers: 900,
      isLive: true,
      thumbnail: '/placeholder.svg'
    }
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">{event.title} - Stage Page</h1>
              {event.isLive && (
                <Badge className="bg-red-600 text-white">
                  <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
                  LIVE
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {event.viewers.toLocaleString()} viewers
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Started at {event.startTime}
              </div>
              <div className="flex items-center">
                <Video className="h-4 w-4 mr-1" />
                {streams.length} cameras
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Livestream Grid */}
          <div className="xl:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Video className="h-5 w-5 mr-2" />
                  Live Streams
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LivestreamGrid streams={streams} />
              </CardContent>
            </Card>
          </div>
          
          {/* Bulletin Board */}
          <div className="xl:col-span-1">
            <BulletinBoard eventId={event.id} userRole="viewer" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StagePage;