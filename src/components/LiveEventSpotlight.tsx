import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Clock } from 'lucide-react';

interface LiveEvent {
  id: string;
  title: string;
  viewers: number;
  location?: string;
  timeRemaining?: string;
  thumbnail: string;
}

const LiveEventSpotlight: React.FC = () => {
  // Mock data for trending live events
  const liveEvents: LiveEvent[] = [
    {
      id: '1',
      title: 'Tech Conference 2025 Main Stage',
      viewers: 12500,
      location: 'Madison Square Garden',
      timeRemaining: '18 minutes!',
      thumbnail: '/placeholder.svg'
    },
    {
      id: '2',
      title: 'Gaming Championship Finals',
      viewers: 8900,
      location: 'Live from Tokyo',
      timeRemaining: '45 minutes',
      thumbnail: '/placeholder.svg'
    },
    {
      id: '3',
      title: 'Music Festival Live Stream',
      viewers: 6700,
      location: 'Central Park',
      timeRemaining: '1 hour 12 min',
      thumbnail: '/placeholder.svg'
    }
  ];

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">🔥 Live Now - Trending</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {liveEvents.map((event) => (
            <div key={event.id} className="relative group cursor-pointer">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg overflow-hidden">
                <img 
                  src={event.thumbnail} 
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                {/* Live badge */}
                <Badge className="absolute top-3 left-3 bg-red-600 hover:bg-red-700">
                  LIVE
                </Badge>
                
                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-semibold mb-2 line-clamp-2">{event.title}</h3>
                  
                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{event.viewers.toLocaleString()} watching now</span>
                    </div>
                    {event.timeRemaining && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Ends in {event.timeRemaining}</span>
                      </div>
                    )}
                  </div>
                  
                  {event.location && (
                    <p className="text-xs text-white/80 mb-3">{event.location}</p>
                  )}
                  
                  <Button size="sm" className="w-full">
                    Watch Now
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveEventSpotlight;