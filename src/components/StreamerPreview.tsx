import React from "react";
import { VideoTrack } from "@livekit/components-react";
import { TrackReference } from "@livekit/components-core";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff } from "lucide-react";

interface StreamerPreviewProps {
  track: TrackReference;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

const StreamerPreview: React.FC<StreamerPreviewProps> = ({
  track,
  isSelected = false,
  onClick,
  className = "",
}) => {
  const participant = track.participant;
  const isAudioEnabled = participant?.isMicrophoneEnabled ?? false;

  return (
    <Card 
      className={`relative overflow-hidden cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'ring-2 ring-primary shadow-lg scale-105' 
          : 'hover:shadow-md hover:scale-102'
      } ${className}`}
      onClick={onClick}
    >
      <div className="aspect-video relative">
        <VideoTrack 
          trackRef={track} 
          className="w-full h-full object-cover"
        />
        
        {/* Live badge */}
        <Badge className="absolute top-2 left-2 bg-red-600 text-white text-xs">
          <div className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse" />
          LIVE
        </Badge>

        {/* Audio indicator */}
        <div className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded">
          {isAudioEnabled ? (
            <Mic className="h-3 w-3" />
          ) : (
            <MicOff className="h-3 w-3" />
          )}
        </div>

        {/* Participant info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <p className="text-white text-sm font-medium truncate">
            {participant?.name || participant?.identity}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default StreamerPreview;