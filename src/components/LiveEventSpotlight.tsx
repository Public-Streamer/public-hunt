import React, { useState, useEffect } from "react";
import { lazy, Suspense, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Eye, Clock, Loader } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLiveKitTrackSource } from "@/lib/livekitLazy";
import MainStreamPreview from "@/components/MainStreamPreview";
import MediaBackground from "@/components/MediaBackground";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppContext } from "@/contexts/AppContext";

interface LiveEvent {
  id: string;
  title: string;
  viewers: number;
  location?: string;
  timeRemaining?: string;
  thumbnail: string;
  slug?: string;
  mediaUrls?: string[];
  isLive?: boolean;
  isPast?: boolean;
}

interface StreamPreviewProps {
  event: any;
  eventName: string;
  fallbackImage: string;
}

// Lazy wrapper for LiveKitRoom to avoid static imports
const LiveKitRoomLazy = lazy(() =>
  import("@livekit/components-react").then((m) => ({ default: m.LiveKitRoom }))
);

// Lazy StreamContent that uses useTracks from @livekit/components-react
const StreamContentLazy = lazy(() =>
  import("@livekit/components-react").then((m) => {
    const { useTracks } = m;
    const Comp: React.FC<{
      eventName: string;
      fallbackImage: string;
      event: any;
    }> = ({ eventName, fallbackImage, event }) => {
      const [isMuted, setIsMuted] = useState(false);
      const TrackSource = useLiveKitTrackSource();
      const sources = TrackSource
        ? [TrackSource.Camera, TrackSource.ScreenShare]
        : [];

      const videoTracks = useTracks(sources, {
        updateOnlyOn: [],
        onlySubscribed: false,
      });

      const activeVideoTracks = videoTracks.filter(
        (track) => track.publication && track.participant.identity !== "viewer"
      );

      if (activeVideoTracks.length === 0) {
        return (
          <MediaBackground
            mediaUrls={[fallbackImage]}
            alt={eventName}
            className="w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
        );
      }

      return (
        <div className={`w-full h-full transition-all duration-500`}>
          <MainStreamPreview
            mediaUrls={event?.mediaUrls || []}
            track={activeVideoTracks[0] as any}
            eventName={eventName}
            isLive={true}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            eventId={event?.id}
          />
        </div>
      );
    };
    return { default: Comp };
  })
);

const StreamPreview: React.FC<StreamPreviewProps> = ({
  event,
  eventName,
  fallbackImage,
}) => {
  const fetchLiveKitToken = async () => {
    const { data, error } = await supabase.functions.invoke(
      "create-livekit-token",
      {
        body: {
          eventId: event.id,
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
      throw new Error(
        error.message === "Edge Function returned a non-2xx status code"
          ? "Login to watch live events"
          : "Error fetching token"
      );
    }
    return data;
  };

  const {
    data: tokenData,
    isLoading: isTokenLoading,
    error: tokenError,
  } = useQuery({
    queryKey: ["livekit-token", event.id],
    queryFn: fetchLiveKitToken,
    enabled: !!event.id,
  });

  const token = tokenData?.token || null;
  const serverUrl = tokenData?.serverUrl || "";

  if (isTokenLoading) {
    return (
      <div className="text-center py-12 flex justify-center items-center">
        {" "}
        <Loader className="animate-spin " />{" "}
      </div>
    );
  }
  if (tokenError) {
    return (
      <div className="text-center py-12 flex justify-center items-center bg-red-500">
        {tokenError.message}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Suspense fallback={<div className="w-full h-full" />}>
        <LiveKitRoomLazy
          token={token}
          serverUrl={serverUrl}
          connect={true}
          className="w-full h-full"
        >
          <StreamContentLazy
            eventName={eventName}
            fallbackImage={fallbackImage}
            event={event}
          />
        </LiveKitRoomLazy>
      </Suspense>

      <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-500 backdrop-blur-[1px] z-0">
        <div className="text-center text-white p-6 max-w-xs"></div>
      </div>
    </div>
  );
};

const LiveEventSpotlight: React.FC = () => {
  // Move this function above useQuery so it can be used inside queryFn
  const calculateTimeRemaining = (eventDate: string, eventTime: string) => {
    if (!eventDate || !eventTime) return undefined;
    const eventDateTime = new Date(`${eventDate}T${eventTime}`);
    const now = new Date();
    const diff = eventDateTime.getTime() - now.getTime();
    if (diff <= 0) return undefined;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };
  const { isAuthenticated } = useAppContext();

  // React Query for live events
  const {
    data: liveEvents = [],
    isLoading: isEventsLoading,
    error: eventsError,
  } = useQuery({
    queryKey: ["live-events", isAuthenticated],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_live", true)
        .order("viewer_count", { ascending: false })
        .limit(6);

      if (error) {
        console.log(error.message);
        throw new Error(error.message || "Error fetching live events");
      }

      return (
        data?.map((event) => ({
          id: event.id,
          title: event.name,
          viewers: event.viewer_count || 0,
          location: event.location,
          timeRemaining: calculateTimeRemaining(event.date, event.time),
          thumbnail: event?.media_urls?.[0],
          slug: event.slug,
          mediaUrls: event?.media_urls,
          isLive: event.is_live,
        })) || []
      );
    },
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("public:events-live-spotlight")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["live-events"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const navigate = useNavigate();
  const handleWatchNow = (event: any) => {
    const eventUrl = event.slug ? `/event/${event.slug}` : `/event/${event.id}`;
    navigate(eventUrl);
  };

  // Handle loading and error states
  if (isEventsLoading) {
    return (
      <div className="text-center py-12">
        <Loader className="animate-spin" />
      </div>
    );
  }
  if (eventsError) {
    return (
      <div className="text-center py-12">
        Error loading live events: {eventsError.message}
      </div>
    );
  }

  if (liveEvents.length === 0) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">🔥 Live Now - Trending</h2>
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No live events at the moment.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Check back soon for live streaming events!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">🔥 Live Now - Trending</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveEvents.map((event) => (
            <div
              onClick={() => handleWatchNow(event)}
              key={event.id}
              className="relative group cursor-pointer "
            >
              {/* Content overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-10">
                {/* Button with spacing */}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-right my-5 bg-white text-black"
                  onClick={() => handleWatchNow(event)}
                >
                  Watch Now
                </Button>
                <div className="space-y-1">
                  {/* Title with proper truncation */}
                  <h3
                    className="font-semibold text-sm leading-tight"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxHeight: "2.5rem",
                    }}
                    title={event.title}
                  >
                    {event.title}
                  </h3>

                  {/* Stats row with proper spacing */}
                  <div className="flex items-center justify-between text-xs gap-2">
                    {event.timeRemaining && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Clock className="h-3 w-3" />
                        <span className="whitespace-nowrap text-xs">
                          {event.timeRemaining}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Location with truncation */}
                  {event.location && (
                    <p
                      className="text-xs text-white/80 truncate"
                      title={event.location}
                    >
                      {event.location}
                    </p>
                  )}
                </div>
              </div>

              <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg overflow-hidden">
                <StreamPreview
                  event={event}
                  eventName={event.title}
                  fallbackImage={event.thumbnail}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Live badge */}
                {/* <Badge className="absolute top-3 left-3 bg-red-600 hover:bg-red-700 z-20 shadow-lg">
                  LIVE
                </Badge> */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveEventSpotlight;
