import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Eye } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  avatar: string;
  tagline: string;
  totalViewers: number;
  isLive: boolean;
  category: string;
}

const TrendingChannels: React.FC = () => {
  // Mock data for trending channels
  const channels: Channel[] = [
    {
      id: '1',
      name: 'TechTalks Live',
      avatar: '/placeholder.svg',
      tagline: 'Latest in AI & Technology',
      totalViewers: 15600,
      isLive: true,
      category: 'Technology'
    },
    {
      id: '2',
      name: 'Gaming Central',
      avatar: '/placeholder.svg',
      tagline: 'Pro Gaming & Reviews',
      totalViewers: 12300,
      isLive: true,
      category: 'Gaming'
    },
    {
      id: '3',
      name: 'Creative Studio',
      avatar: '/placeholder.svg',
      tagline: 'Art, Design & Music',
      totalViewers: 8900,
      isLive: false,
      category: 'Creative'
    },
    {
      id: '4',
      name: 'Business Insights',
      avatar: '/placeholder.svg',
      tagline: 'Entrepreneurship & Finance',
      totalViewers: 7200,
      isLive: true,
      category: 'Business'
    }
  ];

  return (
    <div className="py-8 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">📈 Top Channels This Hour</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {channels.map((channel, index) => (
            <div key={channel.id} className="bg-background rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <img 
                    src={channel.avatar} 
                    alt={channel.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {channel.isLive && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-600 rounded-full border-2 border-background"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{channel.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{channel.tagline}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  #{index + 1}
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1 text-sm">
                  <Eye className="h-4 w-4" />
                  <span>{channel.totalViewers.toLocaleString()}</span>
                </div>
                {channel.isLive && <Badge variant="secondary">Live Now</Badge>}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{channel.category}</span>
                <Button size="sm" variant="outline">
                  Follow
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrendingChannels;