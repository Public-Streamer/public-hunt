import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import TooltipWrapper from "@/components/ui/tooltip-wrapper";
import { formatDistanceToNow } from "date-fns";
import { ReceivedChatMessage } from "@livekit/components-core";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@livekit/components-react";

interface LiveDiscussionSectionProps {
  userProfile?: {
    id: string;
    username: string;
    display_name: string;
    profile_picture_url: string;
  };
}

const LiveDiscussionSection: React.FC<LiveDiscussionSectionProps> = ({
  userProfile,
}) => {
  const { chatMessages, send } = useChat();

  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAppContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

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
    <Card className="mx-2 my-2 border-0 shadow-none hover:shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5" />
          <span>Live Discussion ({chatMessages.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAuthenticated ? (
          userProfile && (
            <form onSubmit={handleSubmitMessage} className="space-y-3">
              <div className="flex space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={userProfile.profile_picture_url} />
                  <AvatarFallback>
                    {userProfile.display_name?.[0] || userProfile.username[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Join the live discussion..."
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end">
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
          <div className="text-center py-4 border rounded-lg bg-muted/50">
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
        <div className="space-y-4">
          {chatMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No messages yet. Be the first to start the discussion!</p>
            </div>
          ) : (
            <ScrollArea className="h-64 w-full pr-4" ref={scrollAreaRef}>
              <div className="space-y-3">
                {chatMessages.map((message, index) => (
                  <div
                    key={`${message.timestamp}-${index}`}
                    className="flex space-x-3 p-3 border rounded-lg"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        {getInitials(getDisplayName(message))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm">
                          {getDisplayName(message)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.timestamp), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm mt-1 break-words">
                        {message.message}
                      </p>
                    </div>
                  </div>
                ))}
                <div  />
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveDiscussionSection;
