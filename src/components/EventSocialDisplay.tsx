import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, ChevronDown, ChevronUp } from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EventSocialDisplayProps {
  eventId: string;
  social: {
    likes_count: number;
    comments_count: number;
    user_has_liked: boolean;
    recent_likers: string[];
    all_likes: any[];
  };
  onSocialUpdate?: () => void;
}

export const EventSocialDisplay: React.FC<EventSocialDisplayProps> = ({ 
  eventId, 
  social,
  onSocialUpdate 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const { user, currentUserProfile } = useAppContext();
  const { toast } = useToast();

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user || !currentUserProfile) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like events",
        variant: "destructive"
      });
      return;
    }

    setIsLiking(true);
    
    try {
      if (social.user_has_liked) {
        // Unlike
        const { error } = await supabase
          .from('event_likes')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('event_likes')
          .insert({
            event_id: eventId,
            user_id: user.id,
            user_profile_id: currentUserProfile.id,
            display_name: currentUserProfile.display_name || 'Unknown User'
          });

        if (error) throw error;
      }

      // Trigger a refresh of the parent data
      if (onSocialUpdate) {
        onSocialUpdate();
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive"
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleToggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const renderSocialSummary = () => {
    if (social.likes_count === 0) return null;

    const { recent_likers } = social;
    if (recent_likers.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          {social.likes_count} {social.likes_count === 1 ? 'like' : 'likes'}
        </p>
      );
    }

    let summary = "";
    if (recent_likers.length === 1) {
      summary = `${recent_likers[0]} likes this`;
    } else if (recent_likers.length === 2) {
      summary = `${recent_likers[0]} and ${recent_likers[1]} like this`;
    } else if (recent_likers.length === 3) {
      if (social.likes_count === 3) {
        summary = `${recent_likers[0]}, ${recent_likers[1]} and ${recent_likers[2]} like this`;
      } else {
        const others = social.likes_count - 3;
        summary = `${recent_likers[0]}, ${recent_likers[1]}, ${recent_likers[2]} and ${others} ${others === 1 ? 'other' : 'others'} like this`;
      }
    }

    return (
      <p className="text-sm text-muted-foreground">{summary}</p>
    );
  };

  return (
    <Card className="mt-3 bg-muted/30">
      <CardContent className="p-3">
        {/* Collapsed view */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>{social.likes_count} {social.likes_count === 1 ? 'like' : 'likes'}</span>
            <span>{social.comments_count} {social.comments_count === 1 ? 'comment' : 'comments'}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleToggleExpanded}
            className="h-auto p-1"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 border-t pt-2 mt-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex items-center space-x-1 flex-1 justify-center min-w-0 ${
              social.user_has_liked ? 'text-red-600' : ''
            }`}
            onClick={handleLike}
            disabled={isLiking}
          >
            <Heart className={`h-4 w-4 flex-shrink-0 ${social.user_has_liked ? 'fill-current' : ''}`} />
            <span className="hidden xs:inline sm:inline">
              {social.user_has_liked ? 'Liked' : 'Like'}
            </span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center space-x-1 flex-1 justify-center min-w-0"
            onClick={handleToggleExpanded}
          >
            <MessageCircle className="h-4 w-4 flex-shrink-0" />
            <span className="hidden xs:inline sm:inline">Comments</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center space-x-1 flex-1 justify-center min-w-0" 
            onClick={(e) => e.stopPropagation()}
          >
            <Share2 className="h-4 w-4 flex-shrink-0" />
            <span className="hidden xs:inline sm:inline">Share</span>
          </Button>
        </div>

        {/* Expanded view */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t">
            {renderSocialSummary()}
            {social.comments_count > 0 && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">
                  View all {social.comments_count} comments on the event page
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};