import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Heart, MessageCircle, Share2, Calendar, Users, Play } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/AppContext';
import CommentSection from './CommentSection';

interface UserPostData {
  id: string;
  content: string;
  user_name: string;
  user_id: string;
  likes: number;
  comments: number;
  shares: number;
  created_at: string;
  post_type: string;
  event_id: string | null;
  channel_id: string | null;
  media_url: string | null;
  media_type: string | null;
  location: string | null;
  updated_at: string;
  metadata: any;
}

const ProfileNewsfeed: React.FC = () => {
  const [posts, setPosts] = useState<UserPostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState<{[key: string]: boolean}>({});
  const navigate = useNavigate();
  const { isAuthenticated } = useAppContext();
  const { toast } = useToast();

  useEffect(() => {
    fetchNewsfeed();
  }, []);

  const fetchNewsfeed = async () => {
    try {
      const { data, error } = await supabase
        .from('user_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching newsfeed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!isAuthenticated) {
      const currentUrl = window.location.pathname + window.location.search;
      navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, likes: post.likes + 1 }
        : post
    ));
  };

  const handleComment = async (postId: string, comment: string) => {
    if (!isAuthenticated) {
      const currentUrl = window.location.pathname + window.location.search;
      navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }
    // Update comment count in local state
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, comments: post.comments + 1 }
        : post
    ));
    
    console.log('Comment on post:', postId, comment);
  };

  const handleShare = async (postId: string) => {
    if (!isAuthenticated) {
      const currentUrl = window.location.pathname + window.location.search;
      navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }
    const postUrl = `${window.location.origin}/post/${postId}`;

    try {
      await navigator.clipboard.writeText(postUrl);
      
      // Update database with incremented share count
      const currentPost = posts.find(post => post.id === postId);
      const newShareCount = (currentPost?.shares || 0) + 1;
      
      const { error } = await supabase
        .from("user_posts")
        .update({ shares: newShareCount })
        .eq("id", postId);

      if (error) {
        console.error("Error updating shares count:", error);
        toast({
          title: "Share failed",
          description: "Could not update share count.",
          variant: "destructive",
        });
        return;
      }

      // Update local state after successful database update
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, shares: newShareCount }
          : post
      ));
      
      toast({
        title: "Link copied",
        description: "Post link copied to clipboard!",
      });
    } catch (err) {
      toast({
        title: "Share failed",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading newsfeed...</div>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Recent Posts</h3>
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="p-6">
                <div className="flex items-start space-x-3 mb-4">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>{post.user_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold">{post.user_name}</h4>
                      <span className="text-sm text-gray-500">@{post.user_name}</span>
                    </div>
                    <p className="text-sm text-gray-500">{new Date(post.created_at).toLocaleString()}</p>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">{post.content}</p>
                
                {post.media_url && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    {post.media_type === "video" ? (
                      <video
                        src={post.media_url}
                        controls
                        className="w-full max-h-96 object-cover"
                      />
                    ) : (
                      <img
                        src={post.media_url}
                        alt="Post media"
                        className="w-full max-h-96 object-cover"
                      />
                    )}
                  </div>
                )}
                
                <div className="flex items-center space-x-6 pt-4 border-t">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleLike(post.id)}
                    className="text-gray-500"
                  >
                    <Heart className="w-4 h-4 mr-1" />
                    {post.likes}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowComments(prev => ({
                      ...prev,
                      [post.id]: !prev[post.id]
                    }))}
                    className="text-gray-500"
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {post.comments}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleShare(post.id)}
                    className="text-gray-500"
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    {post.shares || 0}
                  </Button>
                </div>
                
                {showComments[post.id] && (
                  <div className="mt-4 border-t pt-4">
                    <CommentSection 
                      entityId={post.id} 
                      entityType="post" 
                      onCommentAdded={() => setPosts(prev => prev.map(p => 
                        p.id === post.id 
                          ? { ...p, comments: p.comments + 1 }
                          : p
                      ))}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProfileNewsfeed;