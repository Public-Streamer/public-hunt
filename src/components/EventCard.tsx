import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  DollarSign,
  Users,
  Video,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Timer,
} from "lucide-react";
import SocialMediaSection from "./SocialMediaSection";
import TicketPurchaseModal from "./TicketPurchaseModal";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useAppContext } from "@/contexts/AppContext";
import MediaBackground from "./MediaBackground";

interface Event {
  id: string;
  title: string;
  description: string;
  price: number;
  date: string;
  time: string;
  duration: string;
  viewers: number;
  streamerCount: number;
  isLive: boolean;
  thumbnail: string;
}

interface EventCardProps {
  event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const [showSocial, setShowSocial] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [hasTicket, setHasTicket] = useState(false);
  const [checkingTicket, setCheckingTicket] = useState(false);
  const { user, isAuthenticated } = useAppContext();
  const navigate = useNavigate();

  const checkTicketStatus = async () => {
    if (!user) return;

    setCheckingTicket(true);
    try {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("user_id", user.id)
        .eq("event_id", event.id)
        .eq("status", "active")
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking ticket status:", error);
        return;
      }

      setHasTicket(!!data);
    } catch (error) {
      console.error("Error checking ticket status:", error);
    } finally {
      setCheckingTicket(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      checkTicketStatus();
    }
  }, [user, isAuthenticated, event.id]);

  const handleCardClick = () => {
    const eventUrl = (event as any).slug
      ? `/event/${(event as any).slug}`
      : `/event/${event.id}`;
    navigate(eventUrl);
  };

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    const eventUrl = (event as any).slug
      ? `/event/${(event as any).slug}`
      : `/event/${event.id}`;
    navigate(eventUrl);

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // For free events or users with tickets, navigate to event page or watch

    if (event.isLive) {
      const eventUrl = (event as any).slug
        ? `/event/${(event as any).slug}`
        : `/event/${event.id}`;
      navigate(eventUrl);
    }
  };

  const handleSocialClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSocial(!showSocial);
  };

  const handlePurchaseSuccess = () => {
    setHasTicket(true);
  };

  const getButtonText = () => {
    if (checkingTicket) return "Checking...";
    if (!isAuthenticated) return "Login to Purchase";
    if (event.price === 0) return "Watch Event (Free)";
    if (hasTicket) return "Watch Event";
    return `Watch Preview`;
  };

  const noThumb = "/placeholder.svg";
  const bgUrl = event.thumbnail ? event.thumbnail : noThumb;

  return (
    <div>
      <Card
        className="hover:shadow-xl transition-transform duration-300 overflow-hidden cursor-pointer h-full flex flex-col justify-between   "
        onClick={handleCardClick}
      >
        <MediaBackground
          src={bgUrl}
          className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            {/* <Video className="h-16 w-16 text-base-300" /> */}
          </div>
          {event.isLive && (
            <Badge className="absolute top-2 left-2 bg-red-600 text-white">
              <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
              LIVE
            </Badge>
          )}
          {/* <Badge
            variant="outline"
            className="absolute top-2 right-2 text-white px-2 py-1 rounded text-sm"
          >
            <Eye className="h-4 w-4 mr-1" />
            {event.streamerCount}
          </Badge> */}
        </MediaBackground>

        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold line-clamp-2">
            {event.title}
          </CardTitle>
          <p className="text-sm text-gray-600 line-clamp-2">
            {event.description}
          </p>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3 flex flex-col justify-end h-full">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {event.date}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {event.time}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {event.viewers}
                </span>
                <span className="flex items-center">
                  {" "}
                  <Timer className="h-4 w-4 mr-1" /> {event.duration}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-green-600 flex items-center">
                  <DollarSign className="h-4 w-4" />
                  {event.price}
                </span>
              </div>
            </div>

            <Button
              onClick={handleAction}
              disabled={checkingTicket}
              className={`w-full ${
                event.isLive && (event.price === 0 || hasTicket)
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              }`}
            >
              {event.isLive && (event.price === 0 || hasTicket)
                ? "Watch Now"
                : getButtonText()}
            </Button>

            {/* <div className="flex items-center justify-center gap-1 sm:gap-2 border-t pt-3">
              <Button variant="ghost" size="sm" className="flex items-center space-x-1 flex-1 justify-center min-w-0" onClick={(e) => e.stopPropagation()}>
                <Heart className="h-4 w-4 flex-shrink-0" />
                <span className="hidden xs:inline sm:inline">Like</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center space-x-1 flex-1 justify-center min-w-0"
                onClick={handleSocialClick}
              >
                <MessageCircle className="h-4 w-4 flex-shrink-0" />
                <span className="hidden xs:inline sm:inline">Comments</span>
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center space-x-1 flex-1 justify-center min-w-0" onClick={(e) => e.stopPropagation()}>
                <Share2 className="h-4 w-4 flex-shrink-0" />
                <span className="hidden xs:inline sm:inline">Share</span>
              </Button>
            </div> */}
          </div>
        </CardContent>
      </Card>

      {/* {showSocial && (
        <div className="mt-4">
          <SocialMediaSection eventId={event.id} type="event" />
        </div>
      )} */}

      <TicketPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        eventId={event.id}
        eventTitle={event.title}
        price={event.price}
        onPurchaseSuccess={handlePurchaseSuccess}
      />
    </div>
  );
};

export default EventCard;
