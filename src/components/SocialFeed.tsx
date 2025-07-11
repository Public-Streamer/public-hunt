import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Image, Video, Smile, Send } from 'lucide-react';
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
  placeholder = "What's on your mind?"
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Create Post</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder={placeholder}
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="min-h-[100px] resize-none"
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex space-x-2">
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
                  className="bg-blue-600 hover:bg-blue-700"
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
            isLiked={post.isLiked}
            onLike={onLikePost}
            onComment={onCommentPost}
            onShare={onSharePost}
          />
        ))}
      </div>
    </div>
  );
};

export default SocialFeed;