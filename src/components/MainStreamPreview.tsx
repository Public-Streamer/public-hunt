import React, { useEffect, useState, useRef } from "react";
import {
  useTracks,
  VideoTrack,
  RoomAudioRenderer,
  AudioTrack,
  useChat,
} from "@livekit/components-react";
import {
  TrackReference,
  TrackReferencePlaceholder,
} from "@livekit/components-core";
import { Badge } from "@/components/ui/badge";
import { Video, Mic, MicOff, VolumeX, Volume2, Send, MessageCircle, X, Plane, Maximize, Minimize } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface MainStreamPreviewProps {
  track?: TrackReference;
  eventName: string;
  isLive: boolean;
  setIsMuted: any;
  isMuted: boolean;
}

const MainStreamPreview: React.FC<MainStreamPreviewProps> = ({
  track,
  eventName,
  isLive,
  setIsMuted,
  isMuted,
}) => {
  const { chatMessages, send } = useChat();
  console.log("Chat messages received:", chatMessages);
  console.log("Chat send function:", send);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [visibleMessages, setVisibleMessages] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Show only the latest 5 messages for better readability
  useEffect(() => {
    const latest = chatMessages.slice(-5);
    setVisibleMessages(latest);
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (chatMessage.trim() && send) {
      send(chatMessage.trim());
      setChatMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Fullscreen functionality
  const handleFullscreenToggle = () => {
    if (!videoContainerRef.current) return;

    if (!isFullscreen) {
      // Enter fullscreen
      if (videoContainerRef.current.requestFullscreen) {
        videoContainerRef.current.requestFullscreen();
      } else if ((videoContainerRef.current as any).webkitRequestFullscreen) {
        (videoContainerRef.current as any).webkitRequestFullscreen();
      } else if ((videoContainerRef.current as any).msRequestFullscreen) {
        (videoContainerRef.current as any).msRequestFullscreen();
      }
    } else {
      // Exit fullscreen
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

  // Handle fullscreen change events
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

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
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
  if (!track) {
    return (
      <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <Video className="h-12 w-12 sm:h-16 sm:w-16 lg:h-24 lg:w-24 text-purple-500" />
        </div>
        {isLive && (
          <Badge className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-red-600 text-white text-xs">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full mr-1 animate-pulse" />
            LIVE
          </Badge>
        )}
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/70 text-white px-2 py-1 rounded text-xs sm:text-sm">
          Multi-camera
        </div>
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
        className={`aspect-video relative bg-black ${isFullscreen ? 'fixed inset-0 z-50 aspect-auto' : ''}`}
        onMouseMove={handleMouseMove}
        onTouchStart={handleMouseMove}
      >
        <VideoTrack trackRef={track} className="w-full h-full object-cover" />

        {/* <AudioTrack trackRef={audioTracks[0]}/> */}

        {/* Live badge */}
        <Badge className={`absolute top-2 left-2 sm:top-4 sm:left-4 bg-red-600 text-white text-xs transition-opacity duration-300 ${isFullscreen && !showControls ? 'opacity-0' : 'opacity-100'}`}>
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full mr-1 animate-pulse" />
          LIVE
        </Badge>

        {/* Multi-camera indicator */}
        <div className={`absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/70 text-white px-2 py-1 rounded text-xs sm:text-sm transition-opacity duration-300 ${isFullscreen && !showControls ? 'opacity-0' : 'opacity-100'}`}>
          Multi-camera
        </div>

        {/* Fullscreen Toggle Button */}
        <Button
          onClick={handleFullscreenToggle}
          size="sm"
          variant="outline"
          className={`absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-black/80 border-white/40 text-white hover:bg-black/90 h-8 w-8 px-0 shadow-2xl backdrop-blur-sm transition-opacity duration-300 ${isFullscreen && !showControls ? 'opacity-0' : 'opacity-100'}`}
        >
          {isFullscreen ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
        </Button>

        {/* Chat Visibility Toggle (Audience Only) */}
        <Button
          onClick={() => setIsChatVisible(!isChatVisible)}
          size="sm"
          variant="outline"
          className={`absolute top-2 right-20 sm:top-4 sm:right-24 bg-black/80 border-white/40 text-white hover:bg-black/90 h-8 px-2 shadow-2xl backdrop-blur-sm transition-opacity duration-300 ${isFullscreen && !showControls ? 'opacity-0' : 'opacity-100'}`}
        >
          {isChatVisible ? <X className="h-3 w-3" /> : <MessageCircle className="h-3 w-3" />}
        </Button>

        {/* Chat Messages Overlay - Facebook Live Style */}
        {isChatVisible && visibleMessages.length > 0 && (
          <div
            ref={chatContainerRef}
            className={`absolute bottom-20 left-2 right-2 max-h-64 overflow-y-scroll space-y-2 pointer-events-auto transition-opacity duration-300 ${isFullscreen && !showControls ? 'opacity-0' : 'opacity-100'}`}
            style={{ 
              scrollBehavior: "smooth",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255, 255, 255, 0.3) transparent"
            }}
          >
            {visibleMessages.map((message, index) => {
              const opacity = Math.max(0.4, 1 - (visibleMessages.length - 1 - index) * 0.15);
              return (
                <div
                  key={`${message.id}-${index}`}
                  className="bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-lg max-w-80 shadow-lg animate-fade-in transition-opacity duration-300"
                  style={{
                    wordWrap: "break-word",
                    hyphens: "auto",
                    opacity: opacity,
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-blue-200 text-sm leading-tight">
                      {message.from?.name || message.from?.identity || "Anonymous"}
                    </span>
                    <span className="text-white text-sm leading-relaxed">{message.message}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Chat Input Overlay - Integrated Style */}
        {isChatVisible && (
          <div className={`absolute bottom-2 left-2 right-2 transition-opacity duration-300 ${isFullscreen && !showControls ? 'opacity-0' : 'opacity-100'}`}>
            <div className="relative bg-black/80 backdrop-blur-sm rounded-full border border-white/20">
              <Input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Send Message"
                className="w-full bg-transparent border-none text-white placeholder:text-white/60 h-12 text-sm rounded-full pl-5 pr-14 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!chatMessage.trim()}
                size="sm"
                className="absolute right-1 top-1 h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 border-none"
              >
                <Plane className="h-5 w-5 text-white rotate-45 transform transition-transform hover:scale-110" />
              </Button>
            </div>
          </div>
        )}

        {/* Participant info */}
        <div className="absolute top-12 left-2 bg-black/70 text-white px-3 py-1 rounded">
          <p className="text-sm font-medium">
            {participant?.name || participant?.identity}
          </p>
        </div>
      </div>
    </>
  );
};

export default MainStreamPreview;
