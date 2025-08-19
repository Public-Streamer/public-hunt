import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { EventComment } from "@/hooks/useEventSocial";
import { cn } from "@/lib/utils";

interface CommentReplyProps {
  reply: EventComment;
  currentUserId?: string;
  onDelete: () => void;
}

export function CommentReply({
  reply,
  currentUserId,
  onDelete,
}: CommentReplyProps) {
  const isOwner = currentUserId === reply.user_profile_id;

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

  return (
    <div className="flex gap-2 group ml-6">
      <Avatar className="h-6 w-6 flex-shrink-0">
        <AvatarImage src={reply.author_avatar} />
        <AvatarFallback className="text-xs text-muted-foreground">
          {reply.author_name?.charAt(0)?.toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-1">
        <div className="bg-muted/50 rounded-lg px-2 py-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-xs truncate max-w-[120px]">
              {reply.author_name}
            </span>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {formatMobileTime(new Date(reply.created_at))}
            </span>
          </div>
          <p className="text-xs text-foreground whitespace-pre-wrap break-words">
            {reply.content}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {isOwner && (
            <button onClick={onDelete} className="text-destructive">
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
