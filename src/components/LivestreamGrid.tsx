import React, { useState } from 'react';
import { Maximize2, Minimize2, Video, Volume2, VolumeX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Livestream {
  id: string;
  title: string;
  streamerName: string;
  viewers: number;
  isLive: boolean;
  thumbnail: string;
}

interface LivestreamGridProps {
  streams: Livestream[];
}

const LivestreamGrid: React.FC<LivestreamGridProps> = ({ streams }) => {
  const [maximizedStream, setMaximizedStream] = useState<string | null>(null);
  const [mutedStreams, setMutedStreams] = useState<Set<string>>(new Set());

  const toggleMaximize = (streamId: string) => {
    setMaximizedStream(maximizedStream === streamId ? null : streamId);
  };

  const toggleMute = (streamId: string) => {
    const newMuted = new Set(mutedStreams);
    if (newMuted.has(streamId)) {
      newMuted.delete(streamId);
    } else {
      newMuted.add(streamId);
    }
    setMutedStreams(newMuted);
  };

  if (maximizedStream) {
    const stream = streams.find((s) => s.id === maximizedStream);
    if (!stream) return null;

    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="relative w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center">
            <Video className="h-32 w-32 text-white/50" />
          </div>

          <div className="absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded flex items-center space-x-2">
            <Badge className="bg-red-600">
              <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
              LIVE
            </Badge>
            <span className="font-medium">{stream.streamerName}</span>
            <span className="text-sm">{stream.viewers} viewers</span>
          </div>

          <div className="absolute top-4 right-4 flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toggleMute(stream.id)}
            >
              {mutedStreams.has(stream.id) ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toggleMaximize(stream.id)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {streams.map((stream) => (
        <Card key={stream.id} className="overflow-hidden">
          <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 relative group cursor-pointer">
            <div className="absolute inset-0 flex items-center justify-center">
              <Video className="h-12 w-12 text-purple-500" />
            </div>

            {stream.isLive && (
              <Badge className="absolute top-2 left-2 bg-red-600 text-white">
                <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
                LIVE
              </Badge>
            )}

            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
              {stream.viewers} viewers
            </div>

            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toggleMute(stream.id)}
              >
                {mutedStreams.has(stream.id) ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toggleMaximize(stream.id)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {stream.title}
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-0">
            <p className="text-xs text-gray-600">{stream.streamerName}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default LivestreamGrid;
