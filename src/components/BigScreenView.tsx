import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Video, Grid3X3, ScreenShare, VolumeX } from 'lucide-react';
import { TrackReference, VideoTrack } from '@livekit/components-react';
import { Track } from 'livekit-client';

interface BigScreenViewProps {
  tracks: TrackReference[];
  selectedTrack: string | null;
  onTrackSelect: (trackId: string | null) => void;
  onSwitchToGrid: () => void;
}

const BigScreenView: React.FC<BigScreenViewProps> = ({
  tracks,
  selectedTrack,
  onTrackSelect,
  onSwitchToGrid
}) => {
  if (tracks.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white">
        <div className="text-center">
          <Video className="h-16 w-16 mx-auto mb-4 text-white/50" />
          <p className="text-white/70">No active streams</p>
        </div>
      </div>
    );
  }

  // Get the selected track or default to first track
  const currentTrack = selectedTrack 
    ? tracks.find(t => t.publication.trackSid === selectedTrack)
    : tracks[0];

  if (!currentTrack) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white">
        <div className="text-center">
          <Video className="h-16 w-16 mx-auto mb-4 text-white/50" />
          <p className="text-white/70">Track not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Main Video Display */}
      <div className="flex-1 relative bg-black rounded-lg overflow-hidden mb-3">
        <VideoTrack 
          trackRef={currentTrack} 
          className="w-full h-full object-cover"
        />
        
        {/* Top Right Controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onSwitchToGrid}
            className="bg-black/70 text-white hover:bg-black/90 border-white/20"
          >
            <Grid3X3 className="h-4 w-4 mr-2" />
            {tracks.length > 1 ? 'Multi-camera' : 'Back to Grid'}
          </Button>
        </div>

        {/* Track Info Overlay */}
        <div className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg flex items-center gap-3">
          {currentTrack.publication.source === Track.Source.ScreenShare ? (
            <ScreenShare className="h-5 w-5 text-blue-400" />
          ) : (
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-sm bg-primary text-primary-foreground">
                {currentTrack.participant.name?.substring(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          )}
          <div>
            <div className="font-medium">
              {currentTrack.participant.name || 'Anonymous'}
            </div>
            <div className="text-sm text-white/70">
              {currentTrack.publication.source === Track.Source.ScreenShare ? 'Screen Share' : 'Camera'}
            </div>
          </div>
        </div>

        {/* Live Badge */}
        <Badge className={`absolute top-4 left-4 text-white ${
          currentTrack.publication.source === Track.Source.ScreenShare 
            ? 'bg-blue-600' 
            : 'bg-red-600'
        }`}>
          <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
          {currentTrack.publication.source === Track.Source.ScreenShare ? 'SCREEN' : 'LIVE'}
        </Badge>
      </div>

      {/* Track Thumbnails Row - only show if more than one track */}
      {tracks.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tracks.map((track) => (
            <Card
              key={track.publication.trackSid}
              className={`flex-shrink-0 w-32 cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-primary ${
                selectedTrack === track.publication.trackSid || 
                (!selectedTrack && track === tracks[0])
                  ? 'ring-2 ring-primary'
                  : ''
              }`}
              onClick={() => onTrackSelect(track.publication.trackSid)}
            >
              <div className="aspect-video bg-gray-900 relative rounded overflow-hidden">
                <VideoTrack 
                  trackRef={track} 
                  className="w-full h-full object-cover"
                />
                
                {/* Mini Live Badge */}
                <Badge className={`absolute top-1 left-1 text-white text-xs ${
                  track.publication.source === Track.Source.ScreenShare 
                    ? 'bg-blue-600' 
                    : 'bg-red-600'
                }`}>
                  <div className="w-1 h-1 bg-white rounded-full mr-1 animate-pulse" />
                  {track.publication.source === Track.Source.ScreenShare ? 'SCR' : 'CAM'}
                </Badge>
                
                {/* Audio Status */}
                <div className="absolute top-1 right-1 bg-black/70 text-white p-0.5 rounded">
                  <VolumeX className="h-2 w-2" />
                </div>
                
                {/* Participant Name */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                  <div className="text-white text-xs truncate">
                    {track.participant.name || 'Anonymous'}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BigScreenView;