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
  ticketSales: number;
  timeUntilStart: string;
  startDateTime: Date;
  participants: string[];
  description: string;
  subscribers: number;
  slug?: string;
  media_urls?: string[];
  duration?: number;
  recorded_at?: string;
  visibility: "public" | "private" | "selected";
  viewer_count?: number;
  tags: string[];
  category: string;
  is_live: boolean;
  channel_id: string;
}

interface PastEventsProps {
  events: PastEvent[];
}

const PastEvents: React.FC<PastEventsProps> = ({ events = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [pastSortBy, setPastSortBy] = useState<SortOption>("newest");

  return (
    <div className="container mx-auto p-4">
      <div className="">
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
