import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import EventRankingControls, {
  SortOption,
} from "@/components/EventRankingControls";
import ScheduledEventsGrid from "@/components/ScheduledEventsGrid";

const EventsScheduled: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [scheduledSortBy, setScheduledSortBy] =
    useState<SortOption>("most-ticket-sales");
  const navigate = useNavigate();

  // Generate mock scheduled events
  const scheduledEvents = Array.from({ length: 30 }, (_, i) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30) + 1);
    startDate.setHours(
      Math.floor(Math.random() * 24),
      Math.floor(Math.random() * 60)
    );

    const timeUntilStart = getTimeUntilStart(startDate);
    return {
      id: `${i + 100}`,
      title: `Scheduled Event ${i + 1}`,
      channelName: `Channel ${Math.floor(i / 3) + 1}`,
      startDate: startDate.toLocaleDateString(),
      startTime: startDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      startDateTime: startDate,
      views: Math.floor(Math.random() * 15000) + 500,
      liveViews: Math.floor(Math.random() * 3000) + 5,
      rating: (Math.random() * 2 + 3).toFixed(1),
      price: Math.floor(Math.random() * 30) + 10,
      ticketRevenue: Math.floor(Math.random() * 30000) + 2000,
      ticketSales: Math.floor(Math.random() * 1500) + 100,
      timeUntilStart,
      participants: [`User${i + 100}`, `Participant${i + 101}`],
      description: `Upcoming event ${i + 1} description`,
      subscribers: Math.floor(Math.random() * 8000) + 300,
    };
  }).sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());

  function getTimeUntilStart(startDate: Date): string {
    const now = new Date();
    const diff = startDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `in ${days} day${days > 1 ? "s" : ""}`;
    if (hours > 0) return `in ${hours} hour${hours > 1 ? "s" : ""}`;
    return "starting soon";
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Scheduled Events</h1>

        <EventRankingControls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortBy={scheduledSortBy}
          onSortChange={setScheduledSortBy}
          memberSearch={memberSearch}
          onMemberSearchChange={setMemberSearch}
          activeTab="scheduled"
        />

        <ScheduledEventsGrid
          events={scheduledEvents}
          searchTerm={searchTerm}
          memberSearch={memberSearch}
          sortBy={scheduledSortBy}
        />
      </div>
    </div>
  );
};

export default EventsScheduled;
