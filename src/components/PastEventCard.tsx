import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Eye, Clock, DollarSign, Calendar } from "lucide-react";
import TooltipWrapper from "@/components/ui/tooltip-wrapper";
import TicketPurchaseModal from "./TicketPurchaseModal";

interface PastEvent {
  id: string;
  title: string;
  description: string;
  channel_id: string;
  thumbnail_url: string;
  duration: number;
  recorded_at: string;
  visibility: "public" | "private" | "selected";
  price: number;
  view_count: number;
  tags: string[];
  category: string;
  date: string;
  slug: string;
  created_at: string;
  updated_at: string;
  name: string;
  time: string;
  location: string;
  ticket_price: number;
  is_live: boolean;
  viewer_count: number;
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
    if (event.price > 0) {
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
        content={`${event.name} - Recorded on ${formatDate(event.date)}`}
      >
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer space-y-2"
          onClick={handleCardClick}
        >
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-lg">{event.name}</CardTitle>
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

            <div className="flex items-center text-sm text-gray-500 mb-2">
              <Clock className="h-4 w-4 mr-1" />
              <span>{event.time}</span>
              <Calendar className="h-4 w-4 ml-3 mr-1" />
              <span>{event.date}</span>
            </div>

            {event.tags && event.tags.length > 0 && (
              <div className="text-sm text-gray-600 mb-2">
                {event.category && `${event.category} • `}
                {event.tags.slice(0, 2).join(" • ")}
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
              {/* <TooltipWrapper content="Total views">
                <span className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {event.view_count}
                </span>
              </TooltipWrapper> */}
              {event.price > 0 && (
                <TooltipWrapper content="Event price">
                  <span className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />${event.price}
                  </span>
                </TooltipWrapper>
              )}
            </div>

            <Button
              onClick={handlePlayClick}
              className="w-full mb-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Play className="h-4 w-4 mr-2" />
              {event.price > 0 ? `Buy & Play - $${event.price}` : "Play"}
            </Button>

            <div className="flex items-center justify-between text-xs text-gray-400">
              {/* <span>{event.view_count} total views</span> */}
              {/* <span>Recorded {formatDate(event?.date)}</span> */}
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
