import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Star, Eye, DollarSign } from "lucide-react";
import TooltipWrapper from "@/components/ui/tooltip-wrapper";
import TicketPurchaseModal from "./TicketPurchaseModal";
import MediaBackground from "./MediaBackground";

interface ScheduledEvent {
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
  description?: string;
  media_urls?: string[];
}

interface ScheduledEventCardProps {
  event: ScheduledEvent;
  onPurchase?: (eventId: string) => void;
}

const ScheduledEventCard: React.FC<ScheduledEventCardProps> = ({
  event,
  onPurchase,
}) => {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    const eventUrl = (event as any).slug
      ? `/event/${(event as any).slug}`
      : `/event/${event.id}`;
    navigate(eventUrl);
  };

  const handleBuyTicket = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPurchaseModal(true);
  };

  const handlePurchaseSuccess = () => {
    onPurchase?.(event.id.toString());
  };

  console.log(event);

  const bgUrl = event?.media_urls[0];

  return (
    <>
      <TooltipWrapper
        content={`${event.title} - Starts ${event.timeUntilStart}`}
      >
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col justify-between"
          onClick={handleClick}
        >
          <MediaBackground src={bgUrl} className="aspect-video " />
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{event.title}</CardTitle>
              <Badge variant="outline" className="bg-blue-50 text-blue-600">
                SCHEDULED
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="">
            <p className="text-sm text-gray-600 mb-2">{event.channelName}</p>
            <div className="text-xs text-gray-600 my-2 line-clamp-2 ">
              {event.description}
            </div>

            <div className="flex items-center text-sm text-gray-500 mb-2">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{event.startDate}</span>
              <Clock className="h-4 w-4 ml-3 mr-1" />
              <span>{event.startTime}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-600 mb-2">
                Starts {event.timeUntilStart}
              </span>
              <TooltipWrapper content="Event price">
                <span className="flex items-center text-green-600 font-bold">
                  <DollarSign className="h-4 w-4 " />
                  {event.price}
                </span>
              </TooltipWrapper>
            </div>

            <Button
              onClick={handleClick}
              className="w-full my-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              View Event
            </Button>
          </CardContent>
        </Card>
      </TooltipWrapper>

      <TicketPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        eventId={event.id.toString()}
        eventTitle={event.title}
        price={event.price}
        onPurchaseSuccess={handlePurchaseSuccess}
      />
    </>
  );
};

export default ScheduledEventCard;
