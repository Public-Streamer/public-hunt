import React, { useState } from 'react';
import { Image, Video, Smile, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import SocialPost from './SocialPost';

interface Post {
  id: string;
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
}

interface SocialFeedProps {
  posts: Post[];
  onCreatePost?: (content: string) => void;
  onLikePost?: (postId: string) => void;
  onCommentPost?: (postId: string, comment: string) => void;
  onSharePost?: (postId: string) => void;
  placeholder?: string;
}

const SocialFeed: React.FC<SocialFeedProps> = ({
  posts,
  onCreatePost,
  onLikePost,
  onCommentPost,
  onSharePost,
  placeholder = "What's on your mind?",
}) => {
  const [newPost, setNewPost] = useState('');

  const handleCreatePost = () => {
    if (newPost.trim()) {
      onCreatePost?.(newPost);
      setNewPost('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Create Post */}
      <Card className="w-full overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">Create Post</CardTitle>
        </CardHeader>
        <CardContent className="w-full overflow-hidden">
          <div className="flex space-x-3 w-full">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 w-full overflow-hidden">
              <Textarea
                placeholder={placeholder}
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="min-h-[100px] resize-none w-full max-w-full"
              />
              <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                <div className="flex space-x-2 flex-wrap">
                  <Button variant="ghost" size="sm" className="text-gray-500">
                    <Image className="h-4 w-4 mr-1" />
                    Photo
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-500">
                    <Video className="h-4 w-4 mr-1" />
                    Video
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-500">
                    <Smile className="h-4 w-4 mr-1" />
                    Emoji
                  </Button>
                </div>
                <Button
                  onClick={handleCreatePost}
                  disabled={!newPost.trim()}
                  className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Post
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.map((post) => (
          <SocialPost
            key={post.id}
            postId={post.id}
            author={post.author}
            content={post.content}
            timestamp={post.timestamp}
            likes={post.likes}
            comments={post.comments}
            shares={post.shares}
            media_url={post.media_url}
            media_type={post.media_type}
            channels={post.channels}
            events={post.events}
            taggedUsers={post.taggedUsers}
            isLiked={post.isLiked}
            isOwnPost={false}
            onLike={onLikePost}
            onComment={onCommentPost}
            onShare={onSharePost}
            onEdit={(postId, newContent) =>
              console.log('Edit post:', postId, newContent)
            }
            onDelete={(postId) => console.log('Delete post:', postId)}
          />
        ))}
      </div>
    </div>
  );
};

export default SocialFeed;
