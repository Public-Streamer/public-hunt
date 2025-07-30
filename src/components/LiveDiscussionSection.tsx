import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { MessageCircle, Send, Smile } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import TooltipWrapper from "@/components/ui/tooltip-wrapper";
import { formatDistanceToNow } from "date-fns";
import { ReceivedChatMessage } from "@livekit/components-core";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@livekit/components-react";
import { supabase } from "@/integrations/supabase/client";

interface LiveDiscussionSectionProps {
  eventId: string;
  userProfile?: {
    id: string;
    username: string;
    display_name: string;
    profile_picture_url: string;
  };
}

interface ChatMessage {
  id: string;
  message: string;
  username: string;
  display_name: string;
  profile_picture_url?: string;
  created_at: string;
  user_id?: string;
  message_type: string;
  source: 'database' | 'livekit';
}

const LiveDiscussionSection: React.FC<LiveDiscussionSectionProps> = ({
  eventId,
  userProfile,
}) => {
  const { chatMessages, send } = useChat();

  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [historicalMessages, setHistoricalMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  const navigate = useNavigate();
  const { isAuthenticated } = useAppContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Load historical messages on component mount
  useEffect(() => {
    const loadHistoricalMessages = async () => {
      if (!eventId) return;
      
      setLoadingHistory(true);
      try {
        const { data, error } = await supabase
          .from('event_chat_messages')
          .select('*')
          .eq('event_id', eventId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error loading historical messages:', error);
        } else {
          const formattedMessages: ChatMessage[] = data.map(msg => ({
            id: msg.id,
            message: msg.message,
            username: msg.username,
            display_name: msg.display_name,
            profile_picture_url: msg.profile_picture_url,
            created_at: msg.created_at,
            user_id: msg.user_id,
            message_type: msg.message_type,
            source: 'database'
          }));
          setHistoricalMessages(formattedMessages);
        }
      } catch (error) {
        console.error('Error loading historical messages:', error);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistoricalMessages();
  }, [eventId]);

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel('event-chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_chat_messages',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          const newMessage: ChatMessage = {
            id: payload.new.id,
            message: payload.new.message,
            username: payload.new.username,
            display_name: payload.new.display_name,
            profile_picture_url: payload.new.profile_picture_url,
            created_at: payload.new.created_at,
            user_id: payload.new.user_id,
            message_type: payload.new.message_type,
            source: 'database'
          };
          
          setHistoricalMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  // Combine and sort messages from both sources
  useEffect(() => {
    const livekitMessages: ChatMessage[] = chatMessages.map((msg, index) => ({
      id: `livekit-${msg.timestamp}-${index}`,
      message: msg.message,
      username: getDisplayName(msg),
      display_name: getDisplayName(msg),
      profile_picture_url: undefined,
      created_at: new Date(msg.timestamp).toISOString(),
      user_id: undefined,
      message_type: 'user',
      source: 'livekit'
    }));

    const combined = [...historicalMessages, ...livekitMessages];
    combined.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    // Remove duplicates based on message content and timestamp (rough deduplication)
    const unique = combined.filter((msg, index, arr) => {
      return index === arr.findIndex(m => 
        m.message === msg.message && 
        Math.abs(new Date(m.created_at).getTime() - new Date(msg.created_at).getTime()) < 5000
      );
    });
    
    setAllMessages(unique);
  }, [historicalMessages, chatMessages]);

  // Save LiveKit messages to database
  useEffect(() => {
    const saveMessagesToDatabase = async () => {
      if (!isAuthenticated || !userProfile || chatMessages.length === 0) return;

      // Get the latest message that hasn't been saved yet
      const latestMessage = chatMessages[chatMessages.length - 1];
      if (!latestMessage) return;

      try {
        const { error } = await supabase
          .from('event_chat_messages')
          .insert({
            event_id: eventId,
            user_id: userProfile.id,
            username: userProfile.username,
            display_name: userProfile.display_name,
            profile_picture_url: userProfile.profile_picture_url,
            message: latestMessage.message,
            message_type: 'user'
          });

        if (error) {
          console.error('Error saving message to database:', error);
        }
      } catch (error) {
        console.error('Error saving message to database:', error);
      }
    };

    // Only save if we have new LiveKit messages
    if (chatMessages.length > 0) {
      saveMessagesToDatabase();
    }
  }, [chatMessages, eventId, isAuthenticated, userProfile]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    if (!showEmojiPicker) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isAuthenticated || loading) return;

    setLoading(true);
    try {
      await send(newMessage);
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitMessage(e);
    }
  };

  const getDisplayName = (message: ReceivedChatMessage) => {
    return message.from?.name || message.from?.identity || "Anonymous";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <Card className="sm:mx-2 my-2 border-0 shadow-none hover:shadow-none w-full  mx-auto">
      <CardHeader className="px-2 sm:px-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <MessageCircle className="w-5 h-5" />
          <span>Live Discussion ({allMessages.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-2 sm:px-6">
        {isAuthenticated ? (
          userProfile && (
            <form onSubmit={handleSubmitMessage} className="space-y-3 w-full">
              <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 w-full items-start">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={userProfile.profile_picture_url} />
                  <AvatarFallback>
                    {userProfile.display_name?.[0] || userProfile.username[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 w-full flex items-start gap-2 relative">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Add emoji"
                      className="p-1 rounded bg-transparent focus:outline-none absolute right-2 top-2"
                      onClick={() => setShowEmojiPicker((v) => !v)}
                      tabIndex={0}
                      ref={emojiButtonRef}
                    >
                      <span role="img" aria-label="emoji picker" className="text-xl">
                        <Smile className="w-5 h-5" />
                      </span>
                    </button>
                    {showEmojiPicker && (
                      <div ref={emojiPickerRef} className="absolute z-20 mt-12 sm:mt-10">
                        <Picker
                          data={data}
                          onEmojiSelect={(emoji: { native: string }) => {
                            if (textareaRef.current) {
                              const start = textareaRef.current.selectionStart;
                              const end = textareaRef.current.selectionEnd;
                              const before = newMessage.slice(0, start);
                              const after = newMessage.slice(end);
                              setNewMessage(before + emoji.native + after);
                              setTimeout(() => {
                                textareaRef.current?.focus();
                                textareaRef.current?.setSelectionRange(start + emoji.native.length, start + emoji.native.length);
                              }, 0);
                            } else {
                              setNewMessage((msg) => msg + emoji.native);
                            }
                            setShowEmojiPicker(false);
                          }}
                          theme="light"
                          style={{ position: 'absolute', left: 0 }}
                        />
                      </div>
                    )}
                  </div>
                  <Textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Join the live discussion..."
                    rows={2}
                    className="resize-none w-full text-base"
                  />
                </div>

              </div>
              <div className="flex justify-end w-full">
                <TooltipWrapper content="Send message to live discussion">
                  <Button
                    type="submit"
                    disabled={loading || !newMessage.trim()}
                    className="flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{loading ? "Sending..." : "Send"}</span>
                  </Button>
                </TooltipWrapper>
              </div>
            </form>
          )
        ) : (
          <div className="text-center py-4 border rounded-lg bg-muted/50 w-full">
            <p className="text-muted-foreground">
              <Button
                variant="link"
                onClick={() => {
                  const currentUrl =
                    window.location.pathname + window.location.search;
                  navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`);
                }}
                className="p-0 h-auto font-normal"
              >
                Sign in
              </Button>{" "}
              to join the live discussion
            </p>
          </div>
        )}

        {/* Messages Display */}
        <div className="space-y-4 w-full">
          {loadingHistory ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
              <p>Loading chat history...</p>
            </div>
          ) : allMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No messages yet. Be the first to start the discussion!</p>
            </div>
          ) : (
            <ScrollArea className="h-64 w-full pr-0 sm:pr-4" >
              <div className="space-y-3 w-full">
                {allMessages.map((message) => (
                  <div
                    key={message.id}
                    className="flex flex-col items-start gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg w-full bg-white/95 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="w-10 h-10 sm:w-10 sm:h-10 mt-0 sm:mt-1 sm:mx-0">
                        <AvatarImage src={message.profile_picture_url} />
                        <AvatarFallback>
                          {getInitials(message.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-xs truncate max-w-full">
                          {message.display_name}
                        </span>
                        <span className="text-xs text-muted-foreground truncate max-w-full">
                          {formatDistanceToNow(new Date(message.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 w-full">
                      <p className="font-medium text-md mt-1 break-words w-full">
                        {message.message}
                      </p>
                    </div>
                  </div>
                ))}
                <div />
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveDiscussionSection;
