import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SocialPost from "@/components/SocialPost";
import { useToast } from "@/hooks/use-toast";
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
    // Handle like functionality
    toast({
      title: "Like updated",
      description: "Post like status updated successfully.",
    });
  };

  const handleComment = async (postId: string, comment: string) => {
    // Handle comment functionality
    toast({
      title: "Comment added",
      description: "Your comment has been posted.",
    });
  };

  const handleShare = async (postId: string) => {
    // Handle share functionality
    const postUrl = `${window.location.origin}/post/${postId}`;

    try {
      await navigator.clipboard.writeText(postUrl);
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
        shares={0}
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
