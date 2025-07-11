import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Maximize2, Users, Eye } from 'lucide-react';

interface Stream {
  id: string;
  title: string;
  streamer: string;
  viewers: number;
  isLive: boolean;
  thumbnail: string;
}

interface StageViewProps {
  eventTitle: string;
  streams: Stream[];
}

const StageView: React.FC<StageViewProps> = ({ eventTitle, streams }) => {
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [mainStream, setMainStream] = useState<Stream | null>(streams[0] || null);

  const handleStreamSelect = (stream: Stream) => {
    setMainStream(stream);
    setSelectedStream(stream.id);
  };

  return (
    <div className="bg-black min-h-screen text-white p-4">
      <div className="container mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{eventTitle}</h1>
          <div className="flex items-center space-x-4">
            <Badge variant="destructive" className="bg-red-600">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
              LIVE
            </Badge>
            <span className="text-gray-300 flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {streams.reduce((total, stream) => total + stream.viewers, 0)} viewers
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-4">
          {/* Main Stream */}
          <div className="lg:col-span-3">
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-0">
                <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden relative">
                  {mainStream ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <Play className="h-16 w-16 text-purple-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold">{mainStream.title}</h3>
                        <p className="text-gray-400">by {mainStream.streamer}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      Select a stream to watch
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stream Thumbnails */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Camera Angles</h3>
            {streams.map((stream) => (
              <Card 
                key={stream.id}
                className={`cursor-pointer transition-all hover:scale-105 ${
                  selectedStream === stream.id 
                    ? 'ring-2 ring-purple-500 bg-purple-900/20' 
                    : 'bg-gray-900 hover:bg-gray-800'
                } border-gray-700`}
                onClick={() => handleStreamSelect(stream)}
              >
                <CardContent className="p-3">
                  <div className="aspect-video bg-gray-800 rounded mb-2 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="h-8 w-8 text-purple-500" />
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="absolute top-2 right-2 p-1 h-auto"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm truncate">{stream.title}</h4>
                    <p className="text-xs text-gray-400">{stream.streamer}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {stream.viewers}
                      </span>
                      {stream.isLive && (
                        <Badge variant="destructive" className="text-xs px-1 py-0">
                          LIVE
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StageView;