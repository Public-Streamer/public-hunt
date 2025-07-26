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
import { Video, Mic, MicOff, VolumeX, Volume2, Send } from "lucide-react";
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
  console.log(chatMessages);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [visibleMessages, setVisibleMessages] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState("");

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

        {/* Chat Messages Overlay */}
        {visibleMessages.length > 0 && (
          <div
            ref={chatContainerRef}
            className="absolute bottom-16 left-2 right-2 max-h-48 overflow-y-auto space-y-1 pointer-events-none"
          >
            {visibleMessages.map((message, index) => (
              <div
                key={`${message.id}-${index}`}
                className="bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-lg max-w-xs animate-fade-in"
                style={{
                  wordWrap: "break-word",
                  hyphens: "auto",
                }}
              >
                <span className="font-semibold text-blue-300">
                  {message.from?.name || message.from?.identity || "Anonymous"}:
                </span>{" "}
                <span className="text-white">{message.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Chat Input Overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
          <Input
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Say something..."
            className="flex-1 bg-black/60 border-white/20 text-white placeholder:text-white/60 h-8 text-sm"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!chatMessage.trim()}
            size="sm"
            className="h-8 px-3 bg-primary hover:bg-primary/80"
          >
            <Send className="h-3 w-3" />
          </Button>
        </div>

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
