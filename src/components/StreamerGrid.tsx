import React from 'react';
import StreamerThumbnail from './StreamerThumbnail';

interface StreamerGridProps {
  eventId: string;
  hasPaid: boolean;
}

const StreamerGrid: React.FC<StreamerGridProps> = ({ eventId, hasPaid }) => {
  // Mock streamer data based on eventId
  const getStreamers = (id: string) => {
    const baseStreamers = [
      {
        id: '1',
        name: 'MainCam_Pro',
        role: 'Main Camera',
        viewers: 1250,
        isLive: true,
        thumbnail: '/placeholder.svg'
      },
      {
        id: '2',
        name: 'SideAngle_View',
        role: 'Side Angle',
        viewers: 890,
        isLive: true,
        thumbnail: '/placeholder.svg'
      },
      {
        id: '3',
        name: 'CloseUp_Shot',
        role: 'Close-up',
        viewers: 670,
        isLive: true,
        thumbnail: '/placeholder.svg'
      },
      {
        id: '4',
        name: 'Crowd_Cam',
        role: 'Crowd View',
        viewers: 445,
        isLive: true,
        thumbnail: '/placeholder.svg'
      },
      {
        id: '5',
        name: 'Backstage_Access',
        role: 'Backstage',
        viewers: 320,
        isLive: true,
        thumbnail: '/placeholder.svg'
      },
      {
        id: '6',
        name: 'Aerial_View',
        role: 'Drone Camera',
        viewers: 280,
        isLive: true,
        thumbnail: '/placeholder.svg'
      }
    ];
    
    // Modify based on eventId to simulate different events
    const eventNum = parseInt(id) || 1;
    return baseStreamers.map(streamer => ({
      ...streamer,
      viewers: streamer.viewers + (eventNum * 10)
    }));
  };

  const streamers = getStreamers(eventId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Live Streams ({streamers.length})</h2>
        {!hasPaid && (
          <p className="text-sm text-gray-600">Pay admission to unlock full access</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {streamers.map((streamer) => (
          <StreamerThumbnail
            key={streamer.id}
            streamer={streamer}
            hasPaid={hasPaid}
          />
        ))}
      </div>
    </div>
  );
};

export default StreamerGrid;