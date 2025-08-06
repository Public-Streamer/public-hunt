import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/contexts/AppContext';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import { formatDistanceToNow } from 'date-fns';

// UUID validation helper
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

interface Comment {
  id: string;
  content: string;
  created_at: string;
  likes_count: number;
  dislikes_count: number;
  user_liked?: boolean;
  user_disliked?: boolean;
  user_profile: {
    id: string;
    username: string;
    display_name: string;
    profile_picture_url: string;
  };
}

interface CommentSectionProps {
  entityId: string;
  entityType: 'event' | 'channel' | 'post';
  onCommentAdded?: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ entityId, entityType, onCommentAdded }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUserProfile, setcurrentUserProfile] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated } = useAppContext();

  useEffect(() => {
    fetchComments();
    getcurrentUserProfile();
  }, [entityId]);

  const getcurrentUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setcurrentUserProfile(profile);
    }
  };

  const fetchComments = async () => {
    // Skip fetching if entityId is not a valid UUID
    if (!entityId || !isValidUUID(entityId)) {
      setComments([]);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user_profile:user_profiles!user_profile_id(
            id,
            username,
            display_name,
            profile_picture_url
          ),
          comment_likes(
            is_like,
            user_profile_id
          )
        `)
        .eq('post_id', entityId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process comments to calculate likes/dislikes and user interaction state
      const processedComments = data?.map(comment => {
        const likes = comment.comment_likes?.filter(like => like.is_like === true) || [];
        const dislikes = comment.comment_likes?.filter(like => like.is_like === false) || [];
        
        let userLiked = false;
        let userDisliked = false;
        
        if (user && currentUserProfile) {
          const userLike = comment.comment_likes?.find(like => 
            like.user_profile_id === currentUserProfile.id
          );
          if (userLike) {
            userLiked = userLike.is_like === true;
            userDisliked = userLike.is_like === false;
          }
        }

        return {
          ...comment,
          likes_count: likes.length,
          dislikes_count: dislikes.length,
          user_liked: userLiked,
          user_disliked: userDisliked,
          comment_likes: undefined // Remove this from the final object
        };
      }) || [];

      setComments(processedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      // Don't show error toast for invalid UUIDs, just fail silently
      if (isValidUUID(entityId)) {
        toast({
          title: 'Error',
          description: 'Failed to load comments',
          variant: 'destructive'
        });
      }
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserProfile || !isValidUUID(entityId)) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          content: newComment,
          post_id: entityId,
          user_profile_id: currentUserProfile.id,
          author_name: currentUserProfile.display_name || currentUserProfile.username,
          author_username: currentUserProfile.username,
          author_avatar: currentUserProfile.profile_picture_url
        });

      if (error) throw error;

      // Update the comment count in the user_posts table
      if (entityType === 'post') {
        const { error: updateError } = await supabase
          .from('user_posts')
          .update({ comments: comments.length + 1 })
          .eq('id', entityId);
        
        if (updateError) {
          console.error('Error updating comment count:', updateError);
        }
      }

      setNewComment('');
      fetchComments();
      
      // Notify parent component that a comment was added
      onCommentAdded?.();
      
      toast({
        title: 'Comment posted',
        description: 'Your comment has been posted successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (commentId: string, isLike: boolean) => {
    if (!isAuthenticated) {
      const currentUrl = window.location.pathname + window.location.search;
      navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }
    if (!currentUserProfile) return;

    try {
      const { error } = await supabase
        .from('comment_likes')
        .upsert({
          comment_id: commentId,
          user_profile_id: currentUserProfile.id,
          is_like: isLike
        });

      if (error) throw error;
      fetchComments();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update like',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5" />
          <span>Comments ({comments.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAuthenticated ? (
          currentUserProfile && (
            <form onSubmit={handleSubmitComment} className="space-y-3">
            <div className="flex space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={currentUserProfile.profile_picture_url} />
                <AvatarFallback>
                  {currentUserProfile.display_name?.[0] || currentUserProfile.username[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <TooltipWrapper content="Post your comment for others to see">
                <Button type="submit" disabled={loading || !newComment.trim()}>
                  {loading ? 'Posting...' : 'Post Comment'}
                </Button>
              </TooltipWrapper>
            </div>
          </form>
          )
        ) : (
          <div className="text-center py-4 border rounded-lg bg-muted/50">
            <p className="text-muted-foreground">
              <Button 
                variant="link" 
                onClick={() => {
                  const currentUrl = window.location.pathname + window.location.search;
                  navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`);
                }}
                className="p-0 h-auto font-normal"
              >
                Sign in
              </Button>
              {" "}to join the conversation
            </p>
          </div>
        )}

        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3 p-3 border rounded-lg">
              <Avatar className="w-8 h-8">
                <AvatarImage src={comment.user_profile.profile_picture_url} />
                <AvatarFallback>
                  {comment.user_profile.display_name?.[0] || comment.user_profile.username[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-sm">
                    {comment.user_profile.display_name || comment.user_profile.username}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm mt-1">{comment.content}</p>
                
                {isAuthenticated && (
                  <div className="flex items-center space-x-4 mt-2">
                    <TooltipWrapper content="Like this comment">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(comment.id, true)}
                        className="flex items-center space-x-1 text-xs"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>{comment.likes_count}</span>
                      </Button>
                    </TooltipWrapper>
                    <TooltipWrapper content="Dislike this comment">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(comment.id, false)}
                        className="flex items-center space-x-1 text-xs"
                        >
                        <ThumbsDown className="w-3 h-3" />
                        <span>{comment.dislikes_count}</span>
                      </Button>
                    </TooltipWrapper>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CommentSection;