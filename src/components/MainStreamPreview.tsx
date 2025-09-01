import React, { useEffect, useState, useRef } from "react";
import { VideoTrackLazy } from "@/lib/livekitLazy";
import type { TrackReference } from "@livekit/components-core";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { useStreamingControls } from "@/hooks/useStreamingControls";
import MediaBackground from "./MediaBackground";
import InStreamChatOverlay from "./InStreamChatOverlay";
import { useCameraName } from "@/hooks/useCameraName";

interface MainStreamPreviewProps {
  track?: TrackReference;
  eventName: string;
  isLive: boolean;
  // Keep compatibility with callers; not used internally
  setIsMuted?: React.Dispatch<React.SetStateAction<boolean>>;
  isMuted?: boolean;
  eventId: string;
  mediaUrls: string[];
  eventHostId?: string;
}

const MainStreamPreview: React.FC<MainStreamPreviewProps> = ({
  track,
  eventName,
  isLive,
  // compatibility props (unused)
  setIsMuted,
  isMuted,
  eventId,
  mediaUrls,
  eventHostId,
}) => {
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoElementRef = useRef<HTMLVideoElement>(null);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);
  const controls = useStreamingControls(eventId);
  const [isHome, setIsHome] = useState(false);
  const { cameraName } = useCameraName();

  useEffect(() => {
    if (window.location.pathname === "/") {
      setIsHome(true);
    } else {
      setIsHome(false);
    }
  }, []);

  // Detect iOS Safari
  const isIOSSafari = () => {
    const userAgent = navigator.userAgent;
    return (
      /iPad|iPhone|iPod/.test(userAgent) &&
      (/Safari/.test(userAgent) || /CriOS/.test(userAgent)) &&
      !(window as any).MSStream
    );
  };

  // Enhanced fullscreen functionality with iOS Safari support
  const handleFullscreenToggle = () => {
    // Find the actual video element within the VideoTrack component
    const findVideoElement = () => {
      if (videoElementRef.current) return videoElementRef.current;

      // Look for video element within the container
      const container = videoContainerRef.current;
      if (container) {
        const videoEl = container.querySelector("video");
        if (videoEl) {
          videoElementRef.current = videoEl;
          return videoEl;
        }
      }
      return null;
    };

    const videoElement = findVideoElement();

    if (!isFullscreen) {
      // Enter fullscreen
      if (isIOSSafari() && videoElement) {
        // iOS Safari: Use video element's webkitEnterFullscreen
        try {
          if ((videoElement as any).webkitEnterFullscreen) {
            (videoElement as any).webkitEnterFullscreen();
            setIsFullscreen(true);
            resetHideTimer();
            return;
          }
        } catch (error) {
          console.log("iOS video fullscreen failed, falling back to container");
        }
      }

      // Standard fullscreen API (works on Android Chrome and desktop)
      const element = videoElement || videoContainerRef.current;
      if (element) {
        if (element.requestFullscreen) {
          element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          (element as any).webkitRequestFullscreen();
        } else if ((element as any).msRequestFullscreen) {
          (element as any).msRequestFullscreen();
        }
      }
    } else {
      // Exit fullscreen
      if (
        isIOSSafari() &&
        videoElement &&
        (videoElement as any).webkitExitFullscreen
      ) {
        try {
          (videoElement as any).webkitExitFullscreen();
          setIsFullscreen(false);
          setShowControls(true);
          return;
        } catch (error) {
          console.log("iOS video exit fullscreen failed");
        }
      }

      // Standard exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  // Auto-hide controls in fullscreen
  const resetHideTimer = () => {
    setShowControls(true);
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    if (isFullscreen) {
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  // Handle fullscreen change events including iOS Safari video events
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
        if (hideControlsTimer.current) {
          clearTimeout(hideControlsTimer.current);
        }
      } else {
        resetHideTimer();
      }
    };

    // iOS Safari video fullscreen events
    const handleVideoFullscreenChange = () => {
      const videoElement =
        videoElementRef.current ||
        videoContainerRef.current?.querySelector("video");

      if (videoElement && isIOSSafari()) {
        // Check if video is in fullscreen mode
        const isVideoFullscreen = (videoElement as any)
          .webkitDisplayingFullscreen;
        setIsFullscreen(!!isVideoFullscreen);

        if (!isVideoFullscreen) {
          setShowControls(true);
          if (hideControlsTimer.current) {
            clearTimeout(hideControlsTimer.current);
          }
        } else {
          resetHideTimer();
        }
      }
    };

    // Standard fullscreen events
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    // iOS video fullscreen events
    const videoElement = videoContainerRef.current?.querySelector("video");
    if (videoElement && isIOSSafari()) {
      videoElement.addEventListener(
        "webkitbeginfullscreen",
        handleVideoFullscreenChange
      );
      videoElement.addEventListener(
        "webkitendfullscreen",
        handleVideoFullscreenChange
      );
    }

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "msfullscreenchange",
        handleFullscreenChange
      );

      if (videoElement && isIOSSafari()) {
        videoElement.removeEventListener(
          "webkitbeginfullscreen",
          handleVideoFullscreenChange
        );
        videoElement.removeEventListener(
          "webkitendfullscreen",
          handleVideoFullscreenChange
        );
      }

      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
    };
  }, [isFullscreen]);

  // Mouse movement handler for auto-hide
  const handleMouseMove = () => {
    if (isFullscreen) {
      resetHideTimer();
    }
  };

  const cameraOff = "/cameraOff.jpg";
  const bgUrl = mediaUrls?.[0] ? mediaUrls[0] : cameraOff;
  if (!track) {
    return (
      <div className="relative aspect-video bg-gradient-to-br from-purple-100 to-pink-100">
        <MediaBackground
          mediaUrls={[cameraOff]}
          className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100"
        />
        <div className="absolute inset-0 flex items-end justify-center">
          <h1 className="p-10 text-2xl font-thin text-white">
            Camera/Screen is Off
          </h1>
        </div>
        {isLive && (
          <Badge className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-red-600 text-white text-xs">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white mr-1 animate-pulse" />
            LIVE
          </Badge>
        )}
      </div>
    );
  }

  const participant = track.participant;

  // const isAudioEnabled =
  //   audioTracks
  //     ?.map((trackRef) => {
  //       if (trackRef.publication?.track) {
  //         return trackRef.publication.track.mediaStreamTrack.enabled;
  //       }
  //       return false;
  //     })
  //     ?.includes(true) ?? false;

  // console.log(isAudioEnabled);

  // const handleVolumeToggle = () => {
  //   setIsMuted(!isMuted);
  //   // Mute/unmute audio tracks
  //   audioTracks?.forEach((trackRef) => {
  //     if (trackRef.publication?.track) {
  //       trackRef.publication.track.mediaStreamTrack.enabled = isMuted;
  //     }
  //   });
  // };

  return (
    <>
      <div
        ref={videoContainerRef}
        className={`aspect-video relative bg-black ${
          isFullscreen ? "fixed inset-0 z-50 aspect-auto" : ""
        }`}
        onMouseMove={handleMouseMove}
        onTouchStart={handleMouseMove}
      >
        <VideoTrackLazy
          trackRef={track}
          className="w-full h-full object-cover"
        />

        {/* <AudioTrack trackRef={audioTracks[0]}/> */}

        {/* Live badge */}
        <Badge
          className={`absolute top-2 left-2 sm:top-4 sm:left-4 bg-red-600 text-white text-xs transition-opacity duration-300 z-50 ${
            isFullscreen && !showControls ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full mr-1 animate-pulse" />
          LIVE
        </Badge>

        {/* Multi-camera indicator */}

        {/* Viewer Count */}
        <div className="absolute top-2 right-2">
          <Badge
            variant="secondary"
            className="flex items-center gap-1 text-xs"
          >
            <Eye className="h-3 w-3" />
            {controls?.participantCount - 1}
          </Badge>
        </div>

        {!isHome && (
          <InStreamChatOverlay
            eventId={eventId}
            isVisible={isChatVisible}
            onVisibilityToggle={() => setIsChatVisible(!isChatVisible)}
            isFullscreen={isFullscreen}
            showControls={showControls}
            showFullscreenToggle={true}
            onFullscreenToggle={handleFullscreenToggle}
            eventHostId={eventHostId}
          />
        )}

        {/* Participant info */}
        <div className="absolute bottom-2 right-2 flex justify-end items-start z-10">
          <Badge variant="default">{cameraName}</Badge>
        </div>
      </div>
    </>
  );
};

export default MainStreamPreview;
