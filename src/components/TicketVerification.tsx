import React, { useState, useEffect } from 'react';
import {
  Lock,
  Ticket,
  CreditCard,
  Eye,
  Users,
  Clock,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

interface TicketVerificationProps {
  eventId: string;
  onUpgrade?: () => void;
  showUpgradePrompt?: boolean;
}

interface EventInfo {
  id: string;
  name: string;
  ticket_price: number;
  description: string;
  date: string;
  time: string;
  viewer_count: number;
}

const TicketVerification: React.FC<TicketVerificationProps> = ({
  eventId,
  onUpgrade,
  showUpgradePrompt = true,
}) => {
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasTicket, setHasTicket] = useState(false);
  const [checkingTicket, setCheckingTicket] = useState(false);

  useEffect(() => {
    fetchEventInfo();
    checkTicketStatus();
  }, [eventId]);

  const fetchEventInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, ticket_price, description, date, time, viewer_count')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setEventInfo(data);
    } catch (error) {
      console.error('Error fetching event info:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkTicketStatus = async () => {
    try {
      setCheckingTicket(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setHasTicket(false);
        return;
      }

      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      setHasTicket(!!data && !error);
    } catch (error) {
      console.error('Error checking ticket status:', error);
      setHasTicket(false);
    } finally {
      setCheckingTicket(false);
    }
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4" />
            <div className="h-4 bg-gray-200 rounded mb-2" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!eventInfo) {
    return (
      <Card className="mb-6">
        <CardContent className="p-8 text-center">
          <Lock className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">Event Not Found</h3>
          <p className="text-gray-600">
            The event you're looking for doesn't exist or has been removed.
          </p>
        </CardContent>
      </Card>
    );
  }

  // If user has a ticket, this component shouldn't render
  if (hasTicket) {
    return null;
  }

  // For free events, this component shouldn't render
  if (!eventInfo.ticket_price || eventInfo.ticket_price <= 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-8">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
              <Lock className="h-12 w-12 text-purple-600" />
            </div>
            <Badge className="absolute -top-2 -right-2 bg-purple-600 text-white">
              Premium
            </Badge>
          </div>

          <h2 className="text-2xl font-bold mb-4">
            Premium Event Access Required
          </h2>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {eventInfo.name}
          </h3>

          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {eventInfo.description ||
              'This is a premium live streaming event. Purchase a ticket to access the full experience with multiple camera angles and high-quality streams.'}
          </p>

          {/* Event Details */}
          <div className="grid grid-cols-2 gap-4 mb-6 max-w-md mx-auto">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>
                {eventInfo.date} at {eventInfo.time}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>{eventInfo.viewer_count || 0} watching</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign className="h-6 w-6 text-purple-600" />
              <span className="text-3xl font-bold text-purple-600">
                ${eventInfo.ticket_price}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              One-time purchase for full access
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-left">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-green-600" />
              <span className="text-sm">Multiple camera angles</span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-green-600" />
              <span className="text-sm">Join live chat</span>
            </div>
            <div className="flex items-center gap-3">
              <Ticket className="h-5 w-5 text-green-600" />
              <span className="text-sm">Full HD streaming</span>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-green-600" />
              <span className="text-sm">Secure payment</span>
            </div>
          </div>

          {/* Action Buttons */}
          {showUpgradePrompt && (
            <div className="space-y-3">
              <Button
                onClick={onUpgrade}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg py-3"
                disabled={checkingTicket}
              >
                <Ticket className="h-5 w-5 mr-2" />
                Purchase Ticket - ${eventInfo.ticket_price}
              </Button>

              <Button
                variant="outline"
                onClick={checkTicketStatus}
                disabled={checkingTicket}
                className="w-full"
              >
                {checkingTicket ? 'Checking...' : 'I Already Have a Ticket'}
              </Button>
            </div>
          )}

          {/* Preview Message */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Preview Mode:</strong> You're seeing a preview of this
              event. Purchase a ticket to access the full live streaming
              experience.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TicketVerification;
