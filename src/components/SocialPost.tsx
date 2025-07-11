import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, Send } from 'lucide-react';

interface SocialPostProps {
  postId: string;
  author: {
    name: string;
    avatar?: string;
    username: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
  onLike?: (postId: string) => void;
  onComment?: (postId: string, comment: string) => void;
  onShare?: (postId: string) => void;
}

const SocialPost: React.FC<SocialPostProps> = ({
  postId,
  author,
  content,
  timestamp,
  likes,
  comments,
  shares,
  isLiked = false,
  onLike,
  onComment,
  onShare
}) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likes);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    onLike?.(postId);
  };

  const handleComment = () => {
    if (newComment.trim()) {
      onComment?.(postId, newComment);
      setNewComment('');
    }
  };

  const handleShare = () => {
    onShare?.(postId);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={author.avatar} />
            <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{author.name}</p>
            <p className="text-sm text-gray-500">@{author.username} • {timestamp}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="mb-4">{content}</p>
        
        <div className="flex items-center justify-between border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`flex items-center space-x-2 ${liked ? 'text-red-500' : 'text-gray-500'}`}
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
            <span>{likeCount}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 text-gray-500"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{comments}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="flex items-center space-x-2 text-gray-500"
          >
            <Share2 className="h-4 w-4" />
            <span>{shares}</span>
          </Button>
        </div>
        
        {showComments && (
          <div className="mt-4 border-t pt-4">
            <div className="flex space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[60px]"
                />
                <Button
                  onClick={handleComment}
                  size="sm"
                  className="mt-2"
                  disabled={!newComment.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Post
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SocialPost;