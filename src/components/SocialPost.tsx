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
  media_url?: string;
  media_type?: 'image' | 'video';
  channels?: {
    id: string;
    name: string;
  }[];
  events?: {
    id: string;
    name: string;
  }[];
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
  onEdit?: (postId: string, newContent: string, mediaFile?: File | null) => void;
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
  media_url,
  media_type,
  channels,
  events,
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
  const [showDeleteMedia, setShowDeleteMedia] = useState(false);
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
      onEdit?.(postId, editContent, showDeleteMedia ? null : (selectedMedia || undefined));
      setIsEditing(false);
      setSelectedMedia(null);
      setMediaPreview(null);
      setShowDeleteMedia(false);
    }
  };

  const handleEditCancel = () => {
    setEditContent(content);
    setIsEditing(false);
    setShowDeleteMenu(false);
    setSelectedMedia(null);
    setMediaPreview(null);
    setShowDeleteMedia(false);
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
            {(mediaPreview || (media_url && !showDeleteMedia)) && (
              <div className="relative">
                {media_type === 'video' ? (
                  <video
                    src={mediaPreview || media_url}
                    controls
                    className="max-w-full h-auto rounded-md"
                  />
                ) : (
                  <img src={mediaPreview || media_url} alt="Preview" className="max-w-full h-auto rounded-md" />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (mediaPreview) {
                      setSelectedMedia(null);
                      setMediaPreview(null);
                    } else {
                      setShowDeleteMedia(true);
                    }
                  }}
                  className="absolute top-2 right-2 bg-black/50 text-white hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
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
          </div>
        ) : (
          <div className="mb-4">
            {media_url && !showDeleteMedia && (
              <div className="mb-4 rounded-lg overflow-hidden">
                {media_type === 'video' ? (
                  <video
                    src={media_url}
                    controls
                    className="w-full max-h-96 object-cover"
                  />
                ) : (
                  <img
                    src={media_url}
                    alt="Post media"
                    className="w-full max-h-96 object-cover"
                  />
                )}
              </div>
            )}
            <p className="mb-4">{content}</p>
          </div>
        )}
        
        {/* Channel, Event, and Tagged Users Information */}
        {((channels && channels.length > 0) || (events && events.length > 0) || (taggedUsers && taggedUsers.length > 0)) && (
          <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b">
            {channels && channels.map((channel) => (
              <Badge 
                key={channel.id}
                variant="secondary" 
                className="flex items-center gap-1 cursor-pointer hover:bg-secondary/80"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Open in new tab to preserve post visibility
                  window.open(`/channels?channel=${channel.id}`, '_blank');
                }}
              >
                <Hash className="h-3 w-3" />
                {channel.name}
              </Badge>
            ))}
            {events && events.map((event) => (
              <Badge 
                key={event.id}
                variant="secondary" 
                className="flex items-center gap-1 cursor-pointer hover:bg-secondary/80"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Open in new tab to preserve post visibility
                  window.open(`/events?event=${event.id}`, '_blank');
                }}
              >
                <Calendar className="h-3 w-3" />
                {event.name}
              </Badge>
            ))}
            {taggedUsers && taggedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {taggedUsers.map((user) => (
                  <Badge 
                    key={user.id}
                    variant="secondary" 
                    className="flex items-center gap-1 cursor-pointer hover:bg-secondary/80"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Open in new tab to preserve post visibility
                      window.open(`/profile/${user.id}`, '_blank');
                    }}
                  >
                    <Users className="h-3 w-3" />
                    @{user.username}
                  </Badge>
                ))}
              </div>
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
          <div className="mt-4 border-t pt-4 max-w-full">
            <div className="flex space-x-3 w-full">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[60px] w-full resize-none"
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