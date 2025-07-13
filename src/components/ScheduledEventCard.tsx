import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Star, Eye, DollarSign } from 'lucide-react';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import TicketPurchaseModal from './TicketPurchaseModal';

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
}

interface ScheduledEventCardProps {
  event: ScheduledEvent;
  onPurchase?: (eventId: string) => void;
}

const ScheduledEventCard: React.FC<ScheduledEventCardProps> = ({ event, onPurchase }) => {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/event/${event.id}`);
  };

  const handleBuyTicket = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPurchaseModal(true);
  };

  const handlePurchaseSuccess = () => {
    onPurchase?.(event.id.toString());
  };

  return (
    <>
      <TooltipWrapper content={`${event.title} - Starts ${event.timeUntilStart}`}>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleClick}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{event.title}</CardTitle>
              <Badge variant="outline" className="bg-blue-50 text-blue-600">
                SCHEDULED
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-2">{event.channelName}</p>
            
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{event.startDate}</span>
              <Clock className="h-4 w-4 ml-3 mr-1" />
              <span>{event.startTime}</span>
            </div>
            
            <div className="text-sm font-medium text-blue-600 mb-2">
              Starts {event.timeUntilStart}
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
              <TooltipWrapper content="Event price">
                <span className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  ${event.price}
                </span>
              </TooltipWrapper>
              <TooltipWrapper content="Event rating">
                <span className="flex items-center">
                  <Star className="h-4 w-4 mr-1" />
                  {event.rating}
                </span>
              </TooltipWrapper>
            </div>
            
            <Button
              onClick={handleBuyTicket}
              className="w-full mb-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Buy Ticket - ${event.price}
            </Button>
            
            <div className="flex items-center justify-between text-xs text-gray-400">
              <TooltipWrapper content="Expected views">
                <span className="flex items-center">
                  <Eye className="h-3 w-3 mr-1" />
                  {event.views.toLocaleString()} expected
                </span>
              </TooltipWrapper>
              <span>${event.ticketRevenue.toLocaleString()} revenue</span>
            </div>
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