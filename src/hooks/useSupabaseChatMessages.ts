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
  const { userProfile, isAuthenticated } = useAppContext();

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
    if (!messageContent.trim() || !userProfile || !eventId || !isAuthenticated) {
      throw new Error('Cannot send message: missing required data');
    }

    try {
      const { error } = await supabase
        .from('event_chat_messages')
        .insert([{
          event_id: eventId,
          user_id: userProfile.user_id,
          username: userProfile.username || 'unknown',
          display_name: userProfile.display_name || 'Anonymous',
          profile_picture_url: userProfile.profile_picture_url || null,
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
  }, [eventId, userProfile, isAuthenticated]);

  // Set up real-time subscription
  useEffect(() => {
    if (!eventId) return;

    fetchMessages();

    // Create unique channel name per hook instance to avoid conflicts
    const channelName = `event-chat-messages-${eventId}-${Date.now()}-${Math.random()}`;
    
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
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, fetchMessages]);

  return {
    messages,
    loading,
    sendMessage,
    canSend: isAuthenticated && userProfile
  };
};