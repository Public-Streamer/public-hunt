import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppContext } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  user_id: string | null;
  username: string;
  display_name: string;
  profile_picture_url: string | null;
  message: string;
  message_type: string;
  created_at: string;
  reactions?: Record<string, number>; // Map of reaction_type -> count
  user_reaction?: string | null; // Current user's reaction
}

interface ReactionPayload {
  message_id: string;
  reaction_type: string;
  user_id: string;
}

export const useSupabaseChatMessages = (eventId: string, camName?: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({}); // userId -> displayName
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("connecting");
  const { currentUserProfile, isAuthenticated, user } = useAppContext();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const [bannedUsers, setBannedUsers] = useState<Set<string>>(new Set());

  // Always use authenticated user's identity, never contaminate with camName email addresses

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

  console.log(messages)

  let streamerName;
  if (camName == user?.email || "") {
    streamerName = currentUserProfile?.display_name;
  }
  else {
    streamerName = camName;
  }



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
            display_name: streamerName ? streamerName : currentUserProfile.display_name,
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
    [eventId, currentUserProfile, isAuthenticated, streamerName]
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

  // Set up real-time subscription
  useEffect(() => {
    if (!eventId) return;

    console.log(
      `🚀 [Chat-${eventId}] Setting up real-time subscription for event:`,
      eventId
    );
    setConnectionStatus("connecting");

    fetchMessages();

    // Create unique channel name per hook instance to avoid conflicts
    const channelName = `event-chat-messages-${eventId}-${Date.now()}-${Math.random()}`;
    console.log(`📡 [Chat-${eventId}] Creating channel:`, channelName);

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

          setMessages((prev) => {
            const updated = [...prev, newMessage];
            return updated;
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "event_chat_messages",
          // filter: `event_id=eq.${eventId}`,
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
      supabase.removeChannel(channel);
      setConnectionStatus("disconnected");
    };
  }, [eventId, fetchMessages]);

  // Subscribe to reactions
  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`message-reactions-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
        },
        async (payload) => {
          const messageId = (payload.new as any)?.message_id || (payload.old as any)?.message_id;
          if (!messageId) return;

          // Fetch updated reactions for this message
          const { data: reactions } = await supabase
            .from("message_reactions" as any)
            .select("reaction_type, user_id")
            .eq("message_id", messageId);

          const reactionCounts: Record<string, number> = {};
          (reactions as any[])?.forEach((r) => {
            reactionCounts[r.reaction_type] = (reactionCounts[r.reaction_type] || 0) + 1;
          });

          // Check if current user has reacted
          const userReaction = (reactions as any[])?.find((r) => r.user_id === user?.id)?.reaction_type || null;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? { ...msg, reactions: reactionCounts, user_reaction: userReaction }
                : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, user?.id]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`typing:${eventId}`)
      .on(
        'broadcast',
        { event: 'typing' },
        (payload) => {
          const { userId, displayName, isTyping } = payload.payload as {
            userId: string;
            displayName: string;
            isTyping: boolean;
          };

          // Don't show own typing indicator
          if (userId === user?.id) return;

          setTypingUsers((prev) => {
            const updated = { ...prev };
            if (isTyping) {
              updated[userId] = displayName;
              // Auto-clear after 3 seconds
              setTimeout(() => {
                setTypingUsers((current) => {
                  const { [userId]: _, ...rest } = current;
                  return rest;
                });
              }, 3000);
            } else {
              delete updated[userId];
            }
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, user?.id]);

  // Broadcast typing indicator
  const broadcastTyping = useCallback(
    (isTyping: boolean) => {
      if (!eventId || !currentUserProfile) return;

      const channel = supabase.channel(`typing:${eventId}`);
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: currentUserProfile.user_id,
          displayName: currentUserProfile.display_name,
          isTyping,
        },
      });
    },
    [eventId, currentUserProfile]
  );

  // Debounced typing handler
  const handleTyping = useCallback(() => {
    broadcastTyping(true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 500ms of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      broadcastTyping(false);
    }, 500);
  }, [broadcastTyping]);

  // Send reaction function
  const sendReaction = useCallback(
    async (messageId: string, reactionType: string) => {
      if (!isAuthenticated || !messageId) return;

      try {
        // Optimistic update
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id !== messageId) return msg;

            // Toggle logic imitation
            const currentCount = msg.reactions?.[reactionType] || 0;
            const hasReacted = msg.user_reaction === reactionType;

            // If already reacted with this type, remove it. If different type, switch it?
            // The edge function handles toggle.
            // Let's assume simple toggle for optimistic UI
            const newCount = hasReacted ? Math.max(0, currentCount - 1) : currentCount + 1;

            return {
              ...msg,
              reactions: {
                ...msg.reactions,
                [reactionType]: newCount
              },
              user_reaction: hasReacted ? null : reactionType
            };
          })
        );

        await supabase.functions.invoke("manage-event-messages", {
          body: {
            action: "react",
            eventId,
            messageId,
            reactionType,
          },
        });
      } catch (error) {
        console.error("Error sending reaction:", error);
      }
    },
    [eventId, isAuthenticated]
  );

  // Moderate user function
  const moderateUser = useCallback(
    async (action: 'ban' | 'timeout' | 'delete' | 'unban', targetUserId: string, messageId?: string, duration?: number) => {
      try {
        const { error } = await supabase.functions.invoke('manage-event-messages', {
          body: {
            action: 'moderate',
            eventId,
            userId: targetUserId,
            messageId, // Optional for unban/ban if just targeting user
            moderationType: action,
            duration
          }
        });

        if (error) throw error;

        toast({
          title: 'Moderation Action Applied',
          description: `${action.charAt(0).toUpperCase() + action.slice(1)} applied successfully`,
        });

        // Optimistic updates could be added here, but real-time subscription handles it
        if (action === 'ban') {
          setBannedUsers(prev => new Set(prev).add(targetUserId));
        }
      } catch (err) {
        console.error('Moderation error:', err);
        toast({
          title: 'Moderation Failed',
          description: 'Failed to apply moderation action. Please try again.',
          variant: 'destructive',
        });
      }
    },
    [eventId, toast]
  );

  return {
    messages: messages.filter(m => !bannedUsers.has(m.user_id)),
    loading,
    sendMessage,
    deleteMessage,
    sendReaction,
    typingUsers,
    handleTyping,
    moderateUser,
    canSend: isAuthenticated && currentUserProfile,
    connectionStatus,
    isBanned: user ? bannedUsers.has(user.id) : false,
  };
};
