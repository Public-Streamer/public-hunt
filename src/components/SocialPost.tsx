import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Heart, MessageCircle, Share2, Send, Hash, Calendar, Users, Edit2, Trash2, MoreHorizontal, Check, X, Upload, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  channel?: {
    id: string;
    name: string;
  };
  event?: {
    id: string;
    name: string;
  };
  taggedUsers?: {
    id: string;
    name: string;
    username: string;
  }[];
  isLiked?: boolean;
  isOwnPost?: boolean;
  onLike?: (postId: string) => void;
  onComment?: (postId: string, comment: string) => void;
  onShare?: (postId: string) => void;
  onEdit?: (postId: string, newContent: string, mediaFile?: File) => void;
  onDelete?: (postId: string) => void;
}

const SocialPost: React.FC<SocialPostProps> = ({
  postId,
  author,
  content,
  timestamp,
  likes,
  comments,
  shares,
  channel,
  event,
  taggedUsers,
  isLiked = false,
  isOwnPost = false,
  onLike,
  onComment,
  onShare,
  onEdit,
  onDelete
}) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likes);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const navigate = useNavigate();

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

  const handleEditSave = () => {
    if (editContent.trim()) {
      onEdit?.(postId, editContent, selectedMedia || undefined);
      setIsEditing(false);
      setSelectedMedia(null);
      setMediaPreview(null);
    }
  };

  const handleEditCancel = () => {
    setEditContent(content);
    setIsEditing(false);
    setShowDeleteMenu(false);
  };

  const handleDelete = () => {
    onDelete?.(postId);
    setShowDeleteMenu(false);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
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
          
          {isOwnPost && (
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditCancel}
                    className="text-gray-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditSave}
                    disabled={!editContent.trim()}
                    className="text-green-500"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Post</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this post? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="text-gray-500"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {isEditing ? (
          <div className="mb-4 space-y-3">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[100px]"
              placeholder="Edit your post..."
            />
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedMedia(file);
                    setMediaPreview(URL.createObjectURL(file));
                  }
                }}
                className="hidden"
                id="media-upload"
              />
              <label
                htmlFor="media-upload"
                className="flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-md cursor-pointer hover:bg-secondary/80"
              >
                <Upload className="h-4 w-4" />
                Attach Media
              </label>
            </div>
            {mediaPreview && (
              <div className="relative">
                <img src={mediaPreview} alt="Preview" className="max-w-full h-auto rounded-md" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedMedia(null);
                    setMediaPreview(null);
                  }}
                  className="absolute top-2 right-2 bg-black/50 text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="mb-4">{content}</p>
        )}
        
        {/* Channel, Event, and Tagged Users Information */}
        {(channel || event || (taggedUsers && taggedUsers.length > 0)) && (
          <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b">
            {channel && (
              <Badge 
                variant="secondary" 
                className="flex items-center gap-1 cursor-pointer hover:bg-secondary/80"
                onClick={() => navigate(`/channel/${channel.id}`)}
              >
                <Hash className="h-3 w-3" />
                {channel.name}
              </Badge>
            )}
            {event && (
              <Badge 
                variant="secondary" 
                className="flex items-center gap-1 cursor-pointer hover:bg-secondary/80"
                onClick={() => navigate(`/event/${event.id}`)}
              >
                <Calendar className="h-3 w-3" />
                {event.name}
              </Badge>
            )}
            {taggedUsers && taggedUsers.length > 0 && (
              <Badge 
                variant="secondary" 
                className="flex items-center gap-1 cursor-pointer hover:bg-secondary/80"
                onClick={() => {
                  if (taggedUsers.length === 1) {
                    navigate(`/profile/${taggedUsers[0].id}`);
                  }
                }}
              >
                <Users className="h-3 w-3" />
                {taggedUsers.length === 1 
                  ? `@${taggedUsers[0].username}`
                  : `${taggedUsers.length} tagged`
                }
              </Badge>
            )}
          </div>
        )}
        
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