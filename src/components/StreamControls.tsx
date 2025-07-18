import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  Settings, 
  Users, 
  Activity,
  StopCircle,
  Play
} from 'lucide-react';
import { useLiveKit } from '@/hooks/useLiveKit';
import { useToast } from '@/hooks/use-toast';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';

interface StreamControlsProps {
  eventId: string;
  userRole: 'host' | 'streamer';
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
}

const StreamControls: React.FC<StreamControlsProps> = ({
  eventId,
  userRole,
  onStreamStart,
  onStreamEnd
}) => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [streamQuality, setStreamQuality] = useState<'HD' | 'FHD' | '4K'>('HD');
  
  const { toast } = useToast();
  const {
    room,
    isConnected,
    isConnecting,
    participants,
    createRoom,
    closeRoom,
    connectToRoom,
    disconnectFromRoom
  } = useLiveKit({ eventId, userRole });

  const handleStartStream = async () => {
    try {
      // Create room first if we're the host
      if (userRole === 'host') {
        const roomCreated = await createRoom();
        if (!roomCreated) return;
      }
      
      // Connect to the room
      await connectToRoom();
      onStreamStart?.();
      
      toast({
        title: "Stream Started",
        description: "You are now live streaming!"
      });
    } catch (error) {
      console.error('Error starting stream:', error);
      toast({
        title: "Stream Error",
        description: "Failed to start the stream",
        variant: "destructive"
      });
    }
  };

  const handleEndStream = async () => {
    try {
      if (userRole === 'host') {
        await closeRoom();
      } else {
        await disconnectFromRoom();
      }
      
      onStreamEnd?.();
      
      toast({
        title: "Stream Ended",
        description: "Live stream has been stopped"
      });
    } catch (error) {
      console.error('Error ending stream:', error);
      toast({
        title: "Error",
        description: "Failed to end the stream",
        variant: "destructive"
      });
    }
  };

  const toggleVideo = async () => {
    if (room && room.localParticipant) {
      const videoTrack = room.localParticipant.videoTrackPublications.values().next().value?.track;
      if (videoTrack) {
        await videoTrack.setEnabled(!isVideoEnabled);
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  const toggleAudio = async () => {
    if (room && room.localParticipant) {
      const audioTrack = room.localParticipant.audioTrackPublications.values().next().value?.track;
      if (audioTrack) {
        await audioTrack.setEnabled(!isAudioEnabled);
        setIsAudioEnabled(!isAudioEnabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (room && room.localParticipant) {
      try {
        if (isScreenSharing) {
          await room.localParticipant.setScreenShareEnabled(false);
        } else {
          await room.localParticipant.setScreenShareEnabled(true);
        }
        setIsScreenSharing(!isScreenSharing);
      } catch (error) {
        toast({
          title: "Screen Share Error",
          description: "Failed to toggle screen sharing",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Stream Controls
          </span>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "LIVE" : "OFFLINE"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stream Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-red-600 animate-pulse' : 'bg-gray-400'}`} />
            <span className="font-medium">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {participants.length} {participants.length === 1 ? 'participant' : 'participants'}
            </span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="space-y-4">
          {!isConnected ? (
            <TooltipWrapper content="Start live streaming to your audience">
              <Button
                onClick={handleStartStream}
                disabled={isConnecting}
                className="w-full"
                size="lg"
              >
                <Play className="h-4 w-4 mr-2" />
                {isConnecting ? 'Starting...' : 'Start Live Stream'}
              </Button>
            </TooltipWrapper>
          ) : (
            <TooltipWrapper content="End the live stream and disconnect all viewers">
              <Button
                onClick={handleEndStream}
                variant="destructive"
                className="w-full"
                size="lg"
              >
                <StopCircle className="h-4 w-4 mr-2" />
                End Stream
              </Button>
            </TooltipWrapper>
          )}
        </div>

        {/* Media Controls */}
        {isConnected && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <TooltipWrapper content="Toggle video camera on/off">
                <Button
                  onClick={toggleVideo}
                  variant={isVideoEnabled ? "default" : "destructive"}
                  size="sm"
                  className="flex flex-col h-16"
                >
                  {isVideoEnabled ? <Video className="h-5 w-5 mb-1" /> : <VideoOff className="h-5 w-5 mb-1" />}
                  <span className="text-xs">Video</span>
                </Button>
              </TooltipWrapper>
              
              <TooltipWrapper content="Toggle microphone on/off">
                <Button
                  onClick={toggleAudio}
                  variant={isAudioEnabled ? "default" : "destructive"}
                  size="sm"
                  className="flex flex-col h-16"
                >
                  {isAudioEnabled ? <Mic className="h-5 w-5 mb-1" /> : <MicOff className="h-5 w-5 mb-1" />}
                  <span className="text-xs">Audio</span>
                </Button>
              </TooltipWrapper>
              
              <TooltipWrapper content="Share your screen with viewers">
                <Button
                  onClick={toggleScreenShare}
                  variant={isScreenSharing ? "default" : "outline"}
                  size="sm"
                  className="flex flex-col h-16"
                >
                  <Monitor className="h-5 w-5 mb-1" />
                  <span className="text-xs">Screen</span>
                </Button>
              </TooltipWrapper>
            </div>
          </div>
        )}

        {/* Stream Quality */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Stream Quality</Label>
          <div className="flex space-x-2">
            {(['HD', 'FHD', '4K'] as const).map((quality) => (
              <TooltipWrapper key={quality} content={`Set stream quality to ${quality}`}>
                <Button
                  onClick={() => setStreamQuality(quality)}
                  variant={streamQuality === quality ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                >
                  {quality}
                </Button>
              </TooltipWrapper>
            ))}
          </div>
        </div>

        {/* Additional Settings */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <Label htmlFor="recording" className="text-sm font-medium">
              Record Stream
            </Label>
            <Switch id="recording" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StreamControls;