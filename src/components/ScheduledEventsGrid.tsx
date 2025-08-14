import React from "react";
import ScheduledEventCard from "./ScheduledEventCard";

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
  ticketSales?: number;
  timeUntilStart: string;
  startDateTime: Date;
  participants: string[];
  description?: string;
  subscribers?: number;
  slug?: string;
  media_urls?: string[];
}

interface ScheduledEventsGridProps {
  events: ScheduledEvent[];
  searchTerm: string;
  memberSearch: string;
  sortBy: string;
}

const ScheduledEventsGrid: React.FC<ScheduledEventsGridProps> = ({
  events,
  searchTerm,
  memberSearch,
  sortBy,
}) => {
  // Filter events based on search terms
  const filteredEvents = events.filter((event) => {
    const matchesKeyword =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.channelName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMember =
      memberSearch === "" ||
      event.participants.some((participant) =>
        participant.toLowerCase().includes(memberSearch.toLowerCase())
      );

    return matchesKeyword && matchesMember;
  });

  // Sort events based on selected option
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    switch (sortBy) {
      case "most-views":
        return b.views - a.views;
      case "least-views":
        return a.views - b.views;
      case "most-revenue":
        return b.ticketRevenue - a.ticketRevenue;
      case "least-revenue":
        return a.ticketRevenue - b.ticketRevenue;
      case "most-ticket-sales":
        return (b.ticketSales || 0) - (a.ticketSales || 0);
      case "least-ticket-sales":
        return (a.ticketSales || 0) - (b.ticketSales || 0);
      case "most-ticket-revenue":
        return (b.ticketRevenue || 0) - (a.ticketRevenue || 0);
      case "least-ticket-revenue":
        return (a.ticketRevenue || 0) - (b.ticketRevenue || 0);
      case "most-subscribers":
        return (b.subscribers || 0) - (a.subscribers || 0);
      case "least-subscribers":
        return (a.subscribers || 0) - (b.subscribers || 0);
      case "most-popular":
        return b.views * parseFloat(b.rating) - a.views * parseFloat(a.rating);
      case "least-popular":
        return a.views * parseFloat(a.rating) - b.views * parseFloat(b.rating);
      case "newest":
        return b.startDateTime.getTime() - a.startDateTime.getTime();
      case "oldest":
        return a.startDateTime.getTime() - b.startDateTime.getTime();
      case "alphabetical":
        return a.title.localeCompare(b.title);
      case "starts-soon":
        return a.startDateTime.getTime() - b.startDateTime.getTime();
      default:
        // Default: starts soon
        return a.startDateTime.getTime() - b.startDateTime.getTime();
    }
  });

  if (sortedEvents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No scheduled events found</p>
        <p className="text-gray-400 text-sm mt-2">
          {searchTerm || memberSearch
            ? "Try adjusting your search terms"
            : "Check back later for upcoming events"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedEvents.map((event, index) => (
        <div key={event.id} className="relative">
          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold z-10">
            #{index + 1}
          </div>
          <ScheduledEventCard event={event} />
        </div>
      ))}
    </div>
  );
};

export default ScheduledEventsGrid;
