
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Video, Users, VolumeX, Monitor } from 'lucide-react';
import { TrackReference, VideoTrack, useRoomContext } from '@livekit/components-react';
import { Track } from 'livekit-client';

interface MultiCameraGridProps {
  tracks: TrackReference[];
  onTrackSelect: (trackId: string | null) => void;
  selectedTrack: string | null;
}

const MultiCameraGrid: React.FC<MultiCameraGridProps> = ({
  tracks,
  onTrackSelect,
  selectedTrack
}) => {
  const room = useRoomContext();

  // Debug logging for track verification
  React.useEffect(() => {
    console.log(`[MultiCameraGrid] Rendering ${tracks.length} tracks in room: ${room?.name}`);
    tracks.forEach((track, index) => {
      console.log(`[MultiCameraGrid] Track ${index}:`, {
        participantIdentity: track.participant.identity,
        participantName: track.participant.name,
        trackSid: track.publication.trackSid,
        roomName: room?.name
      });
    });
  }, [tracks, room]);

  if (tracks.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white">
        <div className="text-center">
          <Video className="h-16 w-16 mx-auto mb-4 text-white/50" />
          <p className="text-white/70">No active streams in this event</p>
          {room && (
            <p className="text-white/50 text-sm mt-2">Room: {room.name}</p>
          )}
        </div>
      </div>
    );
  }

  // Single track - show full screen
  if (tracks.length === 1) {
    const track = tracks[0];
    return (
      <div className="w-full h-full relative">
        <VideoTrack 
          trackRef={track} 
          className="w-full h-full object-cover"
        />
        
        {/* Track Info Overlay */}
        <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {track.participant.name?.substring(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">
            {track.participant.name || track.participant.identity || 'Anonymous'}
          </span>
        </div>
        
        {/* Room Info Debug Overlay */}
        {room && (
          <div className="absolute top-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-xs">
            Room: {room.name}
          </div>
        )}
      </div>
    );
  }

  // Multiple tracks - show grid
  const getGridCols = (count: number) => {
    if (count <= 2) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-2 md:grid-cols-3';
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
  };

  return (
    <div className={`grid ${getGridCols(tracks.length)} gap-2 w-full h-full p-2`}>
      {tracks.map((track) => (
        <Card
          key={track.publication.trackSid}
          className={`relative overflow-hidden cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-primary ${
            selectedTrack === track.publication.trackSid
              ? 'ring-2 ring-primary'
              : ''
          }`}
          onClick={() => onTrackSelect(track.publication.trackSid)}
        >
          <div className="aspect-video bg-gray-900 relative">
            <VideoTrack 
              trackRef={track} 
              className="w-full h-full object-cover"
            />
            
            {/* Live Badge */}
            <Badge className="absolute top-2 left-2 bg-red-600 text-white text-xs">
              <div className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse" />
              LIVE
            </Badge>
            
            {/* Audio Status */}
            <div className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded">
              <VolumeX className="h-3 w-3" />
            </div>
            
            {/* Track Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {track.participant.name?.substring(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-white text-sm truncate">
                  {track.participant.name || track.participant.identity || 'Anonymous'}
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
      
      {/* Debug Info Footer */}
      {room && (
        <div className="col-span-full text-center text-xs text-white/50 mt-2">
          Room: {room.name} | Tracks: {tracks.length}
        </div>
      )}
    </div>
  );
};

export default MultiCameraGrid;
