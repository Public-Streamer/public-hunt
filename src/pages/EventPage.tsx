import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
  startTransition,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  ArrowLeft,
  Loader2,
  Flag,
} from "lucide-react";
import { LiveKitRoomLazy, RoomAudioRendererLazy } from "@/lib/livekitLazy";
import "@livekit/components-styles";
import SocialShareMenu from "@/components/SocialShareMenu";
import TicketPurchaseModal from "@/components/TicketPurchaseModal";
import StreamPreviewContainer from "@/components/StreamPreviewContainer";
import { ReportEventModal } from "@/components/ReportEventModal";
import { EventSocialSection } from "@/components/EventSocialSection";
import { useReportEvent } from "@/hooks/useReportEvent";
import { CustomScoreboard } from "@/components/CustomScoreboard";
import { PinnedMessageSection } from "@/components/PinnedMessageSection";
import EventStreamPreview from "@/components/EventStreamPreview";
import MediaBackground from "@/components/MediaBackground";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/AppContext";
import { useScoreboardTeams } from "@/hooks/useScoreboardTeams";
import { getShareableEventUrl } from "@/lib/shareUtils";
import { Database } from "@/integrations/supabase/types";
import { CoonhoundScorecardViewer } from "@/components/scorecard/CoonhoundScorecardViewer";
import { patchEvent } from "@/lib/eventStore";
import { useEventSelector } from "@/hooks/useEventData";
import { useQuery } from "@tanstack/react-query";
import LiveDiscussionSection from "@/components/LiveDiscussionSection";
import TrendingAnalyticsPanel from "@/components/TrendingAnalyticsPanel";
import { ViewerCountDisplay } from "@/components/ViewerCountDisplay";
import IntegratedViewerInterface from "@/components/IntegratedViewerInterface";
import ViewerInterface from "@/components/livekit/ViewerInterface";
import PermissionGuard from "@/components/access/PermissionGuard";
import { downloadEventICS, detectUserTimezone, formatDateInTimezone } from "@/lib/calendarUtils";
import { BulletinBoard } from "@/components/bulletin/BulletinBoard";
import { CalendarPlus } from "lucide-react";

type EventData = Database["public"]["Tables"]["events"]["Row"];

const EventPage: React.FC = () => {
  console.log("[EventPage] Component render started");

  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser, currentUserProfile: currentUserProfile } =
    useAppContext();
  const [loading, setLoading] = useState(false);
  const [hasTicket, setHasTicket] = useState(false);
  const [checkingTicket, setCheckingTicket] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [isStreamer, setIsStreamer] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Separate state for frequently changing data to prevent full re-renders

  // const eventData = useEventSelector((e) => e);
  // console.log("eventData", eventData);

  const {
    data: eventData,
    isLoading: isLoadingEvent,
    isFetching: isFetchingEvent,
    error: eventError,
  } = useQuery<EventData>({
    queryKey: ["event-data", eventId],
    queryFn: () => fetchEventData(),
    enabled: !!eventId,
  });
  const checkTicketStatus = useCallback(async () => {
    if (!currentUser || !eventData?.id) return;

    // For free events, automatically grant access
    if (!eventData?.ticket_price || eventData?.ticket_price <= 0) {
      setHasTicket(true);
      return;
    }

    try {
      setCheckingTicket(true);
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("event_id", eventData?.id)
        .eq("user_id", currentUser.id)
        .eq("status", "active")
        .single();

      setHasTicket(!!data && !error);
    } catch (error) {
      console.error("Error checking ticket status:", error);
      setHasTicket(false);
    } finally {
      setCheckingTicket(false);
    }
  }, [currentUser, eventData]);

  const checkStreamerStatus = useCallback(async () => {
    if (!currentUser || !eventData?.id) return;

    try {
      const { data, error } = await supabase
        .from("event_streamers")
        .select("*")
        .eq("event_id", eventData?.id)
        .eq("streamer_id", currentUser.id)
        .single();

      setIsStreamer(!!data && !error);
    } catch (error) {
      console.error("Error checking streamer status:", error);
      setIsStreamer(false);
    }
  }, [currentUser, eventData?.id]);

  const isLive = useEventSelector((e) => e?.is_live ?? eventData?.is_live);
  // const isLive = eventData?.is_live;

  // console.log("eventData", eventData);

  // console.log("isLive", isLive);

  // Hook to track scoreboard metadata changes (creation/deletion of scoreboards)
  // const { selectedGameType, scoreboardName } = useEventScoreboardMeta(
  //   eventData?.id || ""
  // );

  const metadata = useEventSelector((e) => e?.metadata);
  const selectedGameType = useMemo(() => {
    return metadata?.selectedGameType;
  }, [metadata]);

  // Hook to track scoreboard teams for conditional rendering
  const { hasTeams: hasCustomTeams } = useScoreboardTeams(
    eventData?.id || "",
    selectedGameType === "custom" ? "custom" : undefined
  );
  const { hasTeams: hasCoonHuntTeams } = useScoreboardTeams(
    eventData?.id || "",
    selectedGameType === "coon_hunt" ? "coon_hunt" : undefined
  );

  // Determine if scoreboard should be visible
  const showScoreboard =
    selectedGameType &&
    ((selectedGameType === "custom" && hasCustomTeams) ||
      (selectedGameType === "coon_hunt" && hasCoonHuntTeams));

  useEffect(() => {
    if (currentUser?.id && eventData?.id) {
      checkStreamerStatus();
      checkTicketStatus();
    }
  }, [currentUser?.id, eventData?.id, checkStreamerStatus, checkTicketStatus]);

  // Optimized real-time subscription for essential event updates only
  useEffect(() => {
    if (!eventData?.id) return;

    const subscription = supabase
      .channel(`event-page-${eventData?.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "events",
          filter: `id=eq.${eventData?.id}`,
        },
        (payload) => {
          // console.log("[EventPage] Real-time event update received:", payload);
          const src = payload.new as EventData;
          // console.log("[EventPage] Real-time event update received:", src);
          patchEvent({
            is_live: src.is_live,
            metadata: src.metadata,
            // viewer_count: src.viewer_count,
          });
        }
      )
      .subscribe();

    return () => {
      console.log("[EventPage] Cleaning up real-time subscription");
      subscription.unsubscribe();
    };
  }, [eventData?.id]);

  // Memoized derived variables to prevent unnecessary re-calculations
  const isEventHost = useMemo(
    () =>
      currentUser?.id &&
      eventData?.id &&
      currentUser.id === eventData?.created_by,
    [currentUser?.id, eventData?.id, eventData?.created_by]
  );

  const canEnterStage = useMemo(
    () => isEventHost || isStreamer,
    [isEventHost, isStreamer]
  );

  const isViewer = useMemo(
    () => !!currentUser?.id && !isEventHost && !isStreamer,
    [currentUser?.id, isEventHost, isStreamer]
  );

  const {
    alreadyReported: hasReported,
    loading: reportStatusLoading,
    checkStatus: refreshReportStatus,
  } = useReportEvent({
    eventId: eventData?.id || "",
    enabled: !!(eventData?.id && isViewer),
  });

  const generateViewerToken = useCallback(async () => {
    if (!currentUser?.id || !eventData?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke(
        "create-livekit-token",
        {
          body: {
            eventId: eventData?.id,
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
        console.error("Error generating viewer token:", error);
        return;
      }

      if (!data?.token || !data?.roomName || !data?.serverUrl) {
        console.error("Invalid token response");
        return;
      }

      setLivekitToken(data.token);
      setRoomName(data.roomName);
      setServerUrl(data.serverUrl);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error generating viewer token:", error);
    }
  }, [currentUser?.id, eventData?.id]);

  // Generate LiveKit token for viewers when they have access
  useEffect(() => {
    if (
      currentUser?.id &&
      eventData?.id &&
      isLive &&
      (canEnterStage || hasTicket)
    ) {
      generateViewerToken();
    }
  }, [
    currentUser?.id,
    eventData?.id,
    isLive,
    hasTicket,
    canEnterStage,
    generateViewerToken,
  ]);

  const fetchEventData = async () => {
    try {
      // Import utility functions
      const { parseEventIdentifier } = await import("@/lib/eventUtils");
      const { isUuid, identifier } = parseEventIdentifier(eventId!);

      // Fetch event data by UUID or slug
      const eventQuery = isUuid
        ? supabase.from("events").select("*, metadata").eq("id", identifier)
        : supabase.from("events").select("*, metadata").eq("slug", identifier);

      const { data: eventData, error: eventError } = await eventQuery.single();

      if (eventError) {
        console.error("Error fetching event:", eventError);
        toast({
          title: "Error",
          description: "Failed to load event details",
          variant: "destructive",
        });
        return;
      }

      // Then fetch the host's Stripe account if event exists
      let hostStripeAccountId = null;
      if (eventData?.created_by) {
        const { data: stripeAccount } = await supabase
          .from("host_stripe_accounts")
          .select("stripe_account_id")
          .eq("user_id", eventData?.created_by)
          .single();

        hostStripeAccountId = stripeAccount?.stripe_account_id || null;
      }

      // Combine the data
      const eventWithStripeAccount = {
        ...eventData,
        host_stripe_account_id: hostStripeAccountId,
      };
      return eventWithStripeAccount;
    } catch (error) {
      console.error("Error fetching event data:", error);
      throw error;
    }
  };

  // Memoized event URL to prevent recalculation
  const eventUrl = useMemo(
    () =>
      eventData?.slug
        ? `${window.location.origin}/event/${eventData?.slug}`
        : `${window.location.origin}/event/${eventId}`,
    [eventData?.slug, eventId]
  );

  // Share URL for crawlers and social platforms (Edge Function)
  const shareUrl = useMemo(() => {
    if (!eventData?.id) return `${window.location.origin}`;
    return getShareableEventUrl(eventData?.id, eventData?.slug);
  }, [eventData?.id, eventData?.slug]);

  const handlePayment = useCallback(() => {
    if (!currentUser?.id) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to purchase tickets",
        variant: "destructive",
      });
      navigate(
        `/login?redirect=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }
    startTransition(() => setShowPurchaseModal(true));
  }, [currentUser?.id, navigate, toast]);

  const handleWatchNow = useCallback(() => {
    if (!currentUser?.id) {
      startTransition(() =>
        navigate(
          `/login?redirect=${encodeURIComponent(window.location.pathname)}`
        )
      );
      return;
    }
    // User is logged in but may need to purchase ticket
    if (!hasTicket && eventData?.ticket_price && eventData?.ticket_price > 0) {
      handlePayment();
    }
  }, [
    currentUser?.id,
    navigate,
    hasTicket,
    eventData?.ticket_price,
    handlePayment,
  ]);

  const handleReportClick = useCallback(() => {
    if (!currentUser?.id) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to report this event",
        variant: "destructive",
      });
      navigate(
        `/login?redirect=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }
    setShowReportModal(true);
  }, [currentUser?.id, navigate, toast]);

  const handlePurchaseSuccess = () => {
    setHasTicket(true);
    checkTicketStatus(); // Refresh ticket status
    toast({
      title: "Success!",
      description: "Your ticket has been purchased successfully",
    });
  };

  const goToStage = () => {
    // Use slug if available, otherwise use event ID
    const stageUrl = eventData?.slug
      ? `/stage/${eventData?.slug}`
      : `/stage/${eventData?.id || eventId}`;
    startTransition(() => navigate(stageUrl));
  };

  const goBackToEvents = () => {
    startTransition(() => navigate("/events"));
  };

  const AdmissionButton = () => {
    if (checkingTicket) {
      return (
        <Button disabled className="w-full text-lg py-3">
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Checking access...
        </Button>
      );
    }

    if (canEnterStage) {
      return (
        <Button
          onClick={goToStage}
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-lg py-3"
        >
          Enter Stage {isEventHost ? "(Host)" : "(Streamer)"}
        </Button>
      );
    }

    // For paid events without tickets, show purchase button
    if (!hasTicket && eventData?.ticket_price && eventData?.ticket_price > 0) {
      return (
        <Button
          onClick={handlePayment}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg py-3"
          disabled={!eventData}
        >
          Buy Admission - ${eventData?.ticket_price || 0}
        </Button>
      );
    }

    // For users with tickets to paid events, show access confirmation
    // if (hasTicket && eventData?.ticket_price && eventData?.ticket_price > 0) {
    //   return (
    //     <div className="w-full text-center">
    //       <Badge className="bg-green-600 text-white text-sm px-4 py-2">
    //         ✓ You have paid ${eventData?.ticket_price} for this event
    //       </Badge>
    //     </div>
    //   );
    // }

    // For non-logged users, show "Watch Now" button
    if (!currentUser?.id) {
      return (
        <Button
          onClick={handleWatchNow}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg py-3"
        >
          Watch Now
        </Button>
      );
    }

    // For viewers with access (free events or paid with tickets), no navigation button needed
    // They watch the event directly on this page
    return null;
  };

  if (isLoadingEvent || isFetchingEvent || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (eventError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <p className="text-gray-600 mb-4">
            The event you're looking for doesn't exist.
          </p>
          <Button onClick={goBackToEvents} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  const mediaData =
    eventData?.media_urls?.map((url, index) => ({
      id: index.toString(),
      type: url.endsWith(".mp4") ? ("video" as const) : ("image" as const),
      url,
      title: `Media ${index + 1}`,
      thumbnail: url.endsWith(".mp4") ? "/placeholder.gif" : url,
    })) || [];

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
      {/* Back to Events Button */}
      <div className="mb-4 sm:mb-6">
        <Button
          onClick={goBackToEvents}
          variant="outline"
          className="flex items-center gap-2 hover:bg-gray-50 text-xs sm:text-sm"
          size="sm"
        >
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          Back to Events
        </Button>
      </div>
      {/* Page Title */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center px-2">
          {eventData?.name}
        </h1>
      </div>
      {/* Responsive Layout */}
      <div className="space-y-4 sm:space-y-6">
        {/* Admission Button Section */}
        <div className="w-full">
          <AdmissionButton />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Main Event Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Event Preview Card - Use IntegratedViewerInterface for live streams */}
            <Card className="overflow-hidden">
              {isLive && roomName && livekitToken && serverUrl ? (
                <Suspense
                  fallback={<div className="aspect-video w-full bg-black/5" />}
                >
                  <LiveKitRoomLazy
                    token={livekitToken}
                    serverUrl={serverUrl}
                    options={{
                      adaptiveStream: true,
                      dynacast: true,
                    }}
                    connect={true}
                  >
                    <ViewerInterface
                      eventId={eventData?.id}
                      eventName={eventData?.name}
                      isLive={isLive}
                      mediaUrls={eventData?.media_urls || ["/placeholder.gif"]}
                      eventHostId={eventData?.created_by}
                      showUpgradePrompt={true}
                    />
                    <RoomAudioRendererLazy />
                  </LiveKitRoomLazy>
                </Suspense>
              ) : (
                <>
                  {(() => {
                    const previewConditions = {
                      currentUser: !!currentUser,
                      hasTicketPrice:
                        !!eventData?.ticket_price &&
                        eventData?.ticket_price > 0,
                      noTicket: !hasTicket,
                      cannotEnterStage: !canEnterStage,
                      isLive: isLive,
                    };

                    console.log(
                      "[EventStreamPreview] Debug conditions:",
                      previewConditions
                    );
                    console.log(
                      "[EventStreamPreview] eventData?.ticket_price:",
                      eventData?.ticket_price
                    );
                    console.log("[EventStreamPreview] hasTicket:", hasTicket);
                    console.log(
                      "[EventStreamPreview] canEnterStage:",
                      canEnterStage
                    );
                    console.log("[EventStreamPreview] isLive:", isLive);
                    console.log(
                      "[EventStreamPreview] currentUser:",
                      !!currentUser
                    );

                    const shouldShowPreview =
                      currentUser &&
                      eventData?.ticket_price &&
                      eventData?.ticket_price > 0 &&
                      !hasTicket &&
                      !canEnterStage &&
                      isLive;

                    console.log("[EventStreamPreview] Should show preview:");

                    return shouldShowPreview;
                  })() ? (
                    <div className="relative aspect-video bg-black">
                      <EventStreamPreview
                        mediaUrls={
                          eventData?.media_urls || ["/placeholder.svg"]
                        }
                        eventId={eventData?.id}
                        eventName={eventData?.name}
                        isLive={isLive}
                        fallbackImage={
                          eventData?.media_urls?.[0] || "/placeholder.svg"
                        }
                        hasAccess={hasTicket || canEnterStage}
                      />
                    </div>
                  ) : (
                    <MediaBackground
                      mediaUrls={eventData?.media_urls || ["/placeholder.svg"]}
                      className="aspect-video "
                      enableModal={true}
                      autoIntervalMs={3000}
                    />
                  )}
                </>
              )}
            </Card>

            {/* Promotional Media */}
            {/* {mediaData.length > 0 && <MediaDisplay media={mediaData} />} */}

            {/* Offline Streams */}
            {/* {!isLive && (
              <OfflineStreamSection
                eventId={eventData?.id}
                hasPaid={hasTicket || canEnterStage}
              />
            )} */}
            {eventData && <EventSocialSection eventId={eventData.id} />}
            <LiveDiscussionSection
              eventId={eventData?.id}
              currentUserProfile={
                currentUserProfile
                  ? {
                    id: currentUserProfile.id,
                    username: currentUserProfile.display_name || "User",
                    display_name: currentUserProfile.display_name || "User",
                    profile_picture_url:
                      currentUserProfile.profile_picture_url || "",
                  }
                  : undefined
              }
            />
          </div>

          {/* Right Column - Event Details and Actions */}
          {/* Event Social Section */}

          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="p-3 sm:p-3">
                <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold break-words">
                  {eventData?.name}
                </CardTitle>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {eventData?.category && (
                    <Badge variant="secondary" className="text-xs">
                      {eventData?.category}
                    </Badge>
                  )}
                  {isLive && (
                    <Badge className="bg-red-600 text-white text-xs">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full mr-1 animate-pulse" />
                      LIVE
                    </Badge>
                  )}
                  {(!eventData?.ticket_price ||
                    eventData?.ticket_price <= 0) && (
                      <Badge className="bg-green-600 text-white text-xs">
                        Full Access (Free Event)
                      </Badge>
                    )}
                  {hasTicket &&
                    eventData?.ticket_price &&
                    eventData?.ticket_price > 0 ? (
                    <Badge className="bg-green-600 text-white text-xs">
                      ✓ Paid
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>

              <CardContent className="p-3 sm:p-3">
                <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6 break-words">
                  {eventData?.description}
                </p>

                {/* Event Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <div className="flex items-center text-xs sm:text-sm">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-gray-500 flex-shrink-0" />
                    <span className="truncate">{eventData?.date}</span>
                  </div>
                  <div className="flex items-center text-xs sm:text-sm">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-gray-500 flex-shrink-0" />
                    <span className="truncate">{eventData?.time}</span>
                  </div>
                  <div className="flex items-center text-xs sm:text-sm">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-gray-500 flex-shrink-0" />
                    <span className="truncate">
                      <ViewerCountDisplay
                        eventId={eventId}
                        variant="text"
                        size="sm"
                        className="text-muted-foreground"
                      />
                    </span>
                  </div>
                  <div className="flex items-center text-xs sm:text-sm">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-gray-500 flex-shrink-0" />
                    <span className="truncate">
                      {eventData?.location || "Online"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share Event Card */}
            <Card>
              <CardHeader className="p-3 sm:p-3">
                <CardTitle className="text-base sm:text-lg">
                  Share Event
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-3">
                <SocialShareMenu
                  title={eventData?.name}
                  url={shareUrl}
                  prettyUrl={eventUrl}
                  description={eventData?.description}
                />
              </CardContent>
            </Card>

            {/* Add to Calendar Card */}
            {eventData?.date && (
              <Card>
                <CardHeader className="p-3 sm:p-3">
                  <CardTitle className="text-base sm:text-lg">
                    Add to Calendar
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-3">
                  <Button
                    variant="outline"
                    className="w-full flex items-center gap-2"
                    onClick={() => {
                      if (eventData) {
                        downloadEventICS({
                          id: eventData.id,
                          title: eventData.name || 'Event',
                          description: eventData.description || undefined,
                          date: eventData.date,
                          location: eventData.location || undefined,
                          duration: 60 // Default 1 hour
                        });
                      }
                    }}
                  >
                    <CalendarPlus className="h-4 w-4" />
                    Download .ics
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Opens in your default calendar app
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Host Updates / Bulletin Board */}
            <Card>
              <CardHeader className="p-3 sm:p-3">
                <CardTitle className="text-base sm:text-lg">
                  Updates
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-3">
                <BulletinBoard eventId={eventData?.id || ''} />
              </CardContent>
            </Card>

            {currentUser && !isEventHost && !isStreamer && (
              <Card>
                <CardHeader className="p-3 sm:p-3">
                  <CardTitle className="text-base sm:text-lg">
                    Report Event
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-3">
                  <Button
                    variant="outline"
                    onClick={handleReportClick}
                    disabled={hasReported || reportStatusLoading}
                  >
                    <Flag className="h-4 w-4 mr-2" />{" "}
                    {hasReported ? "Reported" : "Report Event"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      {eventData && (
        <>
          <TicketPurchaseModal
            isOpen={showPurchaseModal}
            onClose={() => setShowPurchaseModal(false)}
            eventId={eventData?.id}
            eventTitle={eventData?.name}
            price={eventData?.ticket_price}
            hostStripeAccountId={eventData?.stripe_account_id}
            onPurchaseSuccess={handlePurchaseSuccess}
          />
          {currentUser && !isEventHost && !isStreamer && (
            <ReportEventModal
              open={showReportModal}
              onOpenChange={setShowReportModal}
              eventId={eventData?.id}
              disabled={hasReported}
              onReported={() => refreshReportStatus()}
            />
          )}
        </>
      )}
    </div>
  );
};

export default EventPage;
