import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Eye, Clock, DollarSign, Calendar } from "lucide-react";
import TooltipWrapper from "@/components/ui/tooltip-wrapper";
import TicketPurchaseModal from "./TicketPurchaseModal";
import MediaBackground from "./MediaBackground";

interface PastEvent {
  id: string;
  title: string;
  channelName: string;
  startDate: string;
  startTime: string;
  views: number;
  rating: string;
  price: number;
  ticketRevenue: number;
  timeUntilStart: string;
  startDateTime: Date;
  participants: string[];
  description: string;
  subscribers: number;
  slug?: string;
  media_urls?: string[];
  channel_id: string;
  is_live: boolean;
  category: string;
}

interface PastEventCardProps {
  event: PastEvent;

  onPurchase?: (eventId: string) => void;
  ranking?: number;
}

const PastEventCard: React.FC<PastEventCardProps> = ({
  event,
  onPurchase,
  ranking,
}) => {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const navigate = useNavigate();

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0
      ? `${hours}:${minutes.toString().padStart(2, "0")}:00`
      : `${minutes}:00`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleCardClick = () => {
    const eventUrl = (event as any).slug
      ? `/event/${(event as any).slug}`
      : `/event/${event.id}`;
    navigate(eventUrl);
  };

  const handlePurchaseSuccess = () => {
    onPurchase?.(event.id);
  };

  return (
    <>
      <TooltipWrapper
        content={`${event.title}${
          event.startDate ? ` - Recorded on ${formatDate(event.startDate)}` : ""
        }`}
      >
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer space-y-2 flex flex-col justify-between h-full"
          onClick={handleCardClick}
        >
          <MediaBackground
            mediaUrls={event.media_urls || []}
            className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100"
          ></MediaBackground>
          <CardHeader>
            <div className="flex justify-between gap-2">
              <CardTitle className="text-lg">{event.title}</CardTitle>
              <div className="flex items-center gap-2">
                {ranking && (
                  <Badge variant="outline" className="bg-gray-50 text-gray-600">
                    {ranking}
                  </Badge>
                )}
                <Badge variant="outline" className="bg-red-50 text-purple-600">
                  {event.is_live ? "LIVE" : "PAST"}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {event.description}
            </p>

            <div className="flex items-center gap-2 justify-between text-sm text-gray-500 mb-2">
              <div className="flex items-center justify-center gap-1">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{event.startTime}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 ml-3 mr-1" />
                  <span>{formatDate(event.startDate)}</span>
                </div>
              </div>

              <div className="flex items-center">
                {event.price > 0 && (
                  <TooltipWrapper content="Event price">
                    <span className="flex items-center text-green-600">
                      <DollarSign className="h-4 w-4 mr-1" />${event.price}
                    </span>
                  </TooltipWrapper>
                )}
              </div>
            </div>

            {event.category && (
              <div className="text-sm text-gray-600 mb-2">{event.category}</div>
            )}

            <Button
              onClick={handleCardClick}
              className="w-full mb-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Eye className="h-4 w-4 mr-2" />
              Details
            </Button>

            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <span>{event.views} views</span>
                {/* <span>•</span> */}
                {/* <span>{event.rating} ★</span> */}
              </div>
              <span>Streamed on {formatDate(event.startDate)}</span>
            </div>
          </CardContent>
        </Card>
      </TooltipWrapper>

      <TicketPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        eventId={event.id}
        eventTitle={event.title}
        price={event.price}
        onPurchaseSuccess={handlePurchaseSuccess}
      />
    </>
  );
};

export default PastEventCard;
