import React from 'react';
import { Play, Star, Eye, DollarSign, Lock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import { SortOption } from '@/components/EventRankingControls';

interface PastEvent {
  id: number;
  title: string;
  channelName: string;
  description: string;
  duration: string;
  views: number;
  rating: number;
  price: number;
  revenue: number;
  recordedDate: string;
  visibility: 'public' | 'private' | 'selected';
  thumbnail: string;
  participants: string[];
}

interface ChannelPastEventsGridProps {
  events: PastEvent[];
  searchTerm: string;
  memberSearch: string;
  sortBy: SortOption;
}

const ChannelPastEventsGrid: React.FC<ChannelPastEventsGridProps> = ({
  events,
  searchTerm,
  memberSearch,
  sortBy,
}) => {
  const sortEvents = (events: PastEvent[], sortOption: SortOption) => {
    return [...events].sort((a, b) => {
      switch (sortOption) {
        case 'most-views':
          return b.views - a.views;
        case 'least-views':
          return a.views - b.views;
        case 'most-revenue':
          return b.revenue - a.revenue;
        case 'least-revenue':
          return a.revenue - b.revenue;
        case 'most-popular':
          return b.views * b.rating - a.views * a.rating;
        case 'least-popular':
          return a.views * a.rating - b.views * b.rating;
        case 'newest':
          return (
            new Date(b.recordedDate).getTime() -
            new Date(a.recordedDate).getTime()
          );
        case 'oldest':
          return (
            new Date(a.recordedDate).getTime() -
            new Date(b.recordedDate).getTime()
          );
        default:
          return b.views - a.views;
      }
    });
  };

  const filterEvents = (events: PastEvent[]) => {
    return events.filter((event) => {
      const matchesKeyword =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.channelName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMember =
        memberSearch === '' ||
        event.participants.some((participant) =>
          participant.toLowerCase().includes(memberSearch.toLowerCase())
        );

      return matchesKeyword && matchesMember;
    });
  };

  const filteredAndSortedEvents = sortEvents(filterEvents(events), sortBy);

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'private':
        return <Lock className="h-3 w-3" />;
      case 'selected':
        return <Users className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'private':
        return 'bg-red-500';
      case 'selected':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  if (filteredAndSortedEvents.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          No past events found matching your criteria
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredAndSortedEvents.map((event) => (
        <TooltipWrapper
          key={event.id}
          content={`Watch ${event.title} - ${event.views.toLocaleString()} views`}
        >
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="pb-2">
              <div className="relative">
                <div className="aspect-video bg-gray-200 rounded-md mb-2 flex items-center justify-center relative overflow-hidden">
                  <Play className="h-8 w-8 text-gray-400 group-hover:text-white group-hover:scale-110 transition-all" />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all" />
                </div>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium truncate">
                    {event.title}
                  </CardTitle>
                  <TooltipWrapper content={`Visibility: ${event.visibility}`}>
                    <Badge
                      className={`${getVisibilityColor(event.visibility)} text-white text-xs px-1 py-0`}
                    >
                      {getVisibilityIcon(event.visibility)}
                    </Badge>
                  </TooltipWrapper>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>{event.duration}</span>
                <span>{new Date(event.recordedDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <TooltipWrapper content="Event price">
                  <span className="flex items-center">
                    <DollarSign className="h-3 w-3 mr-1" />${event.price}
                  </span>
                </TooltipWrapper>
                <TooltipWrapper content="Event rating">
                  <span className="flex items-center">
                    <Star className="h-3 w-3 mr-1" />
                    {event.rating.toFixed(1)}
                  </span>
                </TooltipWrapper>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <TooltipWrapper content="Total views">
                  <span className="flex items-center">
                    <Eye className="h-3 w-3 mr-1" />
                    {event.views.toLocaleString()}
                  </span>
                </TooltipWrapper>
                <span>${event.revenue.toLocaleString()} revenue</span>
              </div>
            </CardContent>
          </Card>
        </TooltipWrapper>
      ))}
    </div>
  );
};

export default ChannelPastEventsGrid;
