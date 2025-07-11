import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SocialFeed from './SocialFeed';
import CommentSection from './CommentSection';
import { supabase } from '@/lib/supabase';

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

interface Comment {
  id: string;
  author: {
    name: string;
    avatar?: string;
    username: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  isLiked?: boolean;
  replies?: Comment[];
}

interface SocialMediaSectionProps {
  eventId?: string;
  channelId?: string;
  type: 'event' | 'channel';
}

const SocialMediaSection: React.FC<SocialMediaSectionProps> = ({ eventId, channelId, type }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
    loadComments();
  }, [eventId, channelId]);

  const loadPosts = async () => {
    try {
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (eventId) {
        query = query.eq('event_id', eventId);
      } else if (channelId) {
        query = query.eq('channel_id', channelId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const formattedPosts: Post[] = data?.map(post => ({
        id: post.id,
        author: {
          name: post.author_name,
          username: post.author_username,
          avatar: post.author_avatar
        },
        content: post.content,
        timestamp: new Date(post.created_at).toLocaleString(),
        likes: post.likes_count || 0,
        comments: post.comments_count || 0,
        shares: post.shares_count || 0,
        isLiked: false
      })) || [];

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedComments: Comment[] = data?.map(comment => ({
        id: comment.id,
        author: {
          name: comment.author_name,
          username: comment.author_username,
          avatar: comment.author_avatar
        },
        content: comment.content,
        timestamp: new Date(comment.created_at).toLocaleString(),
        likes: comment.likes_count || 0,
        isLiked: false,
        replies: []
      })) || [];

      setComments(formattedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleCreatePost = async (content: string) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          content,
          author_name: 'Current User',
          author_username: 'currentuser',
          event_id: eventId,
          channel_id: channelId,
          post_type: type
        })
        .select()
        .single();

      if (error) throw error;

      const newPost: Post = {
        id: data.id,
        author: {
          name: data.author_name,
          username: data.author_username,
          avatar: data.author_avatar
        },
        content: data.content,
        timestamp: new Date(data.created_at).toLocaleString(),
        likes: 0,
        comments: 0,
        shares: 0,
        isLiked: false
      };

      setPosts([newPost, ...posts]);
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('post_interactions')
        .upsert({
          post_id: postId,
          user_id: 'current_user',
          interaction_type: 'like'
        });

      if (error) throw error;
      loadPosts();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleAddComment = async (content: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          content,
          author_name: 'Current User',
          author_username: 'currentuser'
        });

      if (error) throw error;
      loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  if (loading) {
    return <div className="p-4">Loading social content...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posts">Posts & Updates</TabsTrigger>
          <TabsTrigger value="comments">Discussion</TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="space-y-4">
          <SocialFeed
            posts={posts}
            onCreatePost={handleCreatePost}
            onLikePost={handleLikePost}
            placeholder={`Share your thoughts about this ${type}...`}
          />
        </TabsContent>
        
        <TabsContent value="comments" className="space-y-4">
          <CommentSection
            comments={comments}
            onAddComment={handleAddComment}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialMediaSection;