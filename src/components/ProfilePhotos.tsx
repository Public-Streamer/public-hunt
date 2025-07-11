import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ProfilePhotosProps {
  userId: string;
  isOwnProfile: boolean;
}

interface Photo {
  id: string;
  url: string;
  caption?: string;
  created_at: string;
}

const ProfilePhotos: React.FC<ProfilePhotosProps> = ({ userId, isOwnProfile }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhotos();
  }, [userId]);

  const fetchPhotos = async () => {
    try {
      // Fetch photos from user posts or media uploads
      const { data, error } = await supabase
        .from('user_posts')
        .select('id, content, media_url, created_at')
        .eq('user_id', userId)
        .not('media_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const photoData = data?.map(post => ({
        id: post.id,
        url: post.media_url,
        caption: post.content,
        created_at: post.created_at
      })) || [];

      setPhotos(photoData);
    } catch (error) {
      console.error('Error fetching photos:', error);
      // Mock photos for demo
      setPhotos([
        {
          id: '1',
          url: '/placeholder.svg',
          caption: 'Beautiful sunset',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          url: '/placeholder.svg',
          caption: 'Great event!',
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading photos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <ImageIcon className="w-5 h-5 mr-2" />
            Photos ({photos.length})
          </CardTitle>
          {isOwnProfile && (
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Photos
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {isOwnProfile ? 'No photos yet. Share your first photo!' : 'No photos to show'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="aspect-square relative group cursor-pointer">
                  <img
                    src={photo.url}
                    alt={photo.caption || 'Photo'}
                    className="w-full h-full object-cover rounded-lg hover:opacity-90 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePhotos;