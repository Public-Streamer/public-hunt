import React, { useState, useEffect, useRef } from 'react';
import { VideoTrackLazy } from '@/lib/livekitLazy';
import { Track } from 'livekit-client';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';

interface SingleTrackViewProps {
  trackRef: any;
  onFullscreenToggle?: () => void;
  isMuted?: boolean;
  onMuteToggle?: () => void;
  showControls?: boolean;
}

export const SingleTrackView: React.FC<SingleTrackViewProps> = ({
  trackRef,
  onFullscreenToggle,
  isMuted = false,
  onMuteToggle,
  showControls = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOverlayControls, setShowOverlayControls] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-hide controls when not hovering
  useEffect(() => {
    if (!showControls) return;

    const timer = setTimeout(() => {
      if (!isHovered) {
        setShowOverlayControls(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isHovered, showControls]);

  const handleFullscreen = () => {
    if (!videoRef.current) return;

    if (!isFullscreen) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if ((videoRef.current as any).webkitRequestFullscreen) {
        (videoRef.current as any).webkitRequestFullscreen();
      } else if ((videoRef.current as any).msRequestFullscreen) {
        (videoRef.current as any).msRequestFullscreen();
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
    onFullscreenToggle?.();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);

    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }

    if (newVolume === 0 && onMuteToggle) {
      onMuteToggle();
    } else if (newVolume > 0 && isMuted && onMuteToggle) {
      onMuteToggle();
    }
  };

  const handleMuteToggle = () => {
    if (onMuteToggle) {
      onMuteToggle();
    } else {
      // Local mute toggle
      if (videoRef.current) {
        videoRef.current.muted = !videoRef.current.muted;
      }
    }
  };

  const getTrackName = () => {
    try {
      if (trackRef?.participant?.metadata) {
        const metadata = JSON.parse(trackRef.participant.metadata);
        return metadata.streamName || trackRef.participant.name || trackRef.participant.identity;
      }
      return trackRef?.participant?.name || trackRef?.participant?.identity || 'Unknown Stream';
    } catch {
      return trackRef?.participant?.name || trackRef?.participant?.identity || 'Unknown Stream';
    }
  };

  return (
    <div
      className="w-full h-full relative bg-black flex items-center justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={() => setShowOverlayControls(true)}
    >
      {/* Video Element */}
      <div className="w-full h-full flex items-center justify-center">
        <VideoTrackLazy
          trackRef={trackRef}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Overlay Controls */}
      {(showControls && showOverlayControls) && (
        <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 rounded-lg p-3 flex items-center justify-between">
          {/* Stream Info */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-white text-sm font-medium truncate max-w-[150px]">
              {getTrackName()}
            </span>
          </div>

          {/* Volume Controls */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleMuteToggle}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 accent-white cursor-pointer"
            />
          </div>

          {/* Fullscreen Button */}
          <Button
            onClick={handleFullscreen}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* Quality Indicator */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 rounded-full px-2 py-1 text-xs text-white">
        HD
      </div>

      {/* Loading State */}
      {!trackRef && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p>Loading stream...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleTrackView;

