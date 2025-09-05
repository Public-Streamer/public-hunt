import React from 'react';
import { Video, Users, Monitor, Play, ScreenShare } from 'lucide-react';
import { TrackReference } from '@livekit/components-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface StreamSelectorProps {
  tracks: TrackReference[];
  selectedTrack: string | null;
  onSelect: (trackId: string | null) => void;
}

const StreamSelector: React.FC<StreamSelectorProps> = ({
  tracks,
  selectedTrack,
  onSelect,
}) => {
  if (tracks.length <= 1) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Stream Views</h3>
          <Button
            variant={selectedTrack === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelect(null)}
          >
            Show All
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {tracks.map((track) => (
            <Button
              key={track.publication.trackSid}
              variant={
                selectedTrack === track.publication.trackSid
                  ? 'default'
                  : 'outline'
              }
              className="h-auto p-3 flex-col gap-2"
              onClick={() => onSelect(track.publication.trackSid)}
            >
              <div className="relative">
                <div className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center">
                  {track.publication.source === 'screen_share' ? (
                    <ScreenShare className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Video className="h-4 w-4 text-gray-400" />
                  )}
                </div>

                {/* Live indicator */}
                <Badge
                  className={`absolute -top-1 -right-1 text-white text-xs px-1 ${
                    track.publication.source === 'screen_share'
                      ? 'bg-blue-600'
                      : 'bg-red-600'
                  }`}
                >
                  {track.publication.source === 'screen_share'
                    ? 'SCREEN'
                    : 'LIVE'}
                </Badge>
              </div>

              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {track.participant.name?.substring(0, 2).toUpperCase() ||
                      'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm truncate">
                  {track.participant.name || 'Anonymous'}
                  {track.publication.source === 'screen_share' && ' (Screen)'}
                </div>
              </div>
            </Button>
          ))}
        </div>

        <div className="mt-3 text-sm text-gray-600 text-center">
          Click on a stream to view it fullscreen, or "Show All" to see the grid
          view
        </div>
      </CardContent>
    </Card>
  );
};

export default StreamSelector;
