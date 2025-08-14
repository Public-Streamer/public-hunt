import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
  startTransition,
  memo,
  useRef,
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
import LiveDiscussionSectionMemo from "@/components/LiveDiscussionSectionMemo";
import { PreStreamChatArchive } from "@/components/PreStreamChatArchive";
import SocialShareMenu from "@/components/SocialShareMenu";
import TicketPurchaseModal from "@/components/TicketPurchaseModal";
import StreamPreviewContainerMemo from "@/components/StreamPreviewContainerMemo";
import { ReportEventModal } from "@/components/ReportEventModal";
import { useReportEvent } from "@/hooks/useReportEvent";
import CustomScoreboardMemo from "@/components/CustomScoreboardMemo";
import { PinnedMessageSection } from "@/components/PinnedMessageSection";
import EventStreamPreview from "@/components/EventStreamPreview";
import MediaBackground from "@/components/MediaBackground";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/AppContext";
import { updateEventMetaTags, resetDefaultMetaTags } from "@/lib/metaTags";
import { useScoreboardTeams } from "@/hooks/useScoreboardTeams";
import { useEventScoreboardMeta } from "@/hooks/useEventScoreboardMeta";
import { getShareableEventUrl } from "@/lib/shareUtils";
import { Database } from "@/integrations/supabase/types";
import CoonhoundScoreboardViewerMemo from "@/components/CoonhoundScoreboardViewerMemo";

type EventData = Database["public"]["Tables"]["events"]["Row"];

const EventPageComponent: React.FC = () => {
  console.log("[EventPage] Component render started");

  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser, currentUserProfile: currentUserProfile } =
    useAppContext();

  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasTicket, setHasTicket] = useState(false);
  const [checkingTicket, setCheckingTicket] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [isStreamer, setIsStreamer] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Separate state for frequently changing data to prevent full re-renders
  const [viewerCount, setViewerCount] = useState(0);
  const [isLive, setIsLive] = useState(false);

  // Hook to track scoreboard metadata changes (creation/deletion of scoreboards)
  const { selectedGameType, scoreboardName } = useEventScoreboardMeta(
    eventData?.id || ""
  );

  // Hook to track scoreboard teams for conditional rendering
  // Always call hooks with stable parameters to prevent render errors
  const { hasTeams: hasCustomTeams } = useScoreboardTeams(
    eventData?.id || "",
    "custom"
  );
  const { hasTeams: hasCoonHuntTeams } = useScoreboardTeams(
    eventData?.id || "",
    "coon_hunt"
  );

  // Determine if scoreboard should be visible
  const showScoreboard =
    selectedGameType &&
    ((selectedGameType === "custom" && hasCustomTeams) ||
      (selectedGameType === "coon_hunt" && hasCoonHuntTeams));

  useEffect(() => {
    if (!eventId) return;
    fetchEventData();
  }, [eventId]);

  useEffect(() => {
    if (currentUser && eventData) {
      checkStreamerStatus();
      checkTicketStatus();
    }
  }, [currentUser, eventData]);

  // Optimized real-time subscription using useRef to prevent cascade re-renders
  const subscriptionRef = useRef<any>(null);
  const eventIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!eventData?.id || eventIdRef.current === eventData.id) return;
    
    // Clean up previous subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    eventIdRef.current = eventData.id;
    console.log("[EventPage] Setting up stabilized subscription for:", eventData.id);

    subscriptionRef.current = supabase
      .channel(`event-page-${eventData.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "events",
          filter: `id=eq.${eventData.id}`,
        },
        (payload) => {
          if (payload.new) {
            const newData = payload.new as EventData;
            
            // Use functional updates to prevent dependency cascade
            setEventData(prevData => {
              // Only update if data actually changed
              if (JSON.stringify(prevData) === JSON.stringify(newData)) {
                return prevData;
              }
              return newData;
            });
            
            // Separate update for live status to prevent unnecessary re-renders
            setIsLive(prevLive => {
              if (prevLive === newData.is_live) return prevLive;
              return newData.is_live;
            });
            
            setViewerCount(prevCount => {
              if (prevCount === newData.viewer_count) return prevCount;
              return newData.viewer_count || 0;
            });
          }
        }
      )
      .subscribe();

    return () => {
      if (subscriptionRef.current) {
        console.log("[EventPage] Cleaning up stabilized subscription");
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [eventData?.id]); // Only depend on the ID, not the full object

  // Memoized derived variables to prevent unnecessary re-calculations
  const isEventHost = useMemo(
    () => currentUser && eventData && currentUser.id === eventData.created_by,
    [currentUser, eventData?.created_by]
  );

  const canEnterStage = useMemo(
    () => isEventHost || isStreamer,
    [isEventHost, isStreamer]
  );

  const isViewer = useMemo(
    () => !!currentUser && !isEventHost && !isStreamer,
    [currentUser, isEventHost, isStreamer]
  );

  const {
    alreadyReported: hasReported,
    loading: reportStatusLoading,
    checkStatus: refreshReportStatus,
  } = useReportEvent({
    eventId: eventData?.id || "",
    enabled: !!(eventData?.id && isViewer),
  });

  // Generate LiveKit token for viewers when they have access
  useEffect(() => {
    if (
      currentUser &&
      eventData &&
      eventData.is_live &&
      (canEnterStage || hasTicket)
    ) {
      generateViewerToken();
    }
  }, [currentUser, eventData, hasTicket, canEnterStage]);

  const fetchEventData = async () => {
    try {
      setLoading(true);

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
          .eq("user_id", eventData.created_by)
          .single();

        hostStripeAccountId = stripeAccount?.stripe_account_id || null;
      }

      // Combine the data
      const eventWithStripeAccount = {
        ...eventData,
        host_stripe_account_id: hostStripeAccountId,
      };

      setEventData(eventWithStripeAccount);
      // Set initial state for separated values
      setViewerCount(eventWithStripeAccount.viewer_count || 0);
      setIsLive(eventWithStripeAccount.is_live || false);

      // Update meta tags for social media sharing
      const eventMetaData = {
        title: eventWithStripeAccount.name,
        description:
          eventWithStripeAccount.description ||
          `Join ${eventWithStripeAccount.name} - Live streaming event`,
        image:
          eventWithStripeAccount.media_urls?.[0] ||
          `${window.location.origin}/placeholder.svg`,
        url: eventWithStripeAccount.slug
          ? `${window.location.origin}/event/${eventWithStripeAccount.slug}`
          : `${window.location.origin}/event/${eventWithStripeAccount.id}`,
        date: eventWithStripeAccount.date
          ? `${eventWithStripeAccount.date}T${
              eventWithStripeAccount.time || "00:00:00"
            }`
          : undefined,
        location: eventWithStripeAccount.location,
        price: eventWithStripeAccount.ticket_price,
      };
      updateEventMetaTags(eventMetaData);
    } catch (error) {
      console.error("Error fetching event data:", error);
      toast({
        title: "Error",
        description: "Failed to load event details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkTicketStatus = useCallback(async () => {
    if (!currentUser || !eventData) return;

    // For free events, automatically grant access
    if (!eventData.ticket_price || eventData.ticket_price <= 0) {
      setHasTicket(true);
      return;
    }

    try {
      setCheckingTicket(true);
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("event_id", eventData.id)
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

  const checkStreamerStatus = async () => {
    if (!currentUser || !eventData) return;

    try {
      const { data, error } = await supabase
        .from("event_streamers")
        .select("*")
        .eq("event_id", eventData.id)
        .eq("streamer_id", currentUser.id)
        .single();

      setIsStreamer(!!data && !error);
    } catch (error) {
      console.error("Error checking streamer status:", error);
      setIsStreamer(false);
    }
  };

  const generateViewerToken = async () => {
    if (!currentUser || !eventData) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke(
        "create-livekit-token",
        {
          body: {
            eventId: eventData.id,
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
  };

  // Memoized event URL to prevent recalculation
  const eventUrl = useMemo(
    () =>
      eventData?.slug
        ? `${window.location.origin}/event/${eventData.slug}`
        : `${window.location.origin}/event/${eventId}`,
    [eventData?.slug, eventId]
  );

  // Share URL for crawlers and social platforms (Edge Function)
  const shareUrl = useMemo(() => {
    if (!eventData) return `${window.location.origin}`;
    return getShareableEventUrl(eventData.id, eventData.slug);
  }, [eventData?.id, eventData?.slug]);

  // Stabilized LiveKit options to prevent unnecessary re-renders
  const livekitOptions = useMemo(() => ({
    adaptiveStream: true,
    dynacast: true,
  }), []);

  // Stabilized user profile object to prevent LiveDiscussionSection re-renders
  const stableUserProfile = useMemo(() => {
    if (!currentUserProfile) return undefined;
    return {
      id: currentUserProfile.id,
      username: currentUserProfile.display_name || "User",
      display_name: currentUserProfile.display_name || "User",
      profile_picture_url: currentUserProfile.profile_picture_url || "",
    };
  }, [
    currentUserProfile?.id,
    currentUserProfile?.display_name,
    currentUserProfile?.profile_picture_url,
  ]);

  const handlePayment = useCallback(() => {
    if (!currentUser) {
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
  }, [currentUser, navigate, toast]);

  const handleWatchNow = useCallback(() => {
    if (!currentUser) {
      startTransition(() =>
        navigate(
          `/login?redirect=${encodeURIComponent(window.location.pathname)}`
        )
      );
      return;
    }
    // User is logged in but may need to purchase ticket
    if (!hasTicket && eventData?.ticket_price && eventData.ticket_price > 0) {
      handlePayment();
    }
  }, [
    currentUser,
    navigate,
    hasTicket,
    eventData?.ticket_price,
    handlePayment,
  ]);

  const handleReportClick = useCallback(() => {
    if (!currentUser) {
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
  }, [currentUser, navigate, toast]);

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
      ? `/stage/${eventData.slug}`
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
    if (!hasTicket && eventData?.ticket_price && eventData.ticket_price > 0) {
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
    if (hasTicket && eventData?.ticket_price && eventData.ticket_price > 0) {
      return (
        <div className="w-full text-center">
          <Badge className="bg-green-600 text-white text-sm px-4 py-2">
            ✓ You have paid ${eventData.ticket_price} for this event
          </Badge>
        </div>
      );
    }

    // For non-logged users, show "Watch Now" button
    if (!currentUser) {
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

  if (loading) {
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

  if (!eventData) {
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

  // Memoized media data to prevent recalculation on every render
  const mediaData = useMemo(() => 
    eventData.media_urls?.map((url, index) => ({
      id: index.toString(),
      type: url.endsWith(".mp4") ? ("video" as const) : ("image" as const),
      url,
      title: `Media ${index + 1}`,
      thumbnail: url.endsWith(".mp4") ? "/placeholder.gif" : url,
    })) || [],
    [eventData.media_urls]
  );

  console.log("[EventPage] Render state:", {
    isLive,
    hasToken: !!livekitToken,
    roomName,
    serverUrl,
    eventDataId: eventData?.id,
    viewerCount,
    mediaData,
  });

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
          {eventData.name}
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
            {/* Event Preview Card - Always show StreamPreviewContainer in pink area */}
            <Card className="overflow-hidden">
              {isLive && roomName && livekitToken && serverUrl ? (
                <Suspense
                  fallback={<div className="aspect-video w-full bg-black/5" />}
                >
                  <LiveKitRoomLazy
                    token={livekitToken}
                    serverUrl={serverUrl}
                    options={livekitOptions}
                    connect={true}
                  >
                    <StreamPreviewContainerMemo
                      mediaUrls={eventData.media_urls || ["/placeholder.gif"]}
                      eventName={eventData.name}
                      isLive={eventData.is_live}
                      hasAccess={hasTicket || canEnterStage}
                      isLoggedIn={!!currentUser}
                      eventId={eventData.id}
                    />
                    <RoomAudioRendererLazy />

                    {/* Pinned Message Section */}
                    <div className="">
                      <PinnedMessageSection
                        eventId={eventData.id}
                        isHost={false}
                      />
                    </div>

                    {/* Scoreboard - Show only when there are teams (ticketed viewers or stage access) */}
                    {currentUser &&
                      showScoreboard &&
                      (hasTicket || canEnterStage) && (
                        <div className="p-5">
                          {selectedGameType === "custom" ? (
                            <CustomScoreboardMemo
                              eventId={eventData.id}
                              isHost={false}
                            />
                          ) : selectedGameType === "coon_hunt" ? (
                            <CoonhoundScoreboardViewerMemo eventId={eventData.id} />
                          ) : null}
                        </div>
                      )}

                    {eventData.is_live &&
                      livekitToken &&
                      (hasTicket || canEnterStage) && (
                        <LiveDiscussionSectionMemo
                          eventId={eventData.id}
                          currentUserProfile={stableUserProfile}
                        />
                      )}
                  </LiveKitRoomLazy>
                </Suspense>
              ) : (
                <MediaBackground
                  src={eventData.media_urls?.[0]}
                  fallback="/placeholder.gif"
                  className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100"
                >
                  {/* Show 10-Second Preview for Paid Live Events */}
                  {currentUser &&
                  eventData.ticket_price &&
                  eventData.ticket_price > 0 &&
                  !hasTicket &&
                  !canEnterStage &&
                  eventData.is_live ? (
                    <EventStreamPreview
                      mediaUrls={eventData.media_urls || ["/placeholder.gif"]}
                      eventId={eventData.id}
                      eventName={eventData.name}
                      isLive={eventData.is_live}
                      fallbackImage={
                        eventData.media_urls?.[0] || "/placeholder.gif"
                      }
                      hasAccess={hasTicket || canEnterStage}
                    />
                  ) : (
                    <>
                      {!currentUser && (
                        <div className="absolute inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center z-10">
                          <div className="text-center bg-white/90 p-6 rounded-lg shadow-lg">
                            <div className="text-lg font-semibold mb-2">
                              Sign In to Watch Stream
                            </div>
                            <div className="text-sm text-gray-600">
                              Please sign in to access this event
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        {/* <Video className="h-12 w-12 sm:h-16 sm:w-16 lg:h-24 lg:w-24 text-purple-500" /> */}
                      </div>
                      {eventData.is_live && (
                        <Badge className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-red-600 text-white text-xs">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full mr-1 animate-pulse" />
                          LIVE
                        </Badge>
                      )}
                      {/* Viewer Count */}
                      <div className="absolute top-2 right-2">
                        {/* <Badge
                      variant="secondary"
                      className="flex items-center gap-1 text-xs"
                    >
                      <Eye className="h-3 w-3" />
                      {controls?.participantCount - 1}
                    </Badge> */}
                      </div>
                    </>
                  )}
                </MediaBackground>
              )}

              {/* Pre-Stream Chat Archive for scheduled events */}
              {!eventData.is_live && (hasTicket || canEnterStage) && (
                <div className="p-4 border-t border-border/30">
                  <div className="">
                    <PinnedMessageSection
                      eventId={eventData.id}
                      isHost={false}
                    />
                  </div>
                  <PreStreamChatArchive eventId={eventData.id} />
                </div>
              )}
            </Card>

            {/* Promotional Media */}
            {/* {mediaData.length > 0 && <MediaDisplay media={mediaData} />} */}

            {/* Offline Streams */}
            {/* {!eventData.is_live && (
              <OfflineStreamSection
                eventId={eventData.id}
                hasPaid={hasTicket || canEnterStage}
              />
            )} */}
          </div>

          {/* Right Column - Event Details and Actions */}
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="p-3 sm:p-3">
                <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold break-words">
                  {eventData.name}
                </CardTitle>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {eventData.category && (
                    <Badge variant="secondary" className="text-xs">
                      {eventData.category}
                    </Badge>
                  )}
                  {eventData.is_live && (
                    <Badge className="bg-red-600 text-white text-xs">
                      <div className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse" />
                      LIVE
                    </Badge>
                  )}
                  {(!eventData.ticket_price || eventData.ticket_price <= 0) && (
                    <Badge className="bg-green-600 text-white text-xs">
                      Full Access (Free Event)
                    </Badge>
                  )}
                  {hasTicket &&
                  eventData.ticket_price &&
                  eventData.ticket_price > 0 ? (
                    <Badge className="bg-green-600 text-white text-xs">
                      ✓ Paid ${eventData.ticket_price}
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>

              <CardContent className="p-3 sm:p-3">
                <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6 break-words">
                  {eventData.description}
                </p>

                {/* Event Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <div className="flex items-center text-xs sm:text-sm">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-gray-500 flex-shrink-0" />
                    <span className="truncate">{eventData.date}</span>
                  </div>
                  <div className="flex items-center text-xs sm:text-sm">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-gray-500 flex-shrink-0" />
                    <span className="truncate">{eventData.time}</span>
                  </div>
                  <div className="flex items-center text-xs sm:text-sm">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-gray-500 flex-shrink-0" />
                    <span className="truncate">
                      {eventData.viewer_count || 0} viewers
                    </span>
                  </div>
                  <div className="flex items-center text-xs sm:text-sm">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-gray-500 flex-shrink-0" />
                    <span className="truncate">
                      {eventData.location || "Online"}
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
                  title={eventData.name}
                  url={shareUrl}
                  prettyUrl={eventUrl}
                  description={eventData.description}
                />
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
            eventId={eventData.id}
            eventTitle={eventData.name}
            price={eventData.ticket_price}
            hostStripeAccountId={eventData.stripe_account_id}
            onPurchaseSuccess={handlePurchaseSuccess}
          />
          {currentUser && !isEventHost && !isStreamer && (
            <ReportEventModal
              open={showReportModal}
              onOpenChange={setShowReportModal}
              eventId={eventData.id}
              disabled={hasReported}
              onReported={() => refreshReportStatus()}
            />
          )}
        </>
      )}
    </div>
  );
};

// Memoized EventPage to prevent unnecessary re-renders from parent components
const EventPage = memo(EventPageComponent);
EventPage.displayName = "EventPage";

export default EventPage;
