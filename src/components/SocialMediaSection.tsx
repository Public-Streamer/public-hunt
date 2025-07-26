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

      const formattedPosts: Post[] = [];
      
      for (const post of data || []) {
        // Fetch channel info if channel_id exists
        let channelData = null;
        if (post.channel_id) {
          const { data: channel } = await supabase
            .from('channels')
            .select('id, name')
            .eq('id', post.channel_id)
            .single();
          channelData = channel;
        }

        // Fetch event info if event_id exists
        let eventData = null;
        if (post.event_id) {
          const { data: event } = await supabase
            .from('events')
            .select('id, name')
            .eq('id', post.event_id)
            .single();
          eventData = event;
        }

        // Fetch tagged users
        const { data: taggedUsers } = await supabase
          .from('user_tags')
          .select(`
            tagged_user_id
          `)
          .eq('post_id', post.id);

        const formattedTaggedUsers = [];
        if (taggedUsers && taggedUsers.length > 0) {
          for (const tag of taggedUsers) {
            const { data: userProfile } = await supabase
              .from('user_profiles')
              .select('id, display_name, username')
              .eq('id', tag.tagged_user_id)
              .single();
            
            if (userProfile) {
              formattedTaggedUsers.push({
                id: tag.tagged_user_id,
                name: userProfile.display_name || 'Unknown User',
                username: userProfile.username || 'unknown'
              });
            }
          }
        }

        formattedPosts.push({
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
          channel: channelData,
          event: eventData,
          taggedUsers: formattedTaggedUsers,
          isLiked: false
        });
      }

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

      // Reload posts to get the complete information including channel, event, and tagged users
      await loadPosts();
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
        <TabsList className="grid w-full grid-cols-1">
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
            entityId={eventId || channelId || ""}
            entityType={type}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialMediaSection;