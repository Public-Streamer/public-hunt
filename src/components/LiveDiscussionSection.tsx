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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

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
  const navigate = useNavigate();
  const { isAuthenticated } = useAppContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  // useEffect(() => {
  //   if (messagesEndRef.current) {
  //     messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  //   }
  // }, [chatMessages]);

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
          <span>Live Discussion ({chatMessages.length})</span>
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
          {chatMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No messages yet. Be the first to start the discussion!</p>
            </div>
          ) : (
            <ScrollArea className="h-64 w-full pr-0 sm:pr-4" >
              <div className="space-y-3 w-full">
                {chatMessages.map((message, index) => (
                  <div
                    key={`${message.timestamp}-${index}`}
                    className="flex flex-col items-start gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg w-full bg-white/95 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                    <Avatar className="w-10 h-10 sm:w-10 sm:h-10 mt-0 sm:mt-1  sm:mx-0">
                      <AvatarFallback>
                        {getInitials(getDisplayName(message))}
                      </AvatarFallback>
                    </Avatar>
                   <div className="flex flex-col">
                   <span className=" text-xs truncate max-w-full">
                          {getDisplayName(message)}
                        </span>
                    <span className="text-xs text-muted-foreground truncate max-w-full">
                          {formatDistanceToNow(new Date(message.timestamp), {
                            addSuffix: true,
                          })}
                        </span>
                   </div>
                    </div>
                    <div className="flex-1 min-w-0 w-full">
                      <p className="font-medium text-md mt-1 break-words w-full   ">
                        {message.message}
                      </p>
                    </div>
                    {/* If you want an edit or action button, place it here, top-right */}
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
