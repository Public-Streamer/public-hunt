import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Video, Users, Monitor, Maximize2, Volume2, VolumeX, Settings, Camera } from 'lucide-react';
import { useTracks, useParticipants, useRoomContext, VideoTrack } from '@livekit/components-react';
import { Track } from 'livekit-client';
import MultiCameraGrid from './MultiCameraGrid';
import StreamSelector from './StreamSelector';
import TicketVerification from './TicketVerification';

interface ViewerInterfaceProps {
  eventId: string;
  hasAccess: boolean;
  onUpgrade?: () => void;
  showUpgradePrompt?: boolean;
}

interface ViewerControlsProps {
  onFullscreen: () => void;
  onQualityChange: (quality: string) => void;
  onVolumeToggle: () => void;
  isMuted: boolean;
  isFullscreen: boolean;
}

const ViewerControls: React.FC<ViewerControlsProps> = ({
  onFullscreen,
  onQualityChange,
  onVolumeToggle,
  isMuted,
  isFullscreen
}) => {
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const qualities = ['Auto', 'HD', 'SD', 'Low'];

  return (
    <div className="flex items-center gap-2 p-2 bg-black/70 rounded-lg">
      <Button
        variant="ghost"
        size="sm"
        onClick={onVolumeToggle}
        className="text-white hover:bg-white/20"
      >
        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </Button>
      
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowQualityMenu(!showQualityMenu)}
          className="text-white hover:bg-white/20"
        >
          <Settings className="h-4 w-4" />
        </Button>
        
        {showQualityMenu && (
          <div className="absolute bottom-full mb-2 right-0 bg-black/90 rounded-lg p-2 min-w-[100px]">
            {qualities.map((quality) => (
              <button
                key={quality}
                onClick={() => {
                  onQualityChange(quality);
                  setShowQualityMenu(false);
                }}
                className="block w-full text-left text-white hover:bg-white/20 px-3 py-1 rounded text-sm"
              >
                {quality}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onFullscreen}
        className="text-white hover:bg-white/20"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

const ViewerInterface: React.FC<ViewerInterfaceProps> = ({
  eventId,
  hasAccess,
  onUpgrade,
  showUpgradePrompt = true
}) => {
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'single'>('grid');
  const [currentQuality, setCurrentQuality] = useState('Auto');
  
  const room = useRoomContext();
  const participants = useParticipants();
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: true });
  const audioTracks = useTracks([Track.Source.Microphone], { onlySubscribed: true });

  // Check if we're properly connected to the room
  const isConnected = room && room.state === 'connected';

  // Access control check
  if (!hasAccess) {
    return (
      <TicketVerification 
        eventId={eventId} 
        onUpgrade={onUpgrade}
        showUpgradePrompt={showUpgradePrompt}
      />
    );
  }

  // Check if we're still connecting to the room
  if (!isConnected) {
    return (
      <Card className="mb-6">
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold mb-2">Connecting to Live Stream</h3>
          <p className="text-gray-600">
            Establishing connection to the live event...
          </p>
        </CardContent>
      </Card>
    );
  }

  // No active streams
  if (tracks.length === 0) {
    return (
      <Card className="mb-6">
        <CardContent className="p-8 text-center">
          <Video className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No Live Streams</h3>
          <p className="text-gray-600">
            This event is not currently live. Check back later or contact the organizer.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // Implement fullscreen logic here
  };

  const handleQualityChange = (quality: string) => {
    setCurrentQuality(quality);
    // Implement quality change logic here
  };

  const handleVolumeToggle = () => {
    setIsMuted(!isMuted);
    // Mute/unmute audio tracks
    audioTracks.forEach(trackRef => {
      if (trackRef.publication.track) {
        trackRef.publication.track.mediaStreamTrack.enabled = isMuted;
      }
    });
  };

  const handleTrackSelect = (trackId: string | null) => {
    setSelectedTrack(trackId);
    setViewMode(trackId ? 'single' : 'grid');
  };

  return (
    <div className="mb-6">
      <Card>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-red-600 text-white">
                <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
                LIVE
              </Badge>
              <span className="text-sm text-gray-600">
                {tracks.length} camera{tracks.length !== 1 ? 's' : ''} • {participants.length} participant{participants.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setViewMode('grid');
                  setSelectedTrack(null);
                }}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'single' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('single')}
                disabled={!selectedTrack}
              >
                Single
              </Button>
            </div>
          </div>

          {/* Main Video Display */}
          <div className="relative bg-black rounded-lg overflow-hidden mb-4">
            <div className="aspect-video">
              {viewMode === 'grid' || !selectedTrack ? (
                <MultiCameraGrid
                  tracks={tracks}
                  onTrackSelect={handleTrackSelect}
                  selectedTrack={selectedTrack}
                />
              ) : (
                <div className="w-full h-full relative">
                  {/* Single track view */}
                  {(() => {
                    const track = tracks.find(t => t.publication.trackSid === selectedTrack);
                    if (!track) return (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <Camera className="h-12 w-12 text-white/50" />
                      </div>
                    );
                    return (
                      <VideoTrack 
                        trackRef={track} 
                        className="w-full h-full object-cover"
                      />
                    );
                  })()}
                </div>
              )}
            </div>
            
            {/* Overlay Controls */}
            <div className="absolute bottom-4 right-4">
              <ViewerControls
                onFullscreen={handleFullscreen}
                onQualityChange={handleQualityChange}
                onVolumeToggle={handleVolumeToggle}
                isMuted={isMuted}
                isFullscreen={isFullscreen}
              />
            </div>
          </div>

          {/* Camera Selector */}
          {tracks.length > 1 && (
            <StreamSelector
              tracks={tracks}
              selectedTrack={selectedTrack}
              onSelect={handleTrackSelect}
            />
          )}

          {/* Stream Info */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>{participants.length} watching</span>
                </div>
                <div className="flex items-center gap-1">
                  <Monitor className="h-4 w-4 text-gray-500" />
                  <span>Quality: {currentQuality}</span>
                </div>
              </div>
              <div className="text-gray-500">
                Event ID: {eventId}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewerInterface;