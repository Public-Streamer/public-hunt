import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EventLike {
  id: string;
  event_id: string;
  user_id: string;
  display_name: string;
  created_at: string;
}

export interface EventComment {
  id: string;
  event_id: string;
  user_profile_id: string;
  content: string;
  author_name: string;
  author_avatar?: string;
  created_at: string;
  updated_at: string;
}

export function useEventSocial(eventId: string) {
  const [likes, setLikes] = useState<EventLike[]>([]);
  const [comments, setComments] = useState<EventComment[]>([]);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [userLike, setUserLike] = useState<EventLike | null>(null);
  const { toast } = useToast();

  const fetchLikes = useCallback(async () => {
    try {
      setLoadingLikes(true);
      const { data: likesData, error } = await supabase
        .from('event_likes')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setLikes(likesData || []);
      
      // Check if current user liked
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const currentUserLike = likesData?.find(like => like.user_id === user.id);
        setUserLike(currentUserLike || null);
      }
    } catch (error) {
      console.error('Error fetching likes:', error);
    } finally {
      setLoadingLikes(false);
    }
  }, [eventId]);

  const fetchComments = useCallback(async () => {
    try {
      setLoadingComments(true);
      const { data: commentsData, error } = await supabase
        .from('event_comments')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(commentsData || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  }, [eventId]);

  const toggleLike = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to like events",
          variant: "destructive"
        });
        return;
      }

      // Get user profile for display name
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name, id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        toast({
          title: "Profile not found",
          description: "Please complete your profile first",
          variant: "destructive"
        });
        return;
      }

      if (userLike) {
        // Unlike - optimistic update
        setUserLike(null);
        setLikes(prev => prev.filter(like => like.id !== userLike.id));

        const { error } = await supabase
          .from('event_likes')
          .delete()
          .eq('id', userLike.id);

        if (error) {
          // Rollback optimistic update
          setUserLike(userLike);
          setLikes(prev => [...prev, userLike]);
          throw error;
        }
      } else {
        // Like - optimistic update
        const tempLike: EventLike = {
          id: 'temp-' + Date.now(),
          event_id: eventId,
          user_id: user.id,
          display_name: profile.display_name || 'Unknown User',
          created_at: new Date().toISOString()
        };

        setUserLike(tempLike);
        setLikes(prev => [...prev, tempLike]);

        const { data: newLike, error } = await supabase
          .from('event_likes')
          .insert({
            event_id: eventId,
            user_id: user.id,
            user_profile_id: profile.id,
            display_name: profile.display_name || 'Unknown User'
          })
          .select()
          .single();

        if (error) {
          // Rollback optimistic update
          setUserLike(null);
          setLikes(prev => prev.filter(like => like.id !== tempLike.id));
          throw error;
        }

        // Replace temp like with real one
        setUserLike(newLike);
        setLikes(prev => prev.map(like => like.id === tempLike.id ? newLike : like));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive"
      });
    }
  }, [eventId, userLike, toast]);

  const addComment = useCallback(async (content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to comment",
          variant: "destructive"
        });
        return false;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name, profile_picture_url, id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        toast({
          title: "Profile not found",
          description: "Please complete your profile first",
          variant: "destructive"
        });
        return false;
      }

      // Optimistic update
      const tempComment: EventComment = {
        id: 'temp-' + Date.now(),
        event_id: eventId,
        user_profile_id: profile.id,
        content: content.trim(),
        author_name: profile.display_name || 'Unknown User',
        author_avatar: profile.profile_picture_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setComments(prev => [...prev, tempComment]);

      const { data: newComment, error } = await supabase
        .from('event_comments')
        .insert({
          event_id: eventId,
          user_profile_id: profile.id,
          content: content.trim(),
          author_name: profile.display_name || 'Unknown User',
          author_avatar: profile.profile_picture_url
        })
        .select()
        .single();

      if (error) {
        // Rollback optimistic update
        setComments(prev => prev.filter(comment => comment.id !== tempComment.id));
        throw error;
      }

      // Replace temp comment with real one
      setComments(prev => prev.map(comment => comment.id === tempComment.id ? newComment : comment));
      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
      return false;
    }
  }, [eventId, toast]);

  const deleteComment = useCallback(async (commentId: string) => {
    try {
      const commentToDelete = comments.find(c => c.id === commentId);
      if (!commentToDelete) return;

      // Optimistic update
      setComments(prev => prev.filter(comment => comment.id !== commentId));

      const { error } = await supabase
        .from('event_comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        // Rollback optimistic update
        setComments(prev => [...prev, commentToDelete]);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive"
      });
    }
  }, [comments, toast]);

  // Set up real-time subscriptions
  useEffect(() => {
    const likesChannel = supabase
      .channel(`event_likes:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_likes',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLikes(prev => {
              const exists = prev.find(like => like.id === payload.new.id);
              return exists ? prev : [...prev, payload.new as EventLike];
            });
          } else if (payload.eventType === 'DELETE') {
            setLikes(prev => prev.filter(like => like.id !== payload.old.id));
            if (payload.old.id === userLike?.id) {
              setUserLike(null);
            }
          }
        }
      )
      .subscribe();

    const commentsChannel = supabase
      .channel(`event_comments:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_comments',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setComments(prev => {
              const exists = prev.find(comment => comment.id === payload.new.id);
              return exists ? prev : [...prev, payload.new as EventComment];
            });
          } else if (payload.eventType === 'DELETE') {
            setComments(prev => prev.filter(comment => comment.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setComments(prev => prev.map(comment => 
              comment.id === payload.new.id ? payload.new as EventComment : comment
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [eventId, userLike?.id]);

  // Initial fetch
  useEffect(() => {
    fetchLikes();
    fetchComments();
  }, [fetchLikes, fetchComments]);

  return {
    likes,
    comments,
    userLike,
    loadingLikes,
    loadingComments,
    toggleLike,
    addComment,
    deleteComment,
    refreshLikes: fetchLikes,
    refreshComments: fetchComments
  };
}