import React, { useState, useMemo } from "react";
import { useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { TrackReference } from "@livekit/components-core";
import MainStreamPreview from "./MainStreamPreview";
import StreamerPreview from "./StreamerPreview";

interface StreamPreviewContainerProps {
  eventName: string;
  isLive: boolean;
  hasAccess: boolean;
}

const StreamPreviewContainer: React.FC<StreamPreviewContainerProps> = ({
  eventName,
  isLive,
  hasAccess,
}) => {
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<number>(0);

  // Get all video tracks from participants
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
      { source: Track.Source.Microphone, withPlaceholder: false },
    ],
    {
      onlySubscribed: false,
      updateOnlyOn: [],
    }
  );

  // Filter tracks to only include actual video tracks from participants
  const videoTracks = useMemo(() => {
    return tracks
      .filter(
        (track) =>
          track.publication &&
          track.publication.track &&
          track.publication.kind === "video" &&
          track.participant.identity !== "viewer"
      )
      .filter(
        (track): track is TrackReference => track.publication !== undefined
      );
  }, [tracks]);

  // Get the currently selected track
  const selectedTrack = videoTracks[selectedTrackIndex] || videoTracks[0];

  const audioTracks = useMemo(() => {
    return tracks
      .filter(
        (track) =>
          track.publication &&
          track.publication.track &&
          track.publication.kind === "audio" &&
          track.participant.identity !== "viewer"
      )
      .filter(
        (track): track is TrackReference => track.publication !== undefined
      );
  }, [tracks]);

  if (!hasAccess) {
    return (
      <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">
              Live Stream Access Required
            </div>
            <div className="text-sm text-gray-600">
              Purchase a ticket to watch this live event
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main preview area */}
      <MainStreamPreview
        track={selectedTrack}
        eventName={eventName}
        isLive={isLive}
        audioTracks={audioTracks}
      />

      {/* Streamer grid - only show if there are multiple streamers */}
      {videoTracks.length > 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-2">
          {videoTracks.map((track, index) => (
            <StreamerPreview
              key={`${track.participant.identity}-${track.publication?.trackSid}`}
              track={track}
              isSelected={index === selectedTrackIndex}
              onClick={() => setSelectedTrackIndex(index)}
              className="h-20 sm:h-24"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StreamPreviewContainer;
