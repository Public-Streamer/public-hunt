import React, { useState } from "react";
import PastEventsGrid from "@/components/PastEventsGrid";
import EventRankingControls, {
  SortOption,
} from "@/components/EventRankingControls";

interface PastEvent {
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
  description: string;
  subscribers?: number;
  slug?: string;
  media_urls?: string[];
  duration?: number;
  recorded_at?: string;
  visibility?: "public" | "private" | "selected";
  viewer_count?: number;
  tags?: string[];
  category?: string;
  is_live?: boolean;
  channel_id: string;
}

interface PastEventsProps {
  events: PastEvent[];
}

const PastEvents: React.FC<PastEventsProps> = ({ events = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [pastSortBy, setPastSortBy] = useState<SortOption>("starts-soon");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Past Events</h1>

        <EventRankingControls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortBy={pastSortBy}
          onSortChange={setPastSortBy}
          memberSearch={memberSearch}
          onMemberSearchChange={setMemberSearch}
          activeTab="past"
        />

        <PastEventsGrid
          events={events}
          searchTerm={searchTerm}
          memberSearch={memberSearch}
          sortBy={pastSortBy}
        />
      </div>
    </div>
  );
};

export default PastEvents;
