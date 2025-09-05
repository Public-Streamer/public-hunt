import React from 'react';
import { Video, Users, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface OfflineStreamer {
  id: string;
  name: string;
  profilePic: string;
  role: string;
  isLive: boolean;
  thumbnail: string;
  scheduledTime?: string;
}

interface OfflineStreamSectionProps {
  eventId: string;
  hasPaid: boolean;
}

const OfflineStreamSection: React.FC<OfflineStreamSectionProps> = ({
  eventId,
  hasPaid,
}) => {
  // Mock offline streamers data
  const getOfflineStreamers = (id: string): OfflineStreamer[] => {
    const baseStreamers = [
      {
        id: '4',
        name: 'David Kim',
        profilePic: '/placeholder.svg',
        role: 'Backstage Access',
        isLive: false,
        thumbnail: '/placeholder.svg',
        scheduledTime: '9:00 PM EST',
      },
      {
        id: '5',
        name: 'Emma Wilson',
        profilePic: '/placeholder.svg',
        role: 'Aerial View',
        isLive: false,
        thumbnail: '/placeholder.svg',
        scheduledTime: '9:30 PM EST',
      },
      {
        id: '6',
        name: 'James Taylor',
        profilePic: '/placeholder.svg',
        role: 'Commentary',
        isLive: false,
        thumbnail: '/placeholder.svg',
        scheduledTime: '10:00 PM EST',
      },
    ];

    return baseStreamers;
  };

  const offlineStreamers = getOfflineStreamers(eventId);

  if (offlineStreamers.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center">
            <Clock className="h-5 w-5 mr-2 text-gray-500" />
            Scheduled Streams ({offlineStreamers.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offlineStreamers.map((streamer) => (
            <Card
              key={streamer.id}
              className="relative overflow-hidden opacity-75"
            >
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Video className="h-12 w-12 text-gray-400" />
                </div>

                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="text-white text-center">
                    <Clock className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">
                      Starts at {streamer.scheduledTime}
                    </p>
                  </div>
                </div>

                <Badge className="absolute top-2 left-2 bg-gray-600 text-white text-xs">
                  SCHEDULED
                </Badge>
              </div>

              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={streamer.profilePic}
                      alt={streamer.name}
                    />
                    <AvatarFallback>
                      {streamer.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm truncate">
                      {streamer.name}
                    </h3>
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

export default OfflineStreamSection;
