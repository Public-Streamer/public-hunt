import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Video, Users, VolumeX } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import LiveKitRoom from '@/components/LiveKitRoom';

interface LiveStreamer {
  id: string;
  name: string;
  profilePic: string;
  role: string;
  viewers: number;
  isLive: boolean;
  thumbnail: string;
}

interface LiveStreamSectionProps {
  eventId: string;
  hasPaid: boolean;
}

interface EventData {
  id: string;
  name: string;
  is_live: boolean;
  livekit_room_name: string;
}

const LiveStreamSection: React.FC<LiveStreamSectionProps> = ({ eventId, hasPaid }) => {
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('id, name, is_live, livekit_room_name')
          .eq('id', eventId)
          .single();

        if (error) throw error;
        setEventData(data);
      } catch (error) {
        console.error('Error fetching event data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);

  // Mock live streamers data for fallback
  const getLiveStreamers = (id: string): LiveStreamer[] => {
    const baseStreamers = [
      {
        id: '1',
        name: 'Alex Rodriguez',
        profilePic: '/placeholder.svg',
        role: 'Main Camera',
        viewers: 1250,
        isLive: true,
        thumbnail: '/placeholder.svg'
      },
      {
        id: '2',
        name: 'Sarah Chen',
        profilePic: '/placeholder.svg',
        role: 'Side Angle',
        viewers: 890,
        isLive: true,
        thumbnail: '/placeholder.svg'
      },
      {
        id: '3',
        name: 'Mike Johnson',
        profilePic: '/placeholder.svg',
        role: 'Close-up Shot',
        viewers: 670,
        isLive: true,
        thumbnail: '/placeholder.svg'
      }
    ];
    
    const eventNum = parseInt(id) || 1;
    return baseStreamers.map(streamer => ({
      ...streamer,
      viewers: streamer.viewers + (eventNum * 10)
    }));
  };

  const liveStreamers = getLiveStreamers(eventId);

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-video bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show LiveKit room if event is live and has a room
  if (eventData?.is_live && eventData?.livekit_room_name && hasPaid) {
    return (
      <div className="mb-6">
        <LiveKitRoom
          eventId={eventId}
          userRole="viewer"
          autoConnect={true}
          showControls={true}
        />
      </div>
    );
  }

  // Show mock streamers for demo purposes or if not live
  if (!eventData?.is_live && liveStreamers.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center">
            <div className="w-3 h-3 bg-red-600 rounded-full mr-2 animate-pulse" />
            Live Now ({liveStreamers.length})
          </h2>
          {!hasPaid && (
            <p className="text-sm text-gray-600">Pay admission to unlock full access</p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {liveStreamers.map((streamer) => (
            <Card key={streamer.id} className="relative overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Video className="h-12 w-12 text-gray-400" />
                </div>
                
                {!hasPaid && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-white text-center">
                      <Video className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Pay admission to view</p>
                    </div>
                  </div>
                )}
                
                <Badge className="absolute top-2 left-2 bg-red-600 text-white text-xs">
                  <div className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse" />
                  LIVE
                </Badge>
                
                <div className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded">
                  <VolumeX className="h-3 w-3" />
                </div>
                
                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  {streamer.viewers}
                </div>
              </div>
              
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={streamer.profilePic} alt={streamer.name} />
                    <AvatarFallback>{streamer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm truncate">{streamer.name}</h3>
                    <p className="text-xs text-gray-600">{streamer.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveStreamSection;