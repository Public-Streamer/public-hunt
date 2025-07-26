import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { ThumbsUp, ThumbsDown, MessageCircle, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  likes_count: number;
  dislikes_count: number;
  user_profile: {
    id: string;
    username: string;
    display_name: string;
    profile_picture_url: string;
  };
  user_liked?: boolean;
  user_disliked?: boolean;
}

interface SocialCommentSectionProps {
  entityId: string;
  entityType: 'event' | 'channel' | 'post';
  canModerate?: boolean;
}

const SocialCommentSection: React.FC<SocialCommentSectionProps> = ({ 
  entityId, 
  entityType, 
  canModerate = false 
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchComments();
    getCurrentUserProfile();
  }, [entityId]);

  const getCurrentUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setCurrentUserProfile(profile);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user_profile:user_profiles!user_profile_id(
            id,
            username,
            display_name,
            profile_picture_url
          )
        `)
        .eq('post_id', entityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserProfile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          content: newComment,
          post_id: entityId,
          user_profile_id: currentUserProfile.id
        });

      if (error) throw error;

      setNewComment('');
      fetchComments();
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

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      fetchComments();
      toast({
        title: 'Comment deleted',
        description: 'Comment has been removed'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
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
        {/* New Comment Form */}
        {currentUserProfile && (
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
              <Button type="submit" disabled={loading || !newComment.trim()}>
                {loading ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </form>
        )}

        {/* Comments List */}
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
                
                {/* Like/Dislike Buttons */}
                <div className="flex items-center space-x-4 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(comment.id, true)}
                    className="flex items-center space-x-1 text-xs"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>{comment.likes_count}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(comment.id, false)}
                    className="flex items-center space-x-1 text-xs"
                  >
                    <ThumbsDown className="w-3 h-3" />
                    <span>{comment.dislikes_count}</span>
                  </Button>
                </div>
              </div>
              
              {/* Moderation Menu */}
              {(canModerate || comment.user_profile.id === currentUserProfile?.id) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleDeleteComment(comment.id)}>
                      Delete Comment
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SocialCommentSection;