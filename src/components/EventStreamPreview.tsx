import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LiveKitRoom, useRoomContext, useTracks } from "@livekit/components-react";
import type { LocalVideoTrack, RemoteVideoTrack } from "livekit-client";
import { useLiveKitTrackSource } from "@/lib/livekitLazy";
import MainStreamPreview from "@/components/MainStreamPreview";
import { useScreenSize } from "@/hooks/use-mobile";
import MediaBackground from "./MediaBackground";

interface EventStreamPreviewProps {
  eventId: string;
  eventName: string;
  isLive: boolean;
  fallbackImage?: string;
  hasAccess: boolean;
  mediaUrls: string[];
}

interface StreamPreviewProps {
  eventId: string;
  eventName: string;
  fallbackImage: string;
  mediaUrls: string[];
}

const StreamPreview: React.FC<StreamPreviewProps> = ({
  eventId,
  eventName,
  fallbackImage,
  mediaUrls,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string>("");
  const [isBlurred, setIsBlurred] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          "create-livekit-token",
          {
            body: {
              eventId,
              userRole: "viewer",
              permissions: {
                canPublish: false,
                canSubscribe: true,
                canPublishData: false,
              },
            },
          }
        );

        if (error) {
          console.error("Error fetching token:", error);
          return;
        }

        setToken(data.token);
        setServerUrl(data.serverUrl);
      } catch (error) {
        console.error("Error creating LiveKit token:", error);
      }
    };

    fetchToken();
  }, [eventId]);

  // 10-second preview timer
  useEffect(() => {
    if (token && serverUrl) {
      const timer = setTimeout(() => {
        setIsBlurred(true);
        setShowOverlay(true);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [token, serverUrl]);

  if (!token || !serverUrl) {
    return <MediaBackground mediaUrls={mediaUrls} className="h-full" />;
  }

  return (
    <div className="relative w-full h-full">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        className="w-full h-full"
      >
        <StreamContent
          mediaUrls={mediaUrls}
          eventName={eventName}
          fallbackImage={fallbackImage}
          isBlurred={isBlurred}
          eventId={eventId}
        />
      </LiveKitRoom>

      {showOverlay && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-500">
          <div className="text-center text-white p-4">
            <div className="text-lg font-semibold mb-2">Preview Ended</div>
            <div className="text-sm opacity-90">
              Buy admission to continue viewing
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StreamContent: React.FC<{
  eventName: string;
  fallbackImage: string;
  isBlurred: boolean;
  eventId: string;
  mediaUrls: string[];
}> = ({ eventName, fallbackImage, isBlurred, eventId, mediaUrls }) => {
  const [isMuted, setIsMuted] = useState(true);
  const [reconnectBump, setReconnectBump] = useState(0);
  const room = useRoomContext();
  const TrackSource = useLiveKitTrackSource();
  const sources = TrackSource
    ? [TrackSource.Camera, TrackSource.ScreenShare]
    : [];

  const videoTracks = useTracks(sources, {
    onlySubscribed: false,
  });

  const cameraOff = "/cameraOff.jpg";

  const activeVideoTracks = videoTracks.filter(
    (track) =>
      track.publication &&
      track.publication.track &&
      track.publication.kind === "video" &&
      track.participant.identity !== "viewer"
  );

  // Bump key on LiveKit room reconnection to force remount
  useEffect(() => {
    let cleanup = () => {};
    let mounted = true;
    (async () => {
      try {
        const lk = await import("livekit-client");
        if (!mounted || !room) return;
        const onReconnected = () => setReconnectBump((v) => v + 1);
        room.on(lk.RoomEvent.Reconnected, onReconnected);
        cleanup = () => {
          room.off(lk.RoomEvent.Reconnected, onReconnected);
        };
      } catch (e) {
        // Non-fatal if room context unavailable during initial mount
        console.debug(
          "[EventStreamPreview] Unable to attach Reconnected handler",
          e
        );
      }
    })();
    return () => {
      mounted = false;
      cleanup();
    };
  }, [room]);

  if (activeVideoTracks.length === 0) {
    return <MediaBackground mediaUrls={[cameraOff]} className="h-full" />;
  }

  const selected = activeVideoTracks[0];
  const pub = selected.publication;
  const mediaId = (
    pub?.track as LocalVideoTrack | RemoteVideoTrack | undefined
  )?.mediaStreamTrack?.id;
  const previewKey = `${mediaId ?? pub?.trackSid ?? "no-sid"}-${
    selected.participant?.identity ?? "no-id"
  }-r${reconnectBump}`;

  return (
    <div
      className={`w-full h-full transition-all duration-500 ${
        isBlurred ? "blur-md" : ""
      }`}
    >
      <MainStreamPreview
        key={previewKey}
        mediaUrls={mediaUrls}
        track={activeVideoTracks[0]}
        eventName={eventName}
        isLive={true}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        eventId={eventId}
      />
    </div>
  );
};

const EventStreamPreview: React.FC<EventStreamPreviewProps> = ({
  eventId,
  eventName,
  isLive,
  fallbackImage = "/placeholder.svg",
  hasAccess,
  mediaUrls,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const screenSize = useScreenSize();

  console.log("[EventStreamPreview] Component received props:", {
    eventId,
    eventName,
    isLive,
    hasAccess,
    mediaUrls: mediaUrls?.length,
  });

  // Don't show preview for non-live events or users who already have access
  if (!isLive || hasAccess) {
    console.log(
      "[EventStreamPreview] Returning null - isLive:",
      isLive,
      "hasAccess:",
      hasAccess
    );
    return null;
  }

  const handlePreviewClick = () => {
    setShowPreview(true);
  };

  return (
    <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg ">
      <div className="text-center space-y-4">
        {/* Preview Area */}
        <div className="aspect-video bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200 relative overflow-hidden">
          {showPreview ? (
            <StreamPreview
              eventId={eventId}
              eventName={eventName}
              fallbackImage={fallbackImage}
              mediaUrls={mediaUrls}
            />
          ) : (
            <div
              style={{
                backgroundImage: `url(${mediaUrls[0]})`,
                backgroundSize: "cover",
              }}
              className="flex flex-col items-center justify-center h-full space-y-4 bg-black/80"
            >
              <div className="flex flex-col justify-center items-center space-y-2 bg-black/80 w-full h-full">
                <Video className="h-16 w-16 text-purple-500" />
                <div className="text-white font-medium">
                  Show 10 Sec preview here
                </div>
                {isLive && (
                  <Badge className="bg-red-600 hover:bg-red-700 text-white">
                    LIVE
                  </Badge>
                )}
                {isLive && (
                  <div className="w-1/2">
                    <Button
                      size={screenSize === "mobile" ? "xs" : "sm"}
                      onClick={handlePreviewClick}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3"
                    >
                      Preview
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventStreamPreview;
