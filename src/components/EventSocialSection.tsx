import React, { useState } from 'react';
import { Heart, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useEventSocial, EventComment } from '@/hooks/useEventSocial';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface EventSocialSectionProps {
  eventId: string;
  className?: string;
}

export function EventSocialSection({ eventId, className }: EventSocialSectionProps) {
  const {
    likes,
    comments,
    userLike,
    loadingLikes,
    toggleLike,
    addComment,
    deleteComment
  } = useEventSocial(eventId);

  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const handleSubmitComment = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsCommenting(true);
    const success = await addComment(newComment);
    if (success) {
      setNewComment('');
    }
    setIsCommenting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment(e);
    }
  };

  const renderSocialSummary = () => {
    if (likes.length === 0) return null;

    const otherLikes = likes.filter(like => like.id !== userLike?.id);
    const totalLikes = likes.length;

    if (userLike && otherLikes.length === 0) {
      return (
        <span className="text-sm text-muted-foreground md:text-xs">
          You liked this
        </span>
      );
    }

    if (userLike && otherLikes.length > 0) {
      const firstName = otherLikes[0]?.display_name || 'Someone';
      const remaining = otherLikes.length - 1;
      
      if (remaining === 0) {
        return (
          <span className="text-sm text-muted-foreground md:text-xs">
            You and <span className="font-medium">{firstName}</span>
          </span>
        );
      }
      
      return (
        <span className="text-sm text-muted-foreground md:text-xs">
          You, <span className="font-medium">{firstName}</span> and{' '}
          <span className="font-medium">{remaining} other{remaining > 1 ? 's' : ''}</span>
        </span>
      );
    }

    // User hasn't liked
    const firstName = likes[0]?.display_name || 'Someone';
    const remaining = totalLikes - 1;
    
    if (remaining === 0) {
      return (
        <span className="text-sm text-muted-foreground md:text-xs">
          <span className="font-medium">{firstName}</span> liked this
        </span>
      );
    }
    
    return (
      <span className="text-sm text-muted-foreground md:text-xs">
        <span className="font-medium">{firstName}</span> and{' '}
        <span className="font-medium">{remaining} other{remaining > 1 ? 's' : ''}</span>
      </span>
    );
  };

  const renderComment = (comment: EventComment) => {
    const isOwner = comment.user_profile_id === userLike?.user_id; // Simple check, could be improved

    return (
      <div key={comment.id} className="flex gap-3 group">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.author_avatar} />
          <AvatarFallback className="text-xs">
            {comment.author_name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-1">
          <div className="bg-muted rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{comment.author_name}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          </div>
          
          {isOwner && (
            <button
              onClick={() => deleteComment(comment.id)}
              className="text-xs text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4 space-y-3">
        {/* Collapsed State: Social Summary + Action Buttons */}
        <div className="flex items-center justify-between gap-4">
          {/* Social Summary - Clickable to expand comments */}
          <div 
            className={cn(
              "flex-1 cursor-pointer",
              comments.length > 0 && "hover:text-foreground transition-colors"
            )}
            onClick={() => comments.length > 0 && setShowComments(!showComments)}
          >
            {renderSocialSummary() || (
              <span className="text-sm text-muted-foreground md:text-xs">
                Be the first to like this event
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLike}
              disabled={loadingLikes}
              className={cn(
                "flex items-center gap-2 h-8 px-3 md:h-9 md:px-4",
                userLike ? "text-red-600 hover:text-red-700" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  userLike ? "fill-current" : ""
                )}
              />
              <span className="text-sm font-medium">
                {likes.length > 0 ? likes.length : "Like"}
              </span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 h-8 px-3 text-muted-foreground hover:text-foreground md:h-9 md:px-4"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm font-medium">
                {comments.length > 0 ? comments.length : "Comment"}
              </span>
            </Button>
          </div>
        </div>

        {/* Expanded State: Comment Input and Comments */}
        {showComments && (
          <div className="space-y-4 pt-2">
            <Separator />
            
            {/* Comment Input */}
            <div className="space-y-3">
              <form onSubmit={handleSubmitComment} className="flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Write a comment..."
                  className="flex-1 min-h-[36px] py-2 text-sm resize-none md:min-h-[40px]"
                  rows={1}
                  disabled={isCommenting}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newComment.trim() || isCommenting}
                  className="h-9 px-3 md:h-10 md:px-4"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              
              <p className="text-xs text-muted-foreground px-1">
                Press Enter to post, Shift+Enter for new line
              </p>
            </div>

            {/* Comments Section */}
            {comments.length > 0 && (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {comments.map(renderComment)}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}