import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Eye, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface Episode {
  id: string;
  title: string;
  channel: string;
  views: number;
  duration: string;
  thumbnail: string;
  category: string;
}

const TrendingEpisodes: React.FC = () => {
  // Mock data for trending episodes
  const episodes: Episode[] = [
    {
      id: '1',
      title: 'The Future of AI: What You Need to Know',
      channel: 'TechTalks Live',
      views: 125000,
      duration: '32:15',
      thumbnail: '/placeholder.svg',
      category: 'Technology'
    },
    {
      id: '2',
      title: 'Epic Gaming Moments Compilation',
      channel: 'Gaming Central',
      views: 89000,
      duration: '28:42',
      thumbnail: '/placeholder.svg',
      category: 'Gaming'
    },
    {
      id: '3',
      title: 'Behind the Scenes: Music Production',
      channel: 'Creative Studio',
      views: 67000,
      duration: '41:20',
      thumbnail: '/placeholder.svg',
      category: 'Music'
    },
    {
      id: '4',
      title: 'Startup Success Stories',
      channel: 'Business Insights',
      views: 54000,
      duration: '35:08',
      thumbnail: '/placeholder.svg',
      category: 'Business'
    },
    {
      id: '5',
      title: 'Digital Art Masterclass',
      channel: 'Creative Studio',
      views: 43000,
      duration: '45:30',
      thumbnail: '/placeholder.svg',
      category: 'Art'
    }
  ];

  return (
    <div className="py-8 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">🔥 This Week's Hottest Episodes</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4">
          {episodes.map((episode) => (
            <div key={episode.id} className="flex-none w-80 bg-background rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-video relative group cursor-pointer">
                <img 
                  src={episode.thumbnail} 
                  alt={episode.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button size="lg" className="rounded-full w-16 h-16">
                    <Play className="h-6 w-6 ml-1" />
                  </Button>
                </div>
                
                {/* Duration badge */}
                <Badge className="absolute bottom-3 right-3 bg-black/80">
                  <Clock className="h-3 w-3 mr-1" />
                  {episode.duration}
                </Badge>
              </div>
              
              <div className="p-4">
                <Badge variant="outline" className="mb-2">{episode.category}</Badge>
                <h3 className="font-semibold mb-1 line-clamp-2">{episode.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{episode.channel}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span>{episode.views.toLocaleString()} views</span>
                  </div>
                  <Button size="sm" variant="outline">
                    Watch
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

export default TrendingEpisodes;