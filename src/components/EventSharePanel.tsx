import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Share2,
  MessageCircle,
  Facebook,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Users2,
} from "lucide-react";
import { toast } from "sonner";
import { useScreenSize } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { getShareableEventUrl } from "@/lib/shareUtils";

interface EventSharePanelProps {
  eventId: string;
  eventTitle: string;
  eventDescription?: string;
}

const EventSharePanel: React.FC<EventSharePanelProps> = ({
  eventId,
  eventTitle,
  eventDescription,
}) => {
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [isPostingToAll, setIsPostingToAll] = useState(false);
  const [eventSlug, setEventSlug] = useState<string>("");
  const screenSize = useScreenSize();

  // Fetch event slug for better URL
  useEffect(() => {
    const fetchEventSlug = async () => {
      try {
        const { data } = await supabase
          .from("events")
          .select("slug")
          .eq("id", eventId)
          .single();

        if (data?.slug) {
          setEventSlug(data.slug);
        }
      } catch (error) {
        console.log("Could not fetch event slug:", error);
      }
    };

    fetchEventSlug();
  }, [eventId]);

  // Use shareable URL that includes meta tags for social media
  const shareUrl = getShareableEventUrl(eventId, eventSlug);

  const addCacheBuster = (u: string) =>
    `${u}${u.includes("?") ? "&" : "?"}cb=${Date.now()}`;

  const createShareMessage = (platform: string): string => {
    const baseMessage = `🚀 Join me for an exciting live event: "${eventTitle}"!`;
    const callToAction = `✨ Don't miss out - join the live experience now!`;
    const fullMessage = eventDescription
      ? `${baseMessage}\n\n📍 ${eventDescription}\n\n${callToAction}\n\n🔗 ${shareUrl}`
      : `${baseMessage}\n\n${callToAction}\n\n🔗 ${shareUrl}`;

    switch (platform) {
      case "twitter":
        return `${baseMessage} ${callToAction} ${shareUrl}`.substring(0, 280); // Twitter character limit
      case "whatsapp": {
        const waLink = addCacheBuster(shareUrl);
        return `🎯 *${eventTitle}* - Live Event Invitation!\n\n${
          eventDescription ? `📋 ${eventDescription}\n\n` : ""
        }${callToAction}\n\n${waLink}`;
      }
      case "email":
        return fullMessage;
      default:
        return fullMessage;
    }
  };

  const shareOptions = [
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-green-500",
      action: () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
          createShareMessage("whatsapp")
        )}`;
        window.open(whatsappUrl, "_blank");
        toast.success("WhatsApp opened with event link");
      },
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: Facebook,
      color: "bg-blue-600",
      action: () => {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          shareUrl
        )}&quote=${encodeURIComponent(createShareMessage("facebook"))}`;
        window.open(facebookUrl, "_blank");
        toast.success("Facebook post dialog opened");
      },
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: Share2,
      color: "bg-gradient-to-r from-purple-500 to-pink-500",
      action: () => {
        navigator.clipboard
          .writeText(createShareMessage("instagram"))
          .then(() => {
            window.open("https://www.instagram.com/", "_blank");
            toast.success("Message copied! Create Instagram post or story");
          });
      },
    },
    {
      id: "tiktok",
      name: "TikTok",
      icon: MessageCircle,
      color: "bg-black",
      action: () => {
        navigator.clipboard.writeText(createShareMessage("tiktok")).then(() => {
          window.open("https://www.tiktok.com/upload", "_blank");
          toast.success("Message copied! Create TikTok video");
        });
      },
    },
    {
      id: "twitter",
      name: "X (Twitter)",
      icon: MessageCircle,
      color: "bg-black",
      action: () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          createShareMessage("twitter")
        )}`;
        window.open(twitterUrl, "_blank");
        toast.success("X opened with event post");
      },
    },
    {
      id: "copy",
      name: "Copy Link",
      icon: copiedStates["copy"] ? Check : Copy,
      color: copiedStates["copy"] ? "bg-green-600" : "bg-gray-600",
      action: () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
          setCopiedStates((prev) => ({ ...prev, copy: true }));
          toast.success("Event link copied to clipboard");
          setTimeout(() => {
            setCopiedStates((prev) => ({ ...prev, copy: false }));
          }, 2000);
        });
      },
    },
  ];

  // const handlePostToAll = async () => {
  //   setIsPostingToAll(true);

  //   try {
  //     // Copy message to clipboard first
  //     await navigator.clipboard.writeText(createShareMessage("default"));

  //     // Open all social media platforms
  //     const platforms = [
  //       {
  //         url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
  //           shareUrl
  //         )}&quote=${encodeURIComponent(createShareMessage("facebook"))}`,
  //         name: "Facebook",
  //       },
  //       {
  //         url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
  //           createShareMessage("twitter")
  //         )}`,
  //         name: "Twitter",
  //       },
  //       { url: "https://www.instagram.com/", name: "Instagram" },
  //       { url: "https://www.tiktok.com/upload", name: "TikTok" },
  //     ];

  //     platforms.forEach((platform, index) => {
  //       setTimeout(() => {
  //         window.open(platform.url, "_blank");
  //       }, index * 500); // Stagger the opening to prevent popup blocks
  //     });

  //     toast.success(
  //       "All social media platforms opened! Message copied to clipboard."
  //     );
  //   } catch (error) {
  //     toast.error("Failed to copy message to clipboard");
  //   } finally {
  //     setTimeout(() => setIsPostingToAll(false), 3000);
  //   }
  // };

  return (
    <Card>
      <CardHeader className="p-3 sm:p-3">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
          Share Event
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-3">
        <div className="space-y-2">
          <p className="text-xs sm:text-sm text-muted-foreground">
            {screenSize === "mobile"
              ? "Share event:"
              : "Share this event with your audience:"}
          </p>
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
            <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-xs sm:text-sm font-mono truncate flex-1">
              {shareUrl}
            </span>
          </div>
        </div>
        {/* Post to All Button
        <Button
          onClick={handlePostToAll}
          disabled={isPostingToAll}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-xs sm:text-sm"
          size={screenSize === "mobile" ? "sm" : "lg"}
        >
          <Users2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          {isPostingToAll
            ? "Posting..."
            : screenSize === "mobile"
            ? "POST TO ALL"
            : "POST TO ALL PLATFORMS"}
        </Button> */}
        {/* Individual Platform Buttons */}
        <div
          className={`grid gap-2 ${
            screenSize === "mobile" ? "grid-cols-1" : "grid-cols-2"
          }`}
        >
          {shareOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                key={option.id}
                onClick={option.action}
                variant="outline"
                className={`flex items-center gap-2 h-auto p-2 sm:p-3 ${
                  screenSize === "mobile" ? "justify-start" : ""
                }`}
                disabled={copiedStates[option.id]}
                size={screenSize === "mobile" ? "sm" : "default"}
              >
                <div className={`p-1 rounded ${option.color} flex-shrink-0`}>
                  <Icon className="h-3 w-3 text-white" />
                </div>
                <span className="text-xs sm:text-sm truncate">
                  {option.name}
                </span>
              </Button>
            );
          })}
        </div>
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-xs">
              Host Only
            </Badge>
            <span className="truncate">
              {screenSize === "mobile"
                ? "Share event"
                : "Share your event across all platforms"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventSharePanel;
