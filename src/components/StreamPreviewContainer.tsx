import React, { useState, useMemo, useEffect } from "react";
import {
  useTracks,
  RoomAudioRenderer,
  StartAudio,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { TrackReference } from "@livekit/components-core";
import MainStreamPreview from "./MainStreamPreview";
import StreamerPreview from "./StreamerPreview";

interface StreamPreviewContainerProps {
  eventName: string;
  isLive: boolean;
  hasAccess: boolean;
  isLoggedIn: boolean;
  eventId: string;
  mediaUrls: string[];
}

const StreamPreviewContainer: React.FC<StreamPreviewContainerProps> = ({
  eventName,
  isLive,
  hasAccess,
  isLoggedIn,
  eventId,
  mediaUrls,
}) => {
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);

  // Get all video tracks from participants
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
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
  const selectedVideoTrack = videoTracks[selectedTrackIndex] || videoTracks[0];

  const audioTracks = useTracks(
    [{ source: Track.Source.Microphone, withPlaceholder: false }],
    {
      onlySubscribed: false,
    }
  );

  useEffect(() => {
    if (!audioTracks) return;
    if (selectedVideoTrack) {
      audioTracks.forEach((trackRef) => {
        // const videoTrack = tracks.find(
        //   (t) => t.publication.trackSid === selectedTrack
        // );
        const videoParticipant = selectedVideoTrack?.participant.identity;
        const audioParticipant = trackRef.participant.identity;
        if (
          videoParticipant &&
          audioParticipant &&
          videoParticipant === audioParticipant
        ) {
          if (trackRef.publication.track) {
            trackRef.publication.track.mediaStreamTrack.enabled = true;
          }
        } else {
          if (trackRef.publication.track) {
            trackRef.publication.track.mediaStreamTrack.enabled = false;
          }
        }
      });
    } else {
      audioTracks.forEach((trackRef) => {
        if (trackRef.publication.track) {
          trackRef.publication.track.mediaStreamTrack.enabled = false;
        }
      });
    }
  }, [audioTracks, tracks, selectedVideoTrack]);

  // If user is not logged in, show blurred preview
  if (!isLoggedIn) {
    return (
      <div  className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 relative">
        <div className="absolute inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center">
          <div className="text-center bg-white/90 p-6 rounded-lg shadow-lg">
            <div className="text-lg font-semibold mb-2">
              Sign In to Watch Live Stream
            </div>
            <div className="text-sm text-gray-600">
              Please sign in to access this live event
            </div>
          </div>
        </div>
        {/* Background content (blurred) */}
        <div className="absolute inset-0 -z-10">
          <div className="w-full h-full bg-gradient-to-br from-purple-200 to-pink-200 opacity-60" />
        </div>
      </div>
    );
  }

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
        mediaUrls={mediaUrls}
        track={selectedVideoTrack}
        eventName={eventName}
        isLive={isLive}
        setIsMuted={setIsMuted}
        isMuted={isMuted}
        eventId={eventId}
      />
      <StartAudio label="Start Audio" className="btn btn-primary" />
      {/* Streamer grid - only show if there are multiple streamers */}
      {videoTracks.length > 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-2">
          {videoTracks.map((track, index) => (
            <StreamerPreview //BUG: multiple streamer is not showing at stage page...
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
