import React from 'react';
import { TrackReference } from '@livekit/components-react';
import { VideoTrack } from '@livekit/components-react';
import { Camera, Eye } from 'lucide-react';

interface CameraSelectorProps {
  tracks: TrackReference[];
  selectedTrack: string | null;
  onSelect: (trackId: string | null) => void;
}

const CameraSelector: React.FC<CameraSelectorProps> = ({ tracks, selectedTrack, onSelect }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-2 bg-black/50">
      {tracks.map((track, index) => {
        const isSelected = track.publication?.trackSid === selectedTrack;
        const participantName = track.participant.identity.split('-')[0] || 'Streamer';

        return (
          <button
            key={`${track.participant.identity}-${track.publication?.trackSid}`}
            onClick={() => onSelect(track.publication?.trackSid || null)}
            className={`relative aspect-video rounded overflow-hidden cursor-pointer border-2 ${
              isSelected ? 'border-purple-500' : 'border-transparent hover:border-white/30'
            }`}
          >
            <VideoTrack
              trackRef={track}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
              {participantName}
            </div>
            {isSelected && (
              <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                <Eye className="h-6 w-6 text-white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default CameraSelector;
