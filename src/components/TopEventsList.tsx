import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Users, DollarSign } from 'lucide-react';

interface Event {
  eventId: string;
  eventName: string;
  revenue: number;
  viewers: number;
  rating: number;
}

interface TopEventsListProps {
  events: Event[];
}

const TopEventsList: React.FC<TopEventsListProps> = ({ events }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No event data available
        </div>
      ) : (
        events.map((event, index) => (
          <Card key={event.eventId} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">{event.eventName}</CardTitle>
                <span className="text-sm text-gray-500">#{index + 1}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="font-bold">{formatCurrency(event.revenue)}</div>
                    <div className="text-xs text-gray-500">Revenue</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="font-bold">{formatNumber(event.viewers)}</div>
                    <div className="text-xs text-gray-500">Viewers</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <div>
                    <div className="font-bold">{event.rating.toFixed(1)}</div>
                    <div className="text-xs text-gray-500">Rating</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default TopEventsList;