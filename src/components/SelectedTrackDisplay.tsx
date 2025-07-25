import { VideoTrack, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";

interface SelectedTrackDisplayProps {
  trackId: string;
}

export function SelectedTrackDisplay({ trackId }: SelectedTrackDisplayProps) {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], { onlySubscribed: true });
  
  const selectedTrack = tracks.find(track => track.publication.trackSid === trackId);
  
  if (!selectedTrack) {
    return null;
  }
  
  return (
    <div className="w-full h-full">
      <VideoTrack trackRef={selectedTrack} />
    </div>
  );
}