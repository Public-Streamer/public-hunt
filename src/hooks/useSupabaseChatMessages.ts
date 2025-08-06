import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppContext } from "@/contexts/AppContext";

interface ChatMessage {
  id: string;
  user_id: string | null;
  username: string;
  display_name: string;
  profile_picture_url: string | null;
  message: string;
  message_type: string;
  created_at: string;
}

export const useSupabaseChatMessages = (eventId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const { currentUserProfile, isAuthenticated } = useAppContext();

  // Fetch existing messages
  const fetchMessages = useCallback(async () => {
    if (!eventId) return;

    try {
      const { data, error } = await supabase
        .from('event_chat_messages')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // Send message function
  const sendMessage = useCallback(async (messageContent: string) => {
    if (!messageContent.trim() || !currentUserProfile || !eventId || !isAuthenticated) {
      throw new Error('Cannot send message: missing required data');
    }

    try {
      const { error } = await supabase
        .from('event_chat_messages')
        .insert([{
          event_id: eventId,
          user_id: currentUserProfile.user_id,
          username: currentUserProfile.username || 'unknown',
          display_name: currentUserProfile.display_name || 'Anonymous',
          profile_picture_url: currentUserProfile.profile_picture_url || null,
          message: messageContent,
          message_type: 'user'
        }]);

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, [eventId, currentUserProfile, isAuthenticated]);

  // Set up real-time subscription
  useEffect(() => {
    if (!eventId) return;

    console.log(`🚀 [Chat-${eventId}] Setting up real-time subscription for event:`, eventId);
    setConnectionStatus('connecting');

    fetchMessages();

    // Create unique channel name per hook instance to avoid conflicts
    const channelName = `event-chat-messages-${eventId}-${Date.now()}-${Math.random()}`;
    console.log(`📡 [Chat-${eventId}] Creating channel:`, channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_chat_messages',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          console.log(`✅ [Chat-${eventId}] Received real-time message:`, payload.new);
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => {
            const updated = [...prev, newMessage];
            console.log(`📝 [Chat-${eventId}] Updated messages count:`, updated.length);
            return updated;
          });
        }
      )
      .subscribe((status) => {
        console.log(`🔄 [Chat-${eventId}] Subscription status:`, status);
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
          console.log(`🎉 [Chat-${eventId}] Successfully subscribed to real-time updates`);
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('error');
          console.error(`❌ [Chat-${eventId}] Channel subscription error`);
        } else if (status === 'TIMED_OUT') {
          setConnectionStatus('error');
          console.error(`⏰ [Chat-${eventId}] Channel subscription timed out`);
        } else if (status === 'CLOSED') {
          setConnectionStatus('disconnected');
          console.log(`🔌 [Chat-${eventId}] Channel subscription closed`);
        }
      });

    return () => {
      console.log(`🧹 [Chat-${eventId}] Cleaning up subscription for channel:`, channelName);
      supabase.removeChannel(channel);
      setConnectionStatus('disconnected');
    };
  }, [eventId, fetchMessages]);

  return {
    messages,
    loading,
    sendMessage,
    canSend: isAuthenticated && currentUserProfile,
    connectionStatus
  };
};