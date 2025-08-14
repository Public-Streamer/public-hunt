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

export const useSupabaseChatMessages = (eventId: string,  camName?: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("connecting");
  const { currentUserProfile, isAuthenticated, user } = useAppContext();
  
  if(camName === user?.email){
    camName = ""
  }

  // Fetch existing messages
  const fetchMessages = useCallback(async () => {
    if (!eventId) return;

    try {
      const { data, error } = await supabase
        .from("event_chat_messages")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // Send message function
  const sendMessage = useCallback(
    async (messageContent: string) => {
      if (
        !messageContent.trim() ||
        !currentUserProfile ||
        !eventId ||
        !isAuthenticated
      ) {
        throw new Error("Cannot send message: missing required data");
      }

      try {
        const { error } = await supabase.from("event_chat_messages").insert([
          {
            event_id: eventId,
            user_id: currentUserProfile.user_id,
            username: currentUserProfile.username || "unknown",
            display_name: camName ? camName : currentUserProfile.display_name || "Anonymous",
            profile_picture_url: currentUserProfile.profile_picture_url || null,
            message: messageContent,
            message_type: "user",
          },
        ]);

        if (error) {
          console.error("Error sending message:", error);
          throw error;
        }
      } catch (error) {
        console.error("Failed to send message:", error);
        throw error;
      }
    },
    [eventId, currentUserProfile, isAuthenticated, camName]
  );

  // Delete message function
  const deleteMessage = useCallback(
    async (messageId: string) => {
      console.log(messageId);
      if (!messageId || !isAuthenticated) {
        throw new Error("Cannot delete message: missing required data");
      }

      // Optimistic update - remove message from local state
      const messageToDelete = messages.find((msg) => msg.id === messageId);
      if (!messageToDelete) return; // Message already deleted or not found

      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));

      try {
        console.log("Message deleting...");
        const { error } = await supabase
          .from("event_chat_messages")
          .delete()
          .eq("id", messageId);

        console.log("Message deleted...");
        if (error) {
          console.error("Error deleting message:", error);
          // Rollback optimistic update
          // setMessages((prev) => {
          //   const updated = [...prev, messageToDelete].sort(
          //     (a, b) =>
          //       new Date(a.created_at).getTime() -
          //       new Date(b.created_at).getTime()
          //   );
          //   return updated;
          // });
          throw error;
        }
      } catch (error) {
        console.error("Failed to delete message:", error);
        throw error;
      }
    },
    [messages, isAuthenticated]
  );

  // Set up real-time subscription with optimized message handling
  useEffect(() => {
    if (!eventId) return;

    console.log(
      `🚀 [Chat-${eventId}] Setting up optimized real-time subscription for event:`,
      eventId
    );
    setConnectionStatus("connecting");

    fetchMessages();

    // Create unique channel name with timestamp to prevent conflicts
    const channelName = `event-chat-messages-${eventId}-${Date.now()}`;
    console.log(`📡 [Chat-${eventId}] Creating channel:`, channelName);

    let messageDebounceTimer: NodeJS.Timeout;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "event_chat_messages",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;

          // Debounce rapid message inserts to prevent UI lag
          clearTimeout(messageDebounceTimer);
          messageDebounceTimer = setTimeout(() => {
            setMessages((prev) => {
              // Check for duplicate messages to prevent double-adds
              const exists = prev.some(msg => msg.id === newMessage.id);
              if (exists) return prev;
              
              return [...prev, newMessage];
            });
          }, 50); // 50ms debounce for messages
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "event_chat_messages",
          filter: `event_id=eq.${eventId}`, // Add filter for better performance
        },
        (payload) => {
          const deletedMessageId = payload.old.id;
          setMessages((prev) => {
            const updated = prev.filter((msg) => msg.id !== deletedMessageId);
            return updated;
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected");
        } else if (status === "CHANNEL_ERROR") {
          setConnectionStatus("error");
        } else if (status === "TIMED_OUT") {
          setConnectionStatus("error");
        } else if (status === "CLOSED") {
          setConnectionStatus("disconnected");
        }
      });

    return () => {
      clearTimeout(messageDebounceTimer);
      supabase.removeChannel(channel);
      setConnectionStatus("disconnected");
    };
  }, [eventId, fetchMessages]);

  return {
    messages,
    loading,
    sendMessage,
    deleteMessage,
    canSend: isAuthenticated && currentUserProfile,
    connectionStatus,
  };
};
