import React, { useState, useEffect } from 'react';
import { Plus, Video, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface ProfileVideosProps {
  userId: string;
  isOwnProfile: boolean;
}

interface Video {
  id: string;
  url: string;
  thumbnail?: string;
  title?: string;
  duration?: string;
  created_at: string;
}

const ProfileVideos: React.FC<ProfileVideosProps> = ({
  userId,
  isOwnProfile,
}) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, [userId]);

  const fetchVideos = async () => {
    try {
      // Fetch videos from user posts or media uploads
      const { data, error } = await supabase
        .from('user_posts')
        .select('id, content, media_url, created_at')
        .eq('user_id', userId)
        .not('media_url', 'is', null)
        .ilike('media_url', '%.mp4')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const videoData =
        data?.map((post) => ({
          id: post.id,
          url: post.media_url,
          title: post.content,
          thumbnail: '/placeholder.svg',
          duration: '2:30',
          created_at: post.created_at,
        })) || [];

      setVideos(videoData);
    } catch (error) {
      console.error('Error fetching videos:', error);
      // Mock videos for demo
      setVideos([
        {
          id: '1',
          url: '/placeholder.svg',
          thumbnail: '/placeholder.svg',
          title: 'Amazing livestream highlights',
          duration: '5:42',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          url: '/placeholder.svg',
          thumbnail: '/placeholder.svg',
          title: 'Event recap video',
          duration: '3:15',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading videos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <Video className="w-5 h-5 mr-2" />
            Videos ({videos.length})
          </CardTitle>
          {isOwnProfile && (
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Video
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {videos.length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {isOwnProfile
                  ? 'No videos yet. Upload your first video!'
                  : 'No videos to show'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <div key={video.id} className="group cursor-pointer">
                  <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={video.thumbnail || '/placeholder.svg'}
                      alt={video.title || 'Video'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                      <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        {video.duration}
                      </div>
                    )}
                  </div>
                  {video.title && (
                    <h4 className="mt-2 font-medium text-sm line-clamp-2">
                      {video.title}
                    </h4>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(video.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileVideos;
