import React, { useState, useEffect } from 'react';
import { useTracks } from '@livekit/components-react';
import { Track, VideoQuality } from 'livekit-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Maximize2, Settings, Volume2, VolumeX } from 'lucide-react';
import { useParticipantCount } from '@/hooks/useParticipantCount';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useAppContext } from '@/contexts/AppContext';
import { useStreamContext } from './LiveKitProvider';
import TicketVerification from '@/components/access/TicketVerification';
import StreamPaywall from '@/components/access/StreamPaywall';
import MultiCameraGrid from './MultiCameraGrid';
import CameraSelector from './CameraSelector';
import ViewerControls from './ViewerControls';
import SingleTrackView from './SingleTrackView';

interface ViewerInterfaceProps {
  eventId: string;
  eventName: string;
  isLive: boolean;
  mediaUrls: string[];
  eventHostId?: string;
  showUpgradePrompt?: boolean;
}

export const ViewerInterface: React.FC<ViewerInterfaceProps> = ({
  eventId,
  eventName,
  isLive,
  mediaUrls,
  eventHostId,
  showUpgradePrompt = true,
}) => {
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'single'>('grid');
  const [currentQuality, setCurrentQuality] = useState('Auto');
  const [showControls, setShowControls] = useState(true);

  const { user: currentUser } = useAppContext();
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: true });

  // Access control
  const { hasAccess, isLoading: accessLoading, userRole } = useAccessControl(
    eventId,
    null,
    true // requires ticket for paid events
  );

  // Participant count
  const { participantCount } = useParticipantCount(eventId);

  const handleFullscreen = () => {
    const element = document.querySelector('.main-video-container');
    if (element) {
      if (!isFullscreen) {
        if (element.requestFullscreen) {
          element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          (element as any).webkitRequestFullscreen();
        } else if ((element as any).msRequestFullscreen) {
          (element as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const handleVolumeToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleQualityChange = (quality: string) => {
    setCurrentQuality(quality);

    let lkQuality: VideoQuality | undefined;
    switch (quality) {
      case 'HD': lkQuality = VideoQuality.HIGH; break;
      case 'SD': lkQuality = VideoQuality.MEDIUM; break;
      case 'Low': lkQuality = VideoQuality.LOW; break;
      default: lkQuality = undefined;
    }

    tracks.forEach(track => {
      // @ts-ignore - LiveKit typing issue, method exists on RemoteTrackPublication
      if (track.publication?.setVideoQuality) {
        // @ts-ignore
        track.publication.setVideoQuality(lkQuality);
      }
    });
  };

  const handleTrackSelect = (trackId: string | null) => {
    setSelectedTrack(trackId);
    setViewMode(trackId ? 'single' : 'grid');
  };

  // Access control check
  if (accessLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold mb-2">Checking Access</h3>
          <p className="text-gray-600">Verifying your access to this event...</p>
        </CardContent>
      </Card>
    );
  }

  if (!hasAccess) {
    return (
      <TicketVerification
        eventId={eventId}
        onUpgrade={() => { }} // Will be handled by parent component
        showUpgradePrompt={showUpgradePrompt}
      />
    );
  }

  // No active streams
  if (tracks.length === 0) {
    return (
      <Card className="mb-6">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Live Streams</h3>
          <p className="text-gray-600">
            This event is not currently live. Check back later or contact the organizer.
          </p>
        </CardContent>
      </Card>
    );
  }

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
                {tracks.length} camera{tracks.length !== 1 ? 's' : ''} •{' '}
                {participantCount} viewer{participantCount !== 1 ? 's' : ''}
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
          <div className="main-video-container relative bg-black rounded-lg overflow-hidden mb-4 aspect-video">
            <div className="w-full h-full">
              {viewMode === 'grid' || !selectedTrack ? (
                <MultiCameraGrid
                  tracks={tracks}
                  onTrackSelect={handleTrackSelect}
                />
              ) : (
                <div className="w-full h-full relative">
                  <SingleTrackView
                    trackRef={tracks.find(t => t.participant.sid === selectedTrack)}
                    isMuted={isMuted}
                    onMuteToggle={handleVolumeToggle}
                    onFullscreenToggle={handleFullscreen}
                    showControls={showControls}
                  />
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
                showControls={showControls}
              />
            </div>

            {/* Live indicators */}
            <Badge className="absolute top-4 left-4 bg-red-600 text-white">
              <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
              LIVE
            </Badge>

            <Badge className="absolute top-4 right-4 bg-purple-600 text-white flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{participantCount} watching</span>
            </Badge>
          </div>

          {/* Camera Selector */}
          {tracks.length > 1 && (
            <CameraSelector
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
                  <span>{participantCount} watching</span>
                </div>
                <div className="flex items-center gap-1">
                  <Settings className="h-4 w-4 text-gray-500" />
                  <span>Quality: {currentQuality}</span>
                </div>
              </div>
              <div className="text-gray-500">Event: {eventName}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewerInterface;
