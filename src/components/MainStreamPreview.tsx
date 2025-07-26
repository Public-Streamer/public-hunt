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
import { Video, Mic, MicOff, VolumeX, Volume2, Send, MessageCircle, X } from "lucide-react";
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
  const [visibleMessages, setVisibleMessages] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [isChatVisible, setIsChatVisible] = useState(true);

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
      <div className="aspect-video relative bg-black">
        <VideoTrack trackRef={track} className="w-full h-full object-cover" />

        {/* <AudioTrack trackRef={audioTracks[0]}/> */}

        {/* Live badge */}
        <Badge className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-red-600 text-white text-xs">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full mr-1 animate-pulse" />
          LIVE
        </Badge>

        {/* Multi-camera indicator */}
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/70 text-white px-2 py-1 rounded text-xs sm:text-sm">
          Multi-camera
        </div>

        {/* Chat Visibility Toggle (Audience Only) */}
        <Button
          onClick={() => setIsChatVisible(!isChatVisible)}
          size="sm"
          variant="outline"
          className="absolute top-2 right-20 sm:top-4 sm:right-24 bg-black/80 border-white/40 text-white hover:bg-black/90 h-8 px-2 shadow-2xl backdrop-blur-sm"
        >
          {isChatVisible ? <X className="h-3 w-3" /> : <MessageCircle className="h-3 w-3" />}
        </Button>

        {/* Chat Messages Overlay - Facebook Live Style */}
        {isChatVisible && visibleMessages.length > 0 && (
          <div
            ref={chatContainerRef}
            className="absolute bottom-16 left-2 right-2 max-h-64 overflow-y-scroll space-y-2 pointer-events-auto"
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
                  className="bg-black/75 backdrop-blur-sm text-white px-3 py-2 rounded-2xl max-w-80 shadow-lg animate-fade-in transition-opacity duration-300"
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

        {/* Chat Input Overlay - Facebook Live Style */}
        {isChatVisible && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full p-1">
            <Input
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Write a comment..."
              className="flex-1 bg-white/10 border-none text-white placeholder:text-white/70 h-10 text-sm rounded-full px-4 focus-visible:ring-1 focus-visible:ring-white/50 focus-visible:ring-offset-0"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!chatMessage.trim()}
              size="sm"
              className="h-10 w-10 rounded-full bg-primary hover:bg-primary/80 flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
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
