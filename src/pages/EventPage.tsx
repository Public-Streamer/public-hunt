import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  DollarSign,
  Users,
  Video,
  MapPin,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
  useChat,
} from "@livekit/components-react";
import "@livekit/components-styles";
import LiveDiscussionSection from "@/components/LiveDiscussionSection";
import MediaDisplay from "@/components/MediaDisplay";
import ViewerInterface from "@/components/ViewerInterface";
import OfflineStreamSection from "@/components/OfflineStreamSection";
import SocialShareMenu from "@/components/SocialShareMenu";
import TicketPurchaseModal from "@/components/TicketPurchaseModal";
import StreamPreviewContainer from "@/components/StreamPreviewContainer";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/AppContext";

interface EventData {
  id: string;
  name: string;
  description: string;
  ticket_price: number;
  date: string;
  time: string;
  location: string;
  category: string;
  is_live: boolean;
  viewer_count: number;
  livekit_room_name: string;
  media_urls: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  host_stripe_account_id?: string;
}

const EventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser, userProfile: currentUserProfile } = useAppContext();

  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasTicket, setHasTicket] = useState(false);
  const [checkingTicket, setCheckingTicket] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [isStreamer, setIsStreamer] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    fetchEventData();
  }, [eventId]);


  useEffect(() => {
    if (currentUser && eventData) {
      checkTicketStatus();
      checkStreamerStatus();
    }
  }, [currentUser, eventData]);

  // // Set up real-time subscription for live status updates
  useEffect(() => {
    if (!eventId) return;

    const subscription = supabase
      .channel(`event-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "events",
          filter: `id=eq.${eventId}`,
        },
        (payload) => {
          if (payload.new) {
            setEventData((prev) => (prev ? { ...prev, ...payload.new } : null));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [eventId]);

  // Derived variables
  const isEventHost =
    currentUser && eventData && currentUser.id === eventData.created_by;
  const canEnterStage = isEventHost || isStreamer;

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
      
      // First fetch the event data
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

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
        host_stripe_account_id: hostStripeAccountId
      };

      setEventData(eventWithStripeAccount);
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

  const checkTicketStatus = async () => {
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
  };

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
              canPublish: true,
              canSubscribe: true,
              canPublishData: true,
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

  const eventUrl = `${window.location.origin}/event/${eventId}`;

  const handlePayment = () => {
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
    setShowPurchaseModal(true);
  };

  const handleWatchNow = () => {
    if (!currentUser) {
      navigate(
        `/login?redirect=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }
    // User is logged in but may need to purchase ticket
    if (!hasTicket && eventData?.ticket_price && eventData.ticket_price > 0) {
      handlePayment();
    }
  };

  const handlePurchaseSuccess = () => {
    setHasTicket(true);
    checkTicketStatus(); // Refresh ticket status
    toast({
      title: "Success!",
      description: "Your ticket has been purchased successfully",
    });
  };

  const goToStage = () => {
    navigate(`/stage/${eventId}`);
  };

  const goBackToEvents = () => {
    navigate("/events");
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

  const mediaData =
    eventData.media_urls?.map((url, index) => ({
      id: index.toString(),
      type: url.endsWith(".mp4") ? ("video" as const) : ("image" as const),
      url,
      title: `Media ${index + 1}`,
      thumbnail: url.endsWith(".mp4") ? "/placeholder.svg" : url,
    })) || [];

  console.log({
    isLive: eventData.is_live,
    hasToken: livekitToken,
    roomName,
    serverUrl,
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



              {eventData.is_live && roomName && livekitToken && serverUrl ? (
                <LiveKitRoom
                  token={livekitToken}
                  serverUrl={serverUrl}
                  options={{
                    adaptiveStream: true,
                    dynacast: true,
                  }}
                  connect={true}
                >
                  <StreamPreviewContainer
                    eventName={eventData.name}
                    isLive={eventData.is_live}
                    hasAccess={hasTicket || canEnterStage}
                    isLoggedIn={!!currentUser}
                  />
                  <RoomAudioRenderer />

                  {/* Show full viewer interface below if user has access */}
                  {/* {(hasTicket || canEnterStage) && (
                    <div className="mt-6">
                      <ViewerInterface
                        eventId={eventData.id}
                        hasAccess={true}
                        onUpgrade={handlePayment}
                        showUpgradePrompt={false}
                      />
                    </div>
                  )} */}
                  {/* Live Discussion Section - Show for users with access regardless of live status */}
                  {(hasTicket || canEnterStage) && (
                    <LiveDiscussionSection 
                      eventId={eventId}
                      userProfile={currentUserProfile ? {
                        id: currentUserProfile.id,
                        username: currentUserProfile.display_name || 'User',
                        display_name: currentUserProfile.display_name || 'User',
                        profile_picture_url: currentUserProfile.profile_picture_url || ''
                      } : undefined}
                    />
                  )}
                </LiveKitRoom>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 relative">
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
                    <Video className="h-12 w-12 sm:h-16 sm:w-16 lg:h-24 lg:w-24 text-purple-500" />
                  </div>
                  {eventData.is_live && (
                    <Badge className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-red-600 text-white text-xs">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full mr-1 animate-pulse" />
                      LIVE
                    </Badge>
                  )}
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/70 text-white px-2 py-1 rounded text-xs sm:text-sm">
                    Multi-camera
                  </div>
                </div>
              )}

              
            </Card>

            {/* Promotional Media */}
            {mediaData.length > 0 && <MediaDisplay media={mediaData} />}

            {/* Offline Streams */}
            {!eventData.is_live && (
              <OfflineStreamSection
                eventId={eventData.id}
                hasPaid={hasTicket || canEnterStage}
              />
            )}

            {/* Chat History Section - Show when event is not live but user has access */}
            {!eventData.is_live && (hasTicket || canEnterStage) && (
              <LiveDiscussionSection 
                eventId={eventId}
                userProfile={currentUserProfile ? {
                  id: currentUserProfile.id,
                  username: currentUserProfile.display_name || 'User',
                  display_name: currentUserProfile.display_name || 'User',
                  profile_picture_url: currentUserProfile.profile_picture_url || ''
                } : undefined}
              />
            )}
          </div>

          {/* Right Column - Event Details and Actions */}
          <div className="space-y-4 sm:space-y-6">
          <Card>
          <CardHeader className="p-3 sm:p-6">
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
                </div>
              </CardHeader>

              <CardContent className="p-3 sm:p-6">
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
            {/* Event Details Card */}
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-base sm:text-lg">
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 space-y-3 sm:space-y-4">
                <div>
                  <p className="font-semibold text-sm sm:text-base">Status</p>
                  <div className="mt-1">
                    {eventData.is_live ? (
                      <Badge className="bg-green-600 text-white text-xs">
                        Live Now
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Scheduled
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-sm sm:text-base">Category</p>
                  <p className="text-gray-600 text-sm sm:text-base">
                    {eventData.category || "General"}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-sm sm:text-base">Created</p>
                  <p className="text-gray-600 text-sm sm:text-base">
                    {new Date(eventData.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-sm sm:text-base">
                    Current Viewers
                  </p>
                  <p className="text-gray-600 text-sm sm:text-base">
                    {(eventData.viewer_count || 0).toLocaleString()}
                  </p>
                </div>
                {hasTicket && eventData.ticket_price && eventData.ticket_price > 0 && (
                  <div>
                    <p className="font-semibold text-sm sm:text-base">
                      Payment Status
                    </p>
                    <div className="space-y-1">
                      <Badge className="bg-green-600 text-white text-xs">
                        ✓ Paid ${eventData.ticket_price}
                      </Badge>
                      <p className="text-xs text-gray-600">
                        You have full access to this event
                      </p>
                    </div>
                  </div>
                )}
                {hasTicket && (!eventData.ticket_price || eventData.ticket_price <= 0) && (
                  <div>
                    <p className="font-semibold text-sm sm:text-base">
                      Your Access
                    </p>
                    <Badge className="bg-green-600 text-white text-xs">
                      Full Access (Free Event)
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Share Event Card */}
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-base sm:text-lg">
                  Share Event
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <SocialShareMenu
                  title={eventData.name}
                  url={eventUrl}
                  description={eventData.description}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {eventData && (
        <TicketPurchaseModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          eventId={eventData.id}
          eventTitle={eventData.name}
          price={eventData.ticket_price}
          hostStripeAccountId={eventData.host_stripe_account_id}
          onPurchaseSuccess={handlePurchaseSuccess}
        />
      )}
    </div>
  );
};

export default EventPage;
