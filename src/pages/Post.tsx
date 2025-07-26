import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SocialPost from "@/components/SocialPost";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/AppContext";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface UserPost {
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
  media_url: string;
  media_type: string;
  location: string;
  updated_at: string;
  metadata: any;
}

const Post: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAppContext();
  const [post, setPost] = useState<UserPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) {
        setError("No post ID provided");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_posts")
          .select("*")
          .eq("id", postId)
          .maybeSingle();

        if (error) {
          if (error.code === "PGRST116") {
            setError("Post not found");
          } else {
            setError("Failed to load post");
          }
          setLoading(false);
          return;
        }

        setPost(data);
      } catch (err) {
        console.error("Error fetching post:", err);
        setError("Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const handleLike = async (postId: string) => {
    if (!isAuthenticated) {
      const currentUrl = window.location.pathname + window.location.search;
      navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has already liked this post
      const { data: existingLike } = await supabase
        .from('post_interactions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .eq('interaction_type', 'like')
        .single();

      if (existingLike) {
        // Unlike the post
        const { error } = await supabase
          .from('post_interactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .eq('interaction_type', 'like');

        if (error) throw error;

        // Update post count in database and local state
        const newLikeCount = Math.max(0, (post?.likes || 0) - 1);
        await supabase
          .from('user_posts')
          .update({ likes: newLikeCount })
          .eq('id', postId);

        setPost(prev => prev ? { ...prev, likes: newLikeCount } : null);
      } else {
        // Like the post
        const { error } = await supabase
          .from('post_interactions')
          .insert({
            post_id: postId,
            user_id: user.id,
            interaction_type: 'like'
          });

        if (error) throw error;

        // Update post count in database and local state
        const newLikeCount = (post?.likes || 0) + 1;
        await supabase
          .from('user_posts')
          .update({ likes: newLikeCount })
          .eq('id', postId);

        setPost(prev => prev ? { ...prev, likes: newLikeCount } : null);
      }

      toast({
        title: "Success",
        description: "Post like status updated.",
      });
    } catch (error) {
      console.error('Error handling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like status.",
        variant: "destructive",
      });
    }
  };

  const handleComment = async (postId: string, comment: string) => {
    if (!isAuthenticated) {
      const currentUrl = window.location.pathname + window.location.search;
      navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }
    try {
      // Get current user profile for comment creation
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to comment.",
          variant: "destructive",
        });
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        toast({
          title: "Profile not found",
          description: "User profile is required to comment.",
          variant: "destructive",
        });
        return;
      }

      // Insert comment into database
      const { error } = await supabase
        .from('comments')
        .insert({
          content: comment,
          post_id: postId,
          user_profile_id: profile.id,
          author_name: profile.display_name || profile.username,
          author_username: profile.username,
          author_avatar: profile.profile_picture_url
        });

      if (error) {
        console.error("Error adding comment:", error);
        toast({
          title: "Failed to add comment",
          description: "There was an error posting your comment.",
          variant: "destructive",
        });
        return;
      }

      // Update comment count in post
      if (post) {
        setPost(prev => prev ? { ...prev, comments: prev.comments + 1 } : null);
      }

      toast({
        title: "Comment added",
        description: "Your comment has been posted.",
      });
    } catch (error) {
      console.error("Error in handleComment:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (postId: string) => {
    if (!isAuthenticated) {
      const currentUrl = window.location.pathname + window.location.search;
      navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }
    // Handle share functionality
    const postUrl = `${window.location.origin}/post/${postId}`;

    try {
      await navigator.clipboard.writeText(postUrl);
      
      // Increment shares count in database
      const { error } = await supabase
        .from("user_posts")
        .update({ shares: (post?.shares || 0) + 1 })
        .eq("id", postId);

      if (error) {
        console.error("Error updating shares count:", error);
      } else {
        // Update local state to reflect the change
        setPost(prev => prev ? { ...prev, shares: prev.shares + 1 } : null);
      }
      
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
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Post not found"}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => navigate("/")} variant="outline">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  console.log(post);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <SocialPost
        postId={post.id}
        author={{
          name: post.user_name,
          avatar: undefined,
          username: post.user_name,
        }}
        content={post.content}
        timestamp={new Date(post.created_at).toLocaleDateString()}
        likes={post.likes}
        comments={post.comments}
        shares={post.shares}
        media_url={post.media_url}
        media_type={post.media_type as "image" | "video"}
        isOwnPost={false} // Individual post view doesn't allow editing
        onLike={handleLike}
        onComment={handleComment}
        onShare={handleShare}
      />
    </div>
  );
};

export default Post;
