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
  parent_comment_id?: string;
  reply_count: number;
  replies?: EventComment[];
}

export function useEventSocial(eventId: string, currentUserProfileId?: string | null) {
  const [likes, setLikes] = useState<EventLike[]>([]);
  const [comments, setComments] = useState<EventComment[]>([]);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [userLike, setUserLike] = useState<EventLike | null>(null);
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});
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
      
      // Check if current user liked (only if user is authenticated)
      if (currentUserProfileId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const currentUserLike = likesData?.find(like => like.user_id === user.id);
          setUserLike(currentUserLike || null);
        }
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
        .is('parent_comment_id', null) // Only fetch top-level comments
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
    setLoadingLikes(true);
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
        setLoadingLikes(false);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive"
      });
    }
    setLoadingLikes(false);
  }, [eventId, userLike, toast]);


  const addComment = useCallback(async (content: string, parentCommentId?: string) => {
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
        updated_at: new Date().toISOString(),
        parent_comment_id: parentCommentId,
        reply_count: 0
      };

      if (parentCommentId) {
        // For replies, update the parent comment's reply count optimistically
        setComments(prev => prev.map(comment => 
          comment.id === parentCommentId 
            ? { ...comment, reply_count: comment.reply_count + 1, replies: [...(comment.replies || []), tempComment] }
            : comment
        ));
      } else {
        // For top-level comments, add to main list
        setComments(prev => [...prev, tempComment]);
      }

      const { data: newComment, error } = await supabase
        .from('event_comments')
        .insert({
          event_id: eventId,
          user_profile_id: profile.id,
          content: content.trim(),
          author_name: profile.display_name || 'Unknown User',
          author_avatar: profile.profile_picture_url,
          parent_comment_id: parentCommentId
        })
        .select()
        .single();

      if (error) {
        // Rollback optimistic update
        if (parentCommentId) {
          setComments(prev => prev.map(comment => 
            comment.id === parentCommentId 
              ? { ...comment, reply_count: Math.max(0, comment.reply_count - 1), replies: (comment.replies || []).filter(r => r.id !== tempComment.id) }
              : comment
          ));
        } else {
          setComments(prev => prev.filter(comment => comment.id !== tempComment.id));
        }
        throw error;
      }

      // Replace temp comment with real one
      if (parentCommentId) {
        setComments(prev => prev.map(comment => 
          comment.id === parentCommentId 
            ? { ...comment, replies: (comment.replies || []).map(r => r.id === tempComment.id ? newComment : r) }
            : comment
        ));
      } else {
        setComments(prev => prev.map(comment => comment.id === tempComment.id ? newComment : comment));
      }
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

  const fetchReplies = useCallback(async (commentId: string) => {
    try {
      setLoadingReplies(prev => ({ ...prev, [commentId]: true }));
      const { data: repliesData, error } = await supabase
        .from('event_comments')
        .select('*')
        .eq('parent_comment_id', commentId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, replies: repliesData || [] }
          : comment
      ));
    } catch (error) {
      console.error('Error fetching replies:', error);
    } finally {
      setLoadingReplies(prev => ({ ...prev, [commentId]: false }));
    }
  }, []);

  const deleteComment = useCallback(async (commentId: string, parentCommentId?: string) => {
    try {
      let commentToDelete: EventComment | undefined;
      
      if (parentCommentId) {
        // Find reply to delete
        const parentComment = comments.find(c => c.id === parentCommentId);
        commentToDelete = parentComment?.replies?.find(r => r.id === commentId);
      } else {
        // Find top-level comment to delete
        commentToDelete = comments.find(c => c.id === commentId);
      }
      
      if (!commentToDelete) return;

      // Optimistic update
      if (parentCommentId) {
        setComments(prev => prev.map(comment => 
          comment.id === parentCommentId 
            ? { 
                ...comment, 
                reply_count: Math.max(0, comment.reply_count - 1),
                replies: (comment.replies || []).filter(r => r.id !== commentId) 
              }
            : comment
        ));
      } else {
        setComments(prev => prev.filter(comment => comment.id !== commentId));
      }

      const { error } = await supabase
        .from('event_comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        // Rollback optimistic update
        if (parentCommentId) {
          setComments(prev => prev.map(comment => 
            comment.id === parentCommentId 
              ? { 
                  ...comment, 
                  reply_count: comment.reply_count + 1,
                  replies: [...(comment.replies || []), commentToDelete!] 
                }
              : comment
          ));
        } else {
          setComments(prev => [...prev, commentToDelete!]);
        }
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
          const newComment = payload.new as EventComment;
          const oldComment = payload.old as EventComment;

          if (payload.eventType === 'INSERT') {
            if (!newComment.parent_comment_id) {
              // Top-level comment
              setComments(prev => {
                const exists = prev.find(comment => comment.id === newComment.id);
                return exists ? prev : [...prev, newComment];
              });
            } else {
              // Reply - update parent comment's replies
              setComments(prev => prev.map(comment => 
                comment.id === newComment.parent_comment_id 
                  ? { 
                      ...comment, 
                      replies: [...(comment.replies || []), newComment].sort((a, b) => 
                        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                      ) 
                    }
                  : comment
              ));
            }
          } else if (payload.eventType === 'DELETE') {
            if (!oldComment.parent_comment_id) {
              // Top-level comment
              setComments(prev => prev.filter(comment => comment.id !== oldComment.id));
            } else {
              // Reply - remove from parent's replies
              setComments(prev => prev.map(comment => 
                comment.id === oldComment.parent_comment_id 
                  ? { ...comment, replies: (comment.replies || []).filter(r => r.id !== oldComment.id) }
                  : comment
              ));
            }
          } else if (payload.eventType === 'UPDATE') {
            if (!newComment.parent_comment_id) {
              // Top-level comment
              setComments(prev => prev.map(comment => 
                comment.id === newComment.id ? newComment : comment
              ));
            } else {
              // Reply - update in parent's replies
              setComments(prev => prev.map(comment => 
                comment.id === newComment.parent_comment_id 
                  ? { ...comment, replies: (comment.replies || []).map(r => r.id === newComment.id ? newComment : r) }
                  : comment
              ));
            }
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
    loadingReplies,
    toggleLike,
    addComment,
    deleteComment,
    fetchReplies,
    refreshLikes: fetchLikes,
    refreshComments: fetchComments
  };
}