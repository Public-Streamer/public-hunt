import React from 'react';
import { Video, VolumeX, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StreamerThumbnailProps {
  streamer: {
    id: string;
    name: string;
    role: string;
    viewers: number;
    isLive: boolean;
    thumbnail: string;
  };
  hasPaid: boolean;
}

const StreamerThumbnail: React.FC<StreamerThumbnailProps> = ({
  streamer,
  hasPaid,
}) => {
  return (
    <Card className="relative overflow-hidden">
      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative">
        {/* Video placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Video className="h-12 w-12 text-gray-400" />
        </div>

        {/* Clouding overlay when not paid */}
        {!hasPaid && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div className="text-white text-center">
              <Video className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Pay admission to view</p>
            </div>
          </div>
        )}

        {/* Live indicator */}
        {streamer.isLive && (
          <Badge className="absolute top-2 left-2 bg-red-600 text-white text-xs">
            <div className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse" />
            LIVE
          </Badge>
        )}

        {/* Muted indicator */}
        <div className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded">
          <VolumeX className="h-3 w-3" />
        </div>

        {/* Viewer count */}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center">
          <Users className="h-3 w-3 mr-1" />
          {streamer.viewers}
        </div>
      </div>

      <CardContent className="p-3">
        <h3 className="font-semibold text-sm truncate">{streamer.name}</h3>
        <p className="text-xs text-gray-600">{streamer.role}</p>
      </CardContent>
    </Card>
  );
};

export default StreamerThumbnail;
