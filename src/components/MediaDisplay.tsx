import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Image as ImageIcon } from 'lucide-react';

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  title?: string;
  thumbnail?: string;
}

interface MediaDisplayProps {
  media: MediaItem[];
}

const MediaDisplay: React.FC<MediaDisplayProps> = ({ media }) => {
  if (!media || media.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <ImageIcon className="h-5 w-5 mr-2" />
          Promotional Media
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {media.map((item) => (
            <div key={item.id} className="relative group">
              {item.type === 'video' ? (
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <video
                    src={item.url}
                    poster={item.thumbnail}
                    className="w-full h-full object-cover"
                    controls
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                    <Play className="h-12 w-12 text-white opacity-80" />
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={item.url}
                    alt={item.title || 'Promotional image'}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
              )}
              {item.title && (
                <p className="mt-2 text-sm text-gray-600 truncate">{}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MediaDisplay;