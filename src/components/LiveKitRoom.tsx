import React, { useEffect } from 'react';
import { LiveKitRoom as LKRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, VideoOff, Mic, MicOff, Users, Settings } from 'lucide-react';
import { useLiveKit } from '@/hooks/useLiveKit';

interface LiveKitRoomProps {
  eventId: string;
  userRole?: 'host' | 'streamer' | 'viewer';
  userName?: string;
  autoConnect?: boolean;
  showControls?: boolean;
  onDisconnect?: () => void;
}

const LiveKitRoom: React.FC<LiveKitRoomProps> = ({
  eventId,
  userRole = 'viewer',
  userName = 'User',
  autoConnect = false,
  showControls = true,
  onDisconnect
}) => {
  const {
    room,
    isConnected,
    isConnecting,
    participants,
    error,
    connectToRoom,
    disconnectFromRoom
  } = useLiveKit({ eventId, userRole, autoConnect });

  const handleDisconnect = async () => {
    await disconnectFromRoom();
    onDisconnect?.();
  };

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <Video className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connection Error</h3>
            <p className="mb-4">{error}</p>
            <Button onClick={connectToRoom} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isConnected && !isConnecting) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Video className="h-5 w-5 mr-2" />
              Live Stream
            </span>
            <Badge variant="secondary">{userRole}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="bg-gray-100 rounded-lg p-8 mb-4">
              <Video className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ready to Join</h3>
              <p className="text-gray-600 mb-4">
                {userRole === 'viewer' 
                  ? 'Join the live stream to watch the event' 
                  : 'Start streaming to share your view with viewers'
                }
              </p>
            </div>
            <Button 
              onClick={connectToRoom}
              className="w-full"
              size="lg"
            >
              {userRole === 'viewer' ? 'Join Stream' : 'Start Streaming'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isConnecting) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Connecting to live stream...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <div className="w-3 h-3 bg-red-600 rounded-full mr-2 animate-pulse" />
            Live Stream
            <Badge className="ml-2 bg-red-600">
              LIVE
            </Badge>
          </span>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="flex items-center">
              <Users className="h-3 w-3 mr-1" />
              {participants.length}
            </Badge>
            {showControls && (
              <Button
                onClick={handleDisconnect}
                variant="outline"
                size="sm"
              >
                Leave
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="bg-black rounded-lg overflow-hidden min-h-[400px]">
          {room && (
            <div className="h-full">
              <VideoConference />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveKitRoom;