import React, { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  X,
  Plane,
  Maximize,
  Minimize,
  Trash2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useSupabaseChatMessages } from "@/hooks/useSupabaseChatMessages";
import { useAppContext } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import { useScreenSize } from "@/hooks/use-mobile";

interface InStreamChatOverlayProps {
  eventId: string;
  isVisible: boolean;
  onVisibilityToggle: () => void;
  isFullscreen?: boolean;
  showControls?: boolean;
  showFullscreenToggle?: boolean;
  onFullscreenToggle?: () => void;
  className?: string;
  eventHostId?: string;
  camName?: string;
}

const InStreamChatOverlay: React.FC<InStreamChatOverlayProps> = ({
  eventId,
  isVisible,
  onVisibilityToggle,
  isFullscreen = false,
  showControls = true,
  showFullscreenToggle = false,
  onFullscreenToggle,
  camName,
  className = "",
  eventHostId,
}) => {
  const { messages, sendMessage, deleteMessage } = useSupabaseChatMessages(eventId);
  const { currentUserProfile } = useAppContext();
  const screenSize = useScreenSize();
  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const [initialRender, setInitialRender] = useState(true);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(
    null
  );

  // Debug: log current user identity
  console.log("Chat user identity:", currentUserProfile?.display_name, currentUserProfile?.user_id);

  // Auto-scroll to bottom on initial render
  useEffect(() => {
    if (chatContainerRef.current && initialRender) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
      setInitialRender(false);
      setIsScrolledToBottom(true);
      setShowScrollDown(false);
    }
  }, [initialRender]);

  // Auto-scroll or show scroll down button on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      if (isScrolledToBottom) {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
        setShowScrollDown(false);
      } else {
        setShowScrollDown(true);
      }
    }
  }, [messages, isVisible]);

  // Handle scroll events to detect if user is at bottom
  const handleChatScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // 50px threshold
      setIsScrolledToBottom(isAtBottom);
      setShowScrollDown(!isAtBottom);
    }
  };

  const handleScrollDownClick = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
      setIsScrolledToBottom(true);
      setShowScrollDown(false);
    }
  };

  const handleSendMessage = async () => {
    if (chatMessage.trim()) {
      const messageContent = chatMessage.trim();

      try {
        await sendMessage(messageContent);
        setChatMessage("");
      } catch (error) {
        console.error("Failed to send chat message:", error);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    setDeletingMessageId(messageId);
    try {
      await deleteMessage(messageId);
      toast({
        title: "Message deleted",
        description: "The message has been removed from the chat.",
      });
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast({
        title: "Failed to delete message",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingMessageId(null);
    }
  };

  const isCurrentUserHost = currentUserProfile?.user_id === eventHostId;

  return (
    <div className={className}>
      {/* Chat Messages Overlay - Enhanced with Full History */}
      {isVisible && (
        <div
          ref={chatContainerRef}
          onScroll={handleChatScroll}
          className={`absolute bottom-0 left-0 h-full w-2/4 overflow-y-auto pointer-events-auto transition-opacity duration-300 bg-[linear-gradient(90deg,_rgba(0,60,84,0.8)_0%,_rgba(87,199,133,0)_99%)] ${
            isFullscreen && !showControls ? "opacity-0" : "opacity-100 z-0"
          }`}
          style={{
            scrollBehavior: "smooth",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255, 255, 255, 0.3) transparent",
          }}
        >
          {/* Scroll indicator for more messages above */}
          {messages.length > 0 && !isScrolledToBottom && (
            <div className="sticky top-0 z-10 bg-black/40 backdrop-blur-sm text-white text-xs text-center py-1 border-b border-white/20">
              ↑ Scroll up for more messages
            </div>
          )}

          <div className="flex flex-col p-2 pb-16 space-y-1 sm:space-y-2 min-h-full justify-end">
            {messages.length === 0 ? (
              <div className="text-white/60 text-xs text-center py-4">
                No messages yet. Be the first to chat!
              </div>
            ) : (
              messages.map((message, index) => {
                // Calculate opacity based on scroll position and message age
                const isRecent = index >= messages.length - 5;
                const baseOpacity = isRecent ? 1 : 0.8;

                return (
                  <div
                    key={`${message.id}-${index}`}
                    className="py-1.5 px-2 sm:px-3 text-white rounded-lg max-w-[45vw] sm:max-w-xs md:max-w-sm shadow-lg animate-fade-in transition-all duration-300 hover:bg-black/20 group"
                    style={{
                      wordWrap: "break-word",
                      hyphens: "auto",
                      opacity: baseOpacity,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-semibold text-blue-200 text-xs sm:text-sm leading-tight truncate max-w-full">
                          {message.display_name || "Anonymous"}
                        </span>
                        <span className="text-white text-xs sm:text-sm leading-relaxed break-words">
                          {message.message}
                        </span>
                      </div>
                      {isCurrentUserHost && (
                        <div className="flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-white/60 hover:text-red-400 hover:bg-red-900/20"
                                disabled={deletingMessageId === message.id}
                                aria-label="Delete message"
                              >
                                {deletingMessageId === message.id ? (
                                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete message
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Delete this message? This can't be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteMessage(message.id)
                                  }
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Scroll Down Button */}
      {/* {showScrollDown && (
        <button
          className="scroll-down-btn"
          onClick={handleScrollDownClick}
          style={{ position: "absolute", bottom: 60, right: 16, zIndex: 10 }}
        >
          Scroll Down
        </button>
      )} */}

      {/* Scroll to bottom button - Fixed position */}
      {isVisible && !isScrolledToBottom && messages.length > 0 && (
        <div
          className={`absolute bottom-12 left-2 bg-black/60 backdrop-blur-sm text-white rounded-full p-2 cursor-pointer hover:bg-black/80 transition-all duration-200 shadow-lg z-30 ${
            isFullscreen && !showControls ? "opacity-0" : "opacity-100"
          }`}
          onClick={() => {
            if (chatContainerRef.current) {
              chatContainerRef.current.scrollTop =
                chatContainerRef.current.scrollHeight;
            }
          }}
        >
          <span className="text-xs">↓</span>
        </div>
      )}

      {/* Unified Bottom Control Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 mt-3 z-20 ${
          isFullscreen && !showControls ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="flex items-center gap-2 rounded-lg p-2 shadow-lg">
          {/* Chat Input - Left Side */}
          {isVisible && (
            <div className="flex-1 relative max-w-xs">
              <Input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Send Message"
                className="w-full bg-black/20 backdrop-blur-sm text-white placeholder:text-white/80 h-2 md:h-10 text-xs rounded-lg pl-4 pr-10 focus-visible:ring-1 focus-visible:ring-white/40 focus-visible:ring-offset-0 focus-visible:border-white/40"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!chatMessage.trim()}
                size={screenSize === "mobile" ? "xs" : "sm"}
                className="absolute right-1 top-1 h-6 w-6 rounded-md bg-white/20 hover:bg-white/30 transition-all duration-200 border-none p-0"
              >
                <Plane className="h-4 w-4 text-white rotate-45" />
              </Button>
            </div>
          )}

          {/* Control Buttons - Right Side */}
          <div
            className={`flex items-center gap-2 ${
              !isVisible ? "flex-1 justify-start" : ""
            }`}
          >
            {/* Chat Toggle Button */}
            <Button
              onClick={onVisibilityToggle}
              size={screenSize === "mobile" ? "xs" : "sm"}
              variant="outline"
              className="bg-black/60 border-white/40 text-white hover:bg-black/80 h-5 px-3 shadow-lg backdrop-blur-sm"
            >
              {isVisible ? (
                <X className="h-4 w-4 mr-1" />
              ) : (
                <MessageCircle className="h-4 w-4 mr-1" />
              )}
              <span className="text-xs hidden sm:inline">
                {isVisible ? "Hide Chat" : "Show Chat"}
              </span>
            </Button>

            {/* Fullscreen Toggle Button */}
            {showFullscreenToggle && onFullscreenToggle && (
              <Button
                onClick={onFullscreenToggle}
                size={screenSize === "mobile" ? "xs" : "sm"}
                variant="outline"
                className="bg-black/60 border-white/40 text-white hover:bg-black/80 h-5 w-10 px-0 shadow-lg backdrop-blur-sm"
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InStreamChatOverlay;
