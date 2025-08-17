import React, { useState } from "react";
import {
  Heart,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useEventSocial, EventComment } from "@/hooks/useEventSocial";
import { ReplyComposer } from "@/components/ReplyComposer";
import { CommentReply } from "@/components/CommentReply";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface EventSocialSectionProps {
  eventId: string;
  className?: string;
}

export function EventSocialSection({
  eventId,
  className,
}: EventSocialSectionProps) {
  const {
    likes,
    comments,
    userLike,
    loadingLikes,
    loadingReplies,
    toggleLike,
    addComment,
    deleteComment,
    fetchReplies,
  } = useEventSocial(eventId);

  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user ID
  React.useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();
        setCurrentUserId(profile?.id || null);
      }
    };
    getCurrentUser();
  }, []);

  const handleSubmitComment = async (
    e: React.FormEvent | React.KeyboardEvent
  ) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsCommenting(true);
    const success = await addComment(newComment);
    if (success) {
      setNewComment("");
    }
    setIsCommenting(false);
  };

  const handleSubmitReply = async (
    content: string,
    parentCommentId: string
  ) => {
    const success = await addComment(content, parentCommentId);
    if (success) {
      setReplyingTo(null);
    }
    return success;
  };

  const handleDeleteComment = async (
    commentId: string,
    parentCommentId?: string
  ) => {
    await deleteComment(commentId, parentCommentId);
  };

  const handleToggleReplies = async (commentId: string) => {
    const isCurrentlyShown = showReplies[commentId];

    if (!isCurrentlyShown) {
      // Load replies if not already loaded
      const comment = comments.find((c) => c.id === commentId);
      if (!comment?.replies) {
        await fetchReplies(commentId);
      }
    }

    setShowReplies((prev) => ({
      ...prev,
      [commentId]: !isCurrentlyShown,
    }));
  };

  // Format relative timestamp for mobile
  const formatMobileTime = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment(e);
    }
  };

  const renderSocialSummary = () => {
    if (likes.length === 0) return null;

    const otherLikes = likes.filter((like) => like.id !== userLike?.id);
    const totalLikes = likes.length;

    if (userLike && otherLikes.length === 0) {
      return (
        <span className="text-sm text-muted-foreground md:text-xs truncate">
          You liked this
        </span>
      );
    }

    if (userLike && otherLikes.length > 0) {
      const firstName = otherLikes[0]?.display_name || "Someone";
      const remaining = otherLikes.length - 1;

      if (remaining === 0) {
        return (
          <span className="text-sm text-muted-foreground md:text-xs truncate">
            You and <span className="font-medium">{firstName}</span>
          </span>
        );
      }

      return (
        <span className="text-sm text-muted-foreground md:text-xs truncate">
          You, <span className="font-medium">{firstName}</span> and{" "}
          <span className="font-medium">
            {remaining} other{remaining > 1 ? "s" : ""}
          </span>
        </span>
      );
    }

    // User hasn't liked
    const firstName = likes[0]?.display_name || "Someone";
    const remaining = totalLikes - 1;

    if (remaining === 0) {
      return (
        <span className="text-sm text-muted-foreground md:text-xs truncate">
          <span className="font-medium">{firstName}</span> liked this
        </span>
      );
    }

    return (
      <span className="text-sm text-muted-foreground md:text-xs truncate">
        <span className="font-medium">{firstName}</span> and{" "}
        <span className="font-medium">
          {remaining} other{remaining > 1 ? "s" : ""}
        </span>
      </span>
    );
  };

  const renderComment = (comment: EventComment) => {
    const isOwner = comment.user_profile_id === currentUserId;
    const hasReplies = comment.reply_count > 0;
    const repliesVisible = showReplies[comment.id];
    const isLoadingReplies = loadingReplies[comment.id];

    return (
      <div key={comment.id} className="space-y-2">
        {/* Main Comment */}
        <div className="flex gap-3 group">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={comment.author_avatar} />
            <AvatarFallback className="text-xs">
              {comment.author_name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-1">
            <div className="bg-muted rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm truncate max-w-[150px]">
                  {comment.author_name}
                </span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatMobileTime(new Date(comment.created_at))}
                </span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            </div>

            {/* Comment Actions */}
            <div className="flex items-center gap-3 text-xs">
              <button
                onClick={() =>
                  setReplyingTo(replyingTo === comment.id ? null : comment.id)
                }
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                Reply
              </button>

              {isOwner && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                >
                  Delete
                </button>
              )}
            </div>

            {/* Reply Composer */}
            {replyingTo === comment.id && (
              <div className="mt-2 ml-2">
                <ReplyComposer
                  onSubmit={(content) => handleSubmitReply(content, comment.id)}
                  placeholder="Write a reply..."
                  className="text-xs"
                />
                <p className="text-xs text-muted-foreground mt-1 px-1">
                  Press Enter to post, Shift+Enter for new line
                </p>
              </div>
            )}

            {/* View Replies Toggle */}
            {hasReplies && (
              <button
                onClick={() => handleToggleReplies(comment.id)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                disabled={isLoadingReplies}
              >
                {isLoadingReplies ? (
                  "Loading..."
                ) : repliesVisible ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Hide replies
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    View {comment.reply_count}{" "}
                    {comment.reply_count === 1 ? "reply" : "replies"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Replies */}
        {repliesVisible && comment.replies && (
          <div className="space-y-2">
            {comment.replies.map((reply) => (
              <CommentReply
                key={reply.id}
                reply={reply}
                currentUserId={currentUserId}
                onDelete={() => handleDeleteComment(reply.id, comment.id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card
      className={cn("w-full border shadow-none bg-transparent p-0", className)}
    >
      <CardContent className="p-2 space-y-3">
        {/* Collapsed State: Social Summary + Action Buttons */}
        <div className="flex items-center justify-between gap-4">
          {/* Social Summary - Clickable to expand comments */}
          <div
            className={cn(
              "flex-1 cursor-pointer",
              comments.length > 0 && "hover:text-foreground transition-colors"
            )}
          >
            {/*  */}
            {/* Action Buttons */}
            <div className="flex  justify-between items-end gap-2">
              <div className="flex flex-col  gap-2 w-1/2">
                <div className="flex items-baseline gap-2 ">
                  {renderSocialSummary() || (
                    <span className=" text-sm text-muted-foreground md:text-xs truncate">
                      No likes...
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleLike}
                  disabled={loadingLikes}
                  className={cn(
                    "flex items-center gap-2 h-8 px-3 md:h-9 md:px-4 shadow-none w-full",
                    userLike
                      ? "text-red-600 hover:text-red-700"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Heart
                    className={cn("h-4 w-4", userLike ? "fill-current" : "")}
                  />
                  <span className="text-sm font-medium">
                    {likes.length > 0 ? likes.length : "Like"}
                  </span>
                </Button>
              </div>

              <div
                onClick={() =>
                  comments.length > 0 && setShowComments(!showComments)
                }
                className="flex items-center gap-2 w-1/2"
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComments(!showComments)}
                  className="w-full flex items-center gap-2 h-8 px-3 text-muted-foreground hover:text-foreground md:h-9 md:px-4"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {comments.length > 0 ? comments.length : "Comment"}
                  </span>
                </Button>
              </div>
            </div>
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
