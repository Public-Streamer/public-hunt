import React, { useEffect, useState } from "react";
import { useTracks, VideoTrack } from "@livekit/components-react";
import {
  TrackReference,
  TrackReferencePlaceholder,
} from "@livekit/components-core";
import { Badge } from "@/components/ui/badge";
import { Video, Mic, MicOff, VolumeX, Volume2 } from "lucide-react";
import { Button } from "./ui/button";

interface MainStreamPreviewProps {
  track?: TrackReference;
  eventName: string;
  isLive: boolean;
  audioTracks?: TrackReferencePlaceholder[];
}

const MainStreamPreview: React.FC<MainStreamPreviewProps> = ({
  track,
  eventName,
  isLive,
  audioTracks,
}) => {
  const [isMuted, setIsMuted] = useState(false);
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

  const isAudioEnabled =
    audioTracks
      ?.map((trackRef) => {
        if (trackRef.publication.track) {
          return trackRef.publication.track.mediaStreamTrack.enabled;
        }
      })
      ?.includes(true) ?? false;

  console.log(isAudioEnabled);

  const handleVolumeToggle = () => {
    setIsMuted(!isMuted);
    // Mute/unmute audio tracks
    audioTracks?.forEach((trackRef) => {
      if (trackRef.publication.track) {
        trackRef.publication.track.mediaStreamTrack.enabled = isMuted;
      }
    });
  };

  return (
    <div className="aspect-video relative bg-black">
      <VideoTrack trackRef={track} className="w-full h-full object-cover" />

      {/* Live badge */}
      <Badge className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-red-600 text-white text-xs">
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full mr-1 animate-pulse" />
        LIVE
      </Badge>

      {/* Multi-camera indicator */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/70 text-white px-2 py-1 rounded text-xs sm:text-sm">
        Multi-camera
      </div>

      {/* Audio indicator */}
      <div className="absolute bottom-2 right-2 bg-black/70 text-white p-2 rounded flex items-center gap-2">
        <button onClick={handleVolumeToggle}>
          {!isMuted ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
        </button>

        <div>
          {isAudioEnabled ? (
            <Mic className="h-4 w-4" />
          ) : (
            <MicOff className="h-4 w-4" />
          )}
        </div>
      </div>

      {/* Participant info */}
      <div className="absolute bottom-2 left-2 bg-black/70 text-white px-3 py-1 rounded">
        <p className="text-sm font-medium">
          {participant?.name || participant?.identity}
        </p>
      </div>
    </div>
  );
};

export default MainStreamPreview;
