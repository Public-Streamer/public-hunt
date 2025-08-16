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
  description: string;
  channel_id: string;
  duration: number;
  recorded_at: string;
  visibility: "public" | "private" | "selected";
  view_count: number;
  tags: string[];
  category: string;
  date?: string;
  slug?: string;
  created_at?: string;
  updated_at?: string;
  name?: string;
  time?: string;
  location?: string;
  ticket_price?: number;
  is_live?: boolean;
  viewer_count?: number;
  media_urls?: string[];
}

interface PastEventCardProps {
  event: PastEvent;
  onPlay: (event: PastEvent) => void;
  onPurchase?: (eventId: string) => void;
  ranking?: number;
}

const PastEventCard: React.FC<PastEventCardProps> = ({
  event,
  onPlay,
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

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (event.ticket_price > 0) {
      setShowPurchaseModal(true);
    } else {
      onPlay(event);
    }
  };

  const handlePurchaseSuccess = () => {
    onPurchase?.(event.id);
    onPlay(event);
  };

  return (
    <>
      <TooltipWrapper
        content={`${(event.name || event.title) ?? "Event"}${
          event.recorded_at || event.date
            ? ` - Recorded on ${formatDate(
                (event.recorded_at || event.date) as string
              )}`
            : ""
        }`}
      >
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer space-y-2 flex flex-col justify-between h-full"
          onClick={handleCardClick}
        >
          <MediaBackground
            mediaUrls={event?.media_urls || []}
            className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100"
          ></MediaBackground>
          <CardHeader>
            <div className="flex justify-between gap-2">
              <CardTitle className="text-lg">
                {event.name || event.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                {ranking && (
                  <Badge variant="outline" className="bg-gray-50 text-gray-600">
                    {ranking}
                  </Badge>
                )}
                {event.visibility === "private" && (
                  <Badge variant="secondary">Private</Badge>
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
                  {event.time && (
                    <>
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{event.time}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center">
                  {event.date && (
                    <>
                      <Calendar className="h-4 w-4 ml-3 mr-1" />
                      <span>{formatDate(event.date as string)}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                {event.ticket_price > 0 && (
                  <TooltipWrapper content="Event price">
                    <span className="flex items-center text-green-600">
                      <DollarSign className="h-4 w-4 mr-1" />$
                      {event.ticket_price}
                    </span>
                  </TooltipWrapper>
                )}
              </div>
            </div>

            {event.tags && event.tags.length > 0 && (
              <div className="text-sm text-gray-600 mb-2">
                {event.category && `${event.category} • `}
                {event.tags.slice(0, 2).join(" • ")}
              </div>
            )}

            <Button
              onClick={handleCardClick}
              className="w-full mb-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Eye className="h-4 w-4 mr-2" />
              Details
            </Button>

            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Streamed on {formatDate(event?.date)}</span>
            </div>
          </CardContent>
        </Card>
      </TooltipWrapper>

      <TicketPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        eventId={event.id}
        eventTitle={(event.title || event.name) as string}
        price={event.ticket_price}
        onPurchaseSuccess={handlePurchaseSuccess}
      />
    </>
  );
};

export default PastEventCard;
