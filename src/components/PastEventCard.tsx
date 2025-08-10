import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Eye, Clock, DollarSign } from "lucide-react";
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
}

interface PastEventCardProps {
  event: PastEvent;
  onPlay: (event: PastEvent) => void;
  onPurchase?: (eventId: string) => void;
}

const PastEventCard: React.FC<PastEventCardProps> = ({
  event,
  onPlay,
  onPurchase,
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
      <Card
        className="hover:shadow-lg transition-shadow cursor-pointer group"
        onClick={handleCardClick}
      >
        <CardHeader className="p-0">
          <div className="relative">
            <img
              src={event.thumbnail_url || "/placeholder.svg"}
              alt={event.title}
              className="w-full h-48 object-cover rounded-t-lg"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center rounded-t-lg">
              <Button
                onClick={handlePlayClick}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                size="lg"
              >
                <Play className="h-6 w-6 mr-2" />
                {event.price > 0 ? `Buy & Play - $${event.price}` : "Play"}
              </Button>
            </div>
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
              <Clock className="h-3 w-3 inline mr-1" />
              {formatDuration(event.duration)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <CardTitle className="text-lg line-clamp-2">
              {event.title}
            </CardTitle>
            <div className="flex items-center gap-2 ml-2">
              {event.visibility === "private" && (
                <Badge variant="secondary">Private</Badge>
              )}
              {event.price > 0 && (
                <TooltipWrapper content={`Price: $${event.price}`}>
                  <Badge className="bg-green-500">
                    <DollarSign className="h-3 w-3 mr-1" />${event.price}
                  </Badge>
                </TooltipWrapper>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {event.description}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <TooltipWrapper content="Total views">
              <span className="flex items-center">
                <Eye className="h-3 w-3 mr-1" />
                {event.view_count}
              </span>
            </TooltipWrapper>
            <span>{formatDate(event.recorded_at)}</span>
          </div>
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {event.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
