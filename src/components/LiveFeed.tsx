import React from 'react';
import { Eye, Users, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface LiveEvent {
  id: string;
  title: string;
  creator: string;
  viewers: number;
  thumbnail: string;
  category: string;
}

const LiveFeed: React.FC = () => {
  // Mock data for live events sorted by popularity
  const liveEvents: LiveEvent[] = [
    {
      id: '1',
      title: 'Tech Conference 2025 Main Stage',
      creator: 'TechConf Official',
      viewers: 12500,
      thumbnail: '/placeholder.svg',
      category: 'Technology',
    },
    {
      id: '2',
      title: 'Gaming Championship Finals',
      creator: 'ESports League',
      viewers: 8900,
      thumbnail: '/placeholder.svg',
      category: 'Gaming',
    },
    {
      id: '3',
      title: 'Music Festival Live Stream',
      creator: 'Music Fest 2025',
      viewers: 6700,
      thumbnail: '/placeholder.svg',
      category: 'Music',
    },
    {
      id: '4',
      title: 'Cooking with Celebrity Chef',
      creator: 'Chef Masters',
      viewers: 4200,
      thumbnail: '/placeholder.svg',
      category: 'Lifestyle',
    },
    {
      id: '5',
      title: 'Art Workshop: Digital Painting',
      creator: 'Creative Studios',
      viewers: 3100,
      thumbnail: '/placeholder.svg',
      category: 'Art',
    },
    {
      id: '6',
      title: 'Business Strategy Masterclass',
      creator: 'Biz Experts',
      viewers: 2800,
      thumbnail: '/placeholder.svg',
      category: 'Business',
    },
  ];

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">
          📺 Live Now - Sorted by Popularity
        </h2>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {liveEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex gap-4 p-4 bg-background rounded-lg border hover:shadow-md transition-shadow"
                >
                  <div className="relative flex-none w-32 h-20">
                    <img
                      src={event.thumbnail}
                      alt={event.title}
                      className="w-full h-full object-cover rounded"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <Play className="h-6 w-6 text-white" />
                    </div>

                    {/* Live indicator */}
                    <div className="absolute -top-1 -left-1">
                      <Badge className="bg-red-600 hover:bg-red-700 text-xs">
                        LIVE
                      </Badge>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold line-clamp-2 pr-2">
                        {event.title}
                      </h3>
                      <Badge variant="outline" className="flex-none">
                        {event.category}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">
                      {event.creator}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span>{event.viewers.toLocaleString()} watching</span>
                      </div>
                      <Button size="sm">Watch Now</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-6">
              <Button variant="outline">Load More Live Events</Button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-background rounded-lg p-4 border">
              <h3 className="font-semibold mb-4">📊 Live Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Live Events:</span>
                  <Badge variant="secondary">156</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Viewers:</span>
                  <Badge variant="secondary">89.2K</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Active Streamers:</span>
                  <Badge variant="secondary">203</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Peak Today:</span>
                  <Badge variant="secondary">127.5K</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveFeed;
