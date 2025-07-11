import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, Image as ImageIcon, Video, Send, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Post {
  id: string;
  content: string;
  media_url?: string;
  created_at: string;
  user_id: string;
  user_profile?: {
    display_name: string;
    username: string;
    profile_picture_url: string;
  };
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  type?: 'post' | 'channel' | 'event';
  source_name?: string;
}

interface ProfileNewsfeedTabProps {
  userId: string;
  isOwnProfile: boolean;
}

const ProfileNewsfeedTab: React.FC<ProfileNewsfeedTabProps> = ({ userId, isOwnProfile }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser();
    fetchPosts();
  }, [userId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchPosts = async () => {
    try {
      // Get user's own posts
      const { data: userPosts, error: userError } = await supabase
        .from('user_posts')
        .select(`
          *,
          user_profiles!inner(
            display_name,
            username,
            profile_picture_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (userError) throw userError;

      // Get followed content if it's own profile
      let followedContent: any[] = [];
      if (isOwnProfile) {
        try {
          const { data: follows } = await supabase
            .from('user_follows')
            .select('following_type, following_id')
            .eq('follower_id', userId);

          if (follows && follows.length > 0) {
            // Mock popular content from followed channels/events
            followedContent = [
              {
                id: 'trending-1',
                content: 'Amazing livestream happening now! Join us for exclusive content.',
                created_at: new Date(Date.now() - 3600000).toISOString(),
                user_id: 'system',
                user_profile: {
                  display_name: 'Gaming Channel',
                  username: 'gaming',
                  profile_picture_url: '/placeholder.svg'
                },
                likes_count: 150,
                comments_count: 45,
                is_liked: false,
                type: 'channel',
                source_name: 'Gaming Channel'
              },
              {
                id: 'trending-2',
                content: 'Upcoming event: Tech Conference 2024 - Register now!',
                created_at: new Date(Date.now() - 7200000).toISOString(),
                user_id: 'system',
                user_profile: {
                  display_name: 'Tech Events',
                  username: 'techevents',
                  profile_picture_url: '/placeholder.svg'
                },
                likes_count: 89,
                comments_count: 23,
                is_liked: false,
                type: 'event',
                source_name: 'Tech Conference'
              }
            ];
          }
        } catch (error) {
          console.error('Error fetching followed content:', error);
        }
      }

      const postsData = userPosts?.map(post => ({
        ...post,
        user_profile: post.user_profiles,
        likes_count: Math.floor(Math.random() * 50),
        comments_count: Math.floor(Math.random() * 20),
        is_liked: false,
        type: 'post' as const
      })) || [];

      // Combine and sort all posts
      const allPosts = [...postsData, ...followedContent]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setPosts(allPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load posts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() || !currentUser) return;

    try {
      const { error } = await supabase
        .from('user_posts')
        .insert({
          user_id: currentUser.id,
          content: newPost,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      setNewPost('');
      fetchPosts();
      toast({
        title: 'Success',
        description: 'Post created successfully'
      });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: 'Failed to create post',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading newsfeed...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Post */}
      {isOwnProfile && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex space-x-4">
              <Avatar>
                <AvatarImage src={currentUser?.user_metadata?.avatar_url} />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="What's on your mind?"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
                <div className="flex justify-between items-center mt-4">
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Photo
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="w-4 h-4 mr-2" />
                      Video
                    </Button>
                  </div>
                  <Button onClick={handleCreatePost} disabled={!newPost.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts */}
      {posts.map((post) => (
        <Card key={post.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={post.user_profile?.profile_picture_url} />
                  <AvatarFallback>
                    {post.user_profile?.display_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">{post.user_profile?.display_name}</h4>
                  <p className="text-sm text-gray-500">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {post.type !== 'post' && (
                <div className="flex items-center text-sm text-blue-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Popular from {post.source_name}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{post.content}</p>
            {post.media_url && (
              <img
                src={post.media_url}
                alt="Post media"
                className="w-full rounded-lg mb-4"
              />
            )}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="ghost" size="sm">
                <Heart className="w-4 h-4 mr-2" />
                {post.likes_count}
              </Button>
              <Button variant="ghost" size="sm">
                <MessageCircle className="w-4 h-4 mr-2" />
                {post.comments_count}
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProfileNewsfeedTab;