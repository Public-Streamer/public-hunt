import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  Users,
  Monitor,
  Maximize2,
  Volume2,
  VolumeX,
  Settings,
  Camera,
  Eye,
} from "lucide-react";
import {
  useTracks,
  useParticipants,
  useRoomContext,
  VideoTrack,
  RoomAudioRenderer,
  AudioTrack,
  TrackReference,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { useParticipantCount } from "@/hooks/useParticipantCount";
import { useAccessControl } from "@/hooks/useAccessControl";
import { useAppContext } from "@/contexts/AppContext";
import TicketVerification from "./TicketVerification";
import MediaBackground from "./MediaBackground";
import InStreamChatOverlay from "./InStreamChatOverlay";
import { useStreamName } from '@/hooks/useStreamName';
import { useHostStripeAccount } from "@/hooks/useHostStripeAccount";
import { TippingModal } from "@/components/TippingModal";
import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { AdBanner } from "@/components/advertising/AdBanner";
import { LivePresenceIndicator } from "@/components/LivePresenceIndicator";

interface IntegratedViewerInterfaceProps {
  eventId: string;
  eventName: string;
  isLive: boolean;
  mediaUrls: string[];
  eventHostId?: string;
  showUpgradePrompt?: boolean;
}

interface ViewerControlsProps {
  onFullscreen: () => void;
  onQualityChange: (quality: string) => void;
  onVolumeToggle: () => void;
  isMuted: boolean;
  isFullscreen: boolean;
  showControls: boolean;
}

const ViewerControls: React.FC<ViewerControlsProps> = ({
  onFullscreen,
  onQualityChange,
  onVolumeToggle,
  isMuted,
  isFullscreen,
  showControls,
}) => {
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const qualities = ["Auto", "HD", "SD", "Low"];

  if (!showControls) return null;

  return (
    <div className="flex items-center gap-2 p-2 bg-black/70 rounded-lg transition-opacity duration-300">
      <Button
        variant="ghost"
        size="sm"
        onClick={onVolumeToggle}
        className="text-white hover:bg-white/20"
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
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
          <div className="absolute bottom-full mb-2 right-0 bg-black/90 rounded-lg p-2 min-w-[100px] z-50">
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

const CameraSelector: React.FC<{
  tracks: TrackReference[];
  selectedTrack: string | null;
  onSelect: (trackId: string | null) => void;
}> = ({ tracks, selectedTrack, onSelect }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-2 bg-black/50">
      {tracks.map((track, index) => {
        const isSelected = track.publication?.trackSid === selectedTrack;
        const participantName = track.participant.identity.split('-')[0] || 'Streamer';

        return (
          <button
            key={`${track.participant.identity}-${track.publication?.trackSid}`}
            onClick={() => onSelect(track.publication?.trackSid || null)}
            className={`relative aspect-video rounded overflow-hidden cursor-pointer border-2 ${isSelected ? 'border-purple-500' : 'border-transparent hover:border-white/30'
              }`}
          >
            <VideoTrack
              trackRef={track}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
              {participantName}
            </div>
            {isSelected && (
              <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                <Eye className="h-6 w-6 text-white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

const IntegratedViewerInterface: React.FC<IntegratedViewerInterfaceProps> = ({
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
  const [viewMode, setViewMode] = useState<"grid" | "single">("grid");
  const [currentQuality, setCurrentQuality] = useState("Auto");
  const [showControls, setShowControls] = useState(true);
  const [hideControlsTimer, setHideControlsTimer] = useState<NodeJS.Timeout | null>(null);

  const { user: currentUser } = useAppContext();
  const room = useRoomContext();
  const participants = useParticipants();
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: true });
  const audioTracks = useTracks([Track.Source.Microphone], {
    onlySubscribed: true,
  });

  const { stripeAccountId } = useHostStripeAccount(eventHostId);

  // Enable real-time notifications for this event
  useRealtimeNotifications({ eventId, enabled: true });

  // Access control
  const { hasAccess, isLoading: accessLoading, userRole } = useAccessControl(
    eventId,
    null,
    true // requires ticket for paid events
  );

  // Participant count
  const { participantCount } = useParticipantCount(eventId);

  // Check if we're properly connected to the room
  const isConnected = room && room.state === "connected";

  // Auto-hide controls in fullscreen
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer) {
      clearTimeout(hideControlsTimer);
    }
    if (isFullscreen) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      setHideControlsTimer(timer);
    }
  }, [isFullscreen, hideControlsTimer]);

  // Handle mouse movement for auto-hide
  const handleMouseMove = useCallback(() => {
    if (isFullscreen) {
      resetHideTimer();
    }
  }, [isFullscreen, resetHideTimer]);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
      if (!isCurrentlyFullscreen) {
        setShowControls(true);
        if (hideControlsTimer) {
          clearTimeout(hideControlsTimer);
        }
      } else {
        resetHideTimer();
      }
      setShowControls(!isCurrentlyFullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("msfullscreenchange", handleFullscreenChange);
    };
  }, [isFullscreen, resetHideTimer, hideControlsTimer]);

  // Handle audio track muting based on selected video track
  useEffect(() => {
    if (!audioTracks) return;
    if (viewMode === "single" && selectedTrack) {
      audioTracks.forEach((trackRef) => {
        const videoTrack = tracks.find(
          (t) => t.publication.trackSid === selectedTrack
        );
        const videoParticipant = videoTrack?.participant.identity;
        const audioParticipant = trackRef.participant.identity;
        if (
          videoParticipant &&
          audioParticipant &&
          videoParticipant === audioParticipant
        ) {
          if (trackRef.publication.track) {
            trackRef.publication.track.mediaStreamTrack.enabled = !isMuted;
          }
        } else {
          if (trackRef.publication.track) {
            trackRef.publication.track.mediaStreamTrack.enabled = false;
          }
        }
      });
    } else {
      // In grid mode, mute all
      audioTracks.forEach((trackRef) => {
        if (trackRef.publication.track) {
          trackRef.publication.track.mediaStreamTrack.enabled = false;
        }
      });
    }
  }, [audioTracks, tracks, selectedTrack, viewMode, isMuted]);

  const handleFullscreen = useCallback(() => {
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
    }
  }, [isFullscreen]);

  const handleVolumeToggle = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const handleQualityChange = useCallback((quality: string) => {
    setCurrentQuality(quality);
    // Quality change logic would go here
  }, []);

  const handleTrackSelect = useCallback((trackId: string | null) => {
    setSelectedTrack(trackId);
    setViewMode(trackId ? "single" : "grid");
  }, []);

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

  // Check if we're still connecting to the room
  if (!isConnected) {
    return (
      <Card className="mb-6">
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold mb-2">Connecting to Live Stream</h3>
          <p className="text-gray-600">Establishing connection to the live event...</p>
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
                {tracks.length} camera{tracks.length !== 1 ? "s" : ""} •{" "}
                {participants.length} participant
                {participants.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <LivePresenceIndicator eventId={eventId} maxAvatars={6} />
              <ConnectionStatusBadge />

              {stripeAccountId && (
                <TippingModal
                  eventId={eventId}
                  hostAccountId={stripeAccountId}
                />
              )}
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setViewMode("grid");
                  setSelectedTrack(null);
                }}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === "single" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("single")}
                disabled={!selectedTrack}
              >
                Single
              </Button>
            </div>
          </div>

          {/* Main Video Display */}
          <div
            className="main-video-container relative bg-black rounded-lg overflow-hidden mb-4 aspect-video"
            onMouseMove={handleMouseMove}
          >
            <div className="w-full h-full">
              {viewMode === "grid" || !selectedTrack ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-full">
                  {tracks.map((track) => (
                    <div key={`${track.participant.identity}-${track.publication?.trackSid}`} className="relative">
                      <VideoTrack
                        trackRef={track}
                        className="w-full h-full object-cover rounded"
                      />
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-1 rounded">
                        {useStreamName(track.participant) || 'Streamer'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full h-full relative">
                  {/* Single track view */}
                  {(() => {
                    const track = tracks.find(
                      (t) => t.publication.trackSid === selectedTrack
                    );
                    if (!track) return (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <Camera className="h-12 w-12 text-white/50" />
                      </div>
                    );
                    return (
                      <div className="w-full h-full">
                        <VideoTrack
                          trackRef={track}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-sm px-2 rounded">
                          {useStreamName(track.participant) || 'Main Stream'}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Audio renderer */}
            <RoomAudioRenderer />

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

          {/* Chat Overlay */}
          <div className="mt-4">
            <InStreamChatOverlay
              eventId={eventId}
              isVisible={true}
              onVisibilityToggle={() => { }}
              isFullscreen={isFullscreen}
              showControls={showControls}
              showFullscreenToggle={false}
              eventHostId={eventHostId}
            />
          </div>

          {/* Stream Info */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>{participantCount} watching</span>
                </div>
                <div className="flex items-center gap-1">
                  <Monitor className="h-4 w-4 text-gray-500" />
                  <span>Quality: {currentQuality}</span>
                </div>
              </div>
              <div className="text-gray-500">Event: {eventName}</div>
            </div>
          </div>

          {/* Ad Banner */}
          <AdBanner eventId={eventId} placement="bottom" />
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegratedViewerInterface;
