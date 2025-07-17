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
import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";
import SocialMediaSection from "@/components/SocialMediaSection";
import MediaDisplay from "@/components/MediaDisplay";
import ViewerInterface from "@/components/ViewerInterface";
import OfflineStreamSection from "@/components/OfflineStreamSection";
import SocialShareMenu from "@/components/SocialShareMenu";
import TicketPurchaseModal from "@/components/TicketPurchaseModal";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

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
}

const EventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasTicket, setHasTicket] = useState(false);
  const [checkingTicket, setCheckingTicket] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    fetchEventData();
    getCurrentUser();
  }, [eventId]);

  useEffect(() => {
    if (currentUser && eventData) {
      checkTicketStatus();
    }
  }, [currentUser, eventData]);

  // Set up real-time subscription for live status updates
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

  // Generate LiveKit token for viewers when they have access
  useEffect(() => {
    if (
      currentUser &&
      eventData &&
      eventData.is_live &&
      (isEventHost || hasTicket)
    ) {
      generateViewerToken();
    }
  }, [currentUser, eventData]);

  const getCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error getting current user:", error);
    }
  };

  const fetchEventData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error) {
        console.error("Error fetching event:", error);
        toast({
          title: "Error",
          description: "Failed to load event details",
          variant: "destructive",
        });
        return;
      }

      setEventData(data);
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

  const generateViewerToken = async () => {
    if (!currentUser || !eventData) return;

    try {
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

      setLivekitToken(data.token);
      setRoomName(data.roomName);
      setServerUrl(data.serverUrl);
    } catch (error) {
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
      navigate("/login");
      return;
    }
    setShowPurchaseModal(true);
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

    if (isEventHost) {
      return (
        <Button
          onClick={goToStage}
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-lg py-3"
        >
          Enter Stage (Host)
        </Button>
      );
    }

    if (!hasTicket) {
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

    return (
      <Button
        onClick={goToStage}
        className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-lg py-3"
      >
        Enter Stage
      </Button>
    );
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back to Events Button */}
      <div className="mb-6">
        <Button
          onClick={goBackToEvents}
          variant="outline"
          className="flex items-center gap-2 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events Page
        </Button>
      </div>

      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-center mb-4">Event Details</h1>
      </div>

      {/* Top Admission Button */}
      <div className="mb-8 max-w-md mx-auto">
        <AdmissionButton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <Video className="h-24 w-24 text-purple-500" />
              </div>
              {eventData.is_live && (
                <Badge className="absolute top-4 left-4 bg-red-600 text-white">
                  <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
                  LIVE
                </Badge>
              )}
              <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded">
                Multi-camera
              </div>
            </div>

            <CardHeader>
              <CardTitle className="text-3xl font-bold">
                {eventData.name}
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                {eventData.category && (
                  <Badge variant="secondary">{eventData.category}</Badge>
                )}
                {eventData.is_live && (
                  <Badge className="bg-red-600 text-white">
                    <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
                    LIVE
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-lg text-gray-700 mb-6">
                {eventData.description}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{eventData.date}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{eventData.time}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{eventData.viewer_count || 0} viewers</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{eventData.location || "Online"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Streams - Show LiveKit viewer interface when live */}
          {eventData.is_live &&
          eventData.livekit_room_name &&
          livekitToken &&
          serverUrl ? (
            <LiveKitRoom
              token={livekitToken}
              serverUrl={serverUrl}
              options={{
                adaptiveStream: true,
                dynacast: true,
              }}
              connect={true}
            >
              <ViewerInterface
                eventId={eventData.id}
                hasAccess={hasTicket || isEventHost}
                onUpgrade={handlePayment}
                showUpgradePrompt={!hasTicket && !isEventHost}
              />
            </LiveKitRoom>
          ) : eventData.is_live && eventData.livekit_room_name ? (
            <Card className="mb-6">
              <CardContent className="p-8 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold mb-2">
                  Connecting to Live Stream
                </h3>
                <p className="text-gray-600">
                  Preparing your connection to the live event...
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6">
              <CardContent className="p-8 text-center">
                <Video className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">Event Not Live</h3>
                <p className="text-gray-600">
                  This event is not currently streaming. Check back at the
                  scheduled time.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Promotional Media */}
          {mediaData.length > 0 && <MediaDisplay media={mediaData} />}

          {/* Offline Streams - Show below promotional media when not live */}
          {!eventData.is_live && (
            <OfflineStreamSection
              eventId={eventData.id}
              hasPaid={hasTicket || isEventHost}
            />
          )}

          <SocialMediaSection eventId={eventData.id} type="event" />

          {/* Social Share Menu */}
          <SocialShareMenu
            title={eventData.name}
            url={eventUrl}
            description={eventData.description}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                <span className="flex items-center justify-center">
                  <DollarSign className="h-6 w-6" />
                  {eventData.ticket_price}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AdmissionButton />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold">Status</p>
                <p className="text-gray-600">
                  {eventData.is_live ? (
                    <Badge className="bg-green-600 text-white">Live Now</Badge>
                  ) : (
                    <Badge variant="secondary">Scheduled</Badge>
                  )}
                </p>
              </div>
              <div>
                <p className="font-semibold">Category</p>
                <p className="text-gray-600">
                  {eventData.category || "General"}
                </p>
              </div>
              <div>
                <p className="font-semibold">Created</p>
                <p className="text-gray-600">
                  {new Date(eventData.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="font-semibold">Current Viewers</p>
                <p className="text-gray-600">
                  {(eventData.viewer_count || 0).toLocaleString()}
                </p>
              </div>
              {hasTicket && (
                <div>
                  <p className="font-semibold">Your Access</p>
                  <Badge className="bg-green-600 text-white">Full Access</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Admission Button */}
      <div className="mt-8 max-w-md mx-auto">
        <AdmissionButton />
      </div>

      {eventData && (
        <TicketPurchaseModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          eventId={eventData.id}
          eventTitle={eventData.name}
          price={eventData.ticket_price}
          onPurchaseSuccess={handlePurchaseSuccess}
        />
      )}
    </div>
  );
};

export default EventPage;
