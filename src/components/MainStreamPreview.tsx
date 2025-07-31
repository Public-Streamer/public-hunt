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
import { supabase } from "@/integrations/supabase/client";
import { useAppContext } from "@/contexts/AppContext";

interface MainStreamPreviewProps {
  track?: TrackReference;
  eventName: string;
  isLive: boolean;
  setIsMuted: any;
  isMuted: boolean;
  eventId: string;
}

const MainStreamPreview: React.FC<MainStreamPreviewProps> = ({
  track,
  eventName,
  isLive,
  setIsMuted,
  isMuted,
  eventId,
}) => {
  const { user } = useAppContext();
  const { chatMessages, send } = useChat();
  console.log("Chat messages received:", chatMessages);
  console.log("Chat send function:", send);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoElementRef = useRef<HTMLVideoElement>(null);
  const [visibleMessages, setVisibleMessages] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  // Detect iOS Safari
  const isIOSSafari = () => {
    const userAgent = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(userAgent) && 
           (/Safari/.test(userAgent) || /CriOS/.test(userAgent)) &&
           !(window as any).MSStream;
  };

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

  const handleSendMessage = async () => {
    if (chatMessage.trim() && send) {
      const messageContent = chatMessage.trim();
      
      // Send via LiveKit (real-time)
      send(messageContent);
      setChatMessage("");

      // Persist to Supabase (parallel, non-blocking)
      try {
        await supabase.from('event_chat_messages').insert([{
          event_id: eventId,
          user_id: user?.id ?? null,
          username: user?.email || 'unknown',
          display_name: user?.email?.split('@')[0] || 'Anonymous',
          profile_picture_url: null,
          message: messageContent,
          message_type: 'user'
        }]);
      } catch (error) {
        console.error('Failed to persist chat message to Supabase:', error);
        // Don't block the user experience - LiveKit chat continues
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Enhanced fullscreen functionality with iOS Safari support
  const handleFullscreenToggle = () => {
    // Find the actual video element within the VideoTrack component
    const findVideoElement = () => {
      if (videoElementRef.current) return videoElementRef.current;
      
      // Look for video element within the container
      const container = videoContainerRef.current;
      if (container) {
        const videoEl = container.querySelector('video');
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
          console.log('iOS video fullscreen failed, falling back to container');
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
      if (isIOSSafari() && videoElement && (videoElement as any).webkitExitFullscreen) {
        try {
          (videoElement as any).webkitExitFullscreen();
          setIsFullscreen(false);
          setShowControls(true);
          return;
        } catch (error) {
          console.log('iOS video exit fullscreen failed');
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
      const videoElement = videoElementRef.current || 
        videoContainerRef.current?.querySelector('video');
      
      if (videoElement && isIOSSafari()) {
        // Check if video is in fullscreen mode
        const isVideoFullscreen = (videoElement as any).webkitDisplayingFullscreen;
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
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    // iOS video fullscreen events
    const videoElement = videoContainerRef.current?.querySelector('video');
    if (videoElement && isIOSSafari()) {
      videoElement.addEventListener('webkitbeginfullscreen', handleVideoFullscreenChange);
      videoElement.addEventListener('webkitendfullscreen', handleVideoFullscreenChange);
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      
      if (videoElement && isIOSSafari()) {
        videoElement.removeEventListener('webkitbeginfullscreen', handleVideoFullscreenChange);
        videoElement.removeEventListener('webkitendfullscreen', handleVideoFullscreenChange);
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
        <Badge className={`absolute top-2 left-2 sm:top-4 sm:left-4 bg-red-600 text-white text-xs transition-opacity duration-300 z-50 ${isFullscreen && !showControls ? 'opacity-0' : 'opacity-100'}`}>
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full mr-1 animate-pulse" />
          LIVE
        </Badge>

        {/* Multi-camera indicator */}
        <div className={`absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/70 text-white px-2 py-1 rounded text-xs sm:text-sm transition-opacity duration-300 ${isFullscreen && !showControls ? 'opacity-0' : 'opacity-100'}`}>
          Multi-camera
        </div>


        {/* Chat Messages Overlay - Facebook Live Style */}
        {isChatVisible && visibleMessages.length > 0 && (
          <div
            ref={chatContainerRef}
            className={`flex flex-col justify-end absolute bottom-0  h-full  w-2/4 overflow-y-scroll space-y-1 sm:space-y-3 pointer-events-auto transition-opacity duration-300 bg-[linear-gradient(90deg,_rgba(0,60,84,1)_0%,_rgba(87,199,133,0)_99%)] ${isFullscreen && !showControls ? 'opacity-0' : 'opacity-100  z-0'}`}
            style={{ 
              scrollBehavior: "smooth",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255, 255, 255, 0.3) transparent"
            }}
          >
            <div className="pb-16">
            {visibleMessages.map((message, index) => {
              const opacity = Math.max(0.4, 1 - (visibleMessages.length - 1 - index) * 0.15);
              return (
                <div
                  key={`${message.id}-${index}`}
                  className=" py-2  text-white px-2  sm:px-3  rounded-lg max-w-[45vw] sm:max-w-xs md:max-w-sm shadow-lg animate-fade-in transition-opacity duration-300 "
                  style={{
                    wordWrap: "break-word",
                    hyphens: "auto",
                    opacity: opacity,
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-blue-200 text-xs sm:text-sm leading-tight truncate max-w-full">
                      {message.from?.name || message.from?.identity || "Anonymous"}
                    </span>
                    <span className="text-white text-xs sm:text-sm leading-relaxed break-words">
                      {message.message}
                    </span>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}

        {/* Unified Bottom Control Bar */}
        <div className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 mt-3 z-20 ${isFullscreen && !showControls ? 'opacity-0' : 'opacity-100'}`}>
          <div className="flex items-center gap-2  rounded-lg p-2 shadow-lg">
            {/* Chat Input - Left Side */}
            {isChatVisible && (
              <div className="flex-1 relative max-w-xs ">
                <Input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Send Message"
                  className="w-full bg-black/20 backdrop-blur-sm    text-white placeholder:text-white/80 h-2 md:h-10 text-xs rounded-lg pl-4 pr-10 focus-visible:ring-1 focus-visible:ring-white/40 focus-visible:ring-offset-0 focus-visible:border-white/40"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim()}
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 rounded-md bg-white/20 hover:bg-white/30 transition-all duration-200 border-none p-0"
                >
                  <Plane className="h-4 w-4 text-white rotate-45" />
                </Button>
              </div>
            )}
            
            {/* Control Buttons - Right Side */}
            <div className={`flex items-center gap-2 
               ${!isChatVisible ? 'flex-1 justify-start' : ''}`}>
              {/* Chat Toggle Button */}
              <Button
                onClick={() => setIsChatVisible(!isChatVisible)}
                size="sm"
                variant="outline"
                className="bg-black/60 border-white/40 text-white hover:bg-black/80 h-5 px-3 shadow-lg backdrop-blur-sm"
              >
                {isChatVisible ? <X className="h-4 w-4 mr-1" /> : <MessageCircle className="h-4 w-4 mr-1" />}
                <span className="text-xs hidden sm:inline">
                  {isChatVisible ? 'Hide Chat' : 'Show Chat'}
                </span>
              </Button>

              {/* Fullscreen Toggle Button */}
              <Button
                onClick={handleFullscreenToggle}
                size="sm"
                variant="outline"
                className="bg-black/60 border-white/40 text-white hover:bg-black/80 h-5 w-10 px-0 shadow-lg backdrop-blur-sm"
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Participant info */}
        <div className="absolute bottom-2 right-2 flex justify-end items-start z-10">
          <p className="flex-1 text-xs md:text-sm text-white text-shadow-lg
           truncate font-medium bg-black/20 px-2 py-1 rounded backdrop-blur-sm max-w-[150px]">
            {participant?.name || participant?.identity}
          </p>
        </div>
      </div>
    </>
  );
};

export default MainStreamPreview;
