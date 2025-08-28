import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Plane } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSupabaseChatMessages } from "@/hooks/useSupabaseChatMessages";

interface LiveChatSectionProps {
  className?: string;
  eventId: string;
}

const LiveChatSection: React.FC<LiveChatSectionProps> = ({
  className,
  eventId,
}) => {
  const {
    messages,
    loading: messagesLoading,
    sendMessage,
    canSend,
  } = useSupabaseChatMessages(eventId);
  console.log(messages);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      const scrollContainer = messagesEndRef.current.closest(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || loading || !canSend) return;

    setLoading(true);
    const messageContent = newMessage.trim();

    try {
      await sendMessage(messageContent);
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <Card className={className}>
      <CardHeader className="p-3 sm:p-3">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>Live Chat ({messages.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-3 space-y-4">
        {/* Messages Display */}
        <div className="space-y-4">
          {messagesLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs sm:text-sm">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs sm:text-sm">No messages yet</p>
            </div>
          ) : (
            <ScrollArea className="h-32 sm:h-48 w-full scroll-y-auto">
              <div className="space-y-2 pr-2">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className="flex gap-2 p-2 rounded-lg bg-muted/50"
                  >
                    <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                      {message.profile_picture_url ? (
                        <AvatarImage
                          src={message.profile_picture_url}
                          alt={message.display_name}
                        />
                      ) : (
                        <AvatarFallback className="text-xs">
                          {getInitials(message.display_name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-xs sm:text-sm truncate">
                          {message.display_name}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm break-words">
                        {message.message}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSubmitMessage} className="space-y-2">
          <div className="relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Send a message..."
              className="pr-10 text-xs sm:text-sm"
              disabled={loading || !canSend}
            />
            <Button
              type="submit"
              size="sm"
              disabled={loading || !newMessage.trim() || !canSend}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            >
              <Plane className="h-3 w-3 rotate-45" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default LiveChatSection;
