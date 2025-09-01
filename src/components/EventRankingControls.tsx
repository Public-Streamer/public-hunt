import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Filter, SortAsc, SortDesc } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type SortOption =
  | "most-views"
  | "least-views"
  | "most-revenue"
  | "least-revenue"
  | "most-live-viewers"
  | "least-live-viewers"
  | "most-subscribers"
  | "least-subscribers"
  | "most-popular"
  | "least-popular"
  | "most-ticket-sales"
  | "least-ticket-sales"
  | "most-ticket-revenue"
  | "least-ticket-revenue"
  | "newest"
  | "oldest"
  | "alphabetical"
  | "starts-soon";

interface EventRankingControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  memberSearch?: string;
  onMemberSearchChange?: (value: string) => void;
  activeTab: string;
}

const EventRankingControls: React.FC<EventRankingControlsProps> = ({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  activeTab,
}) => {
  const getSortLabel = (option: SortOption): string => {
    const labels: Record<SortOption, string> = {
      "most-views": "Most Views",
      "least-views": "Least Views",
      "most-revenue": "Most Revenue",
      "least-revenue": "Least Revenue",
      "most-live-viewers": "Most Live Viewers",
      "least-live-viewers": "Least Live Viewers",
      "most-subscribers": "Most Subscribers",
      "least-subscribers": "Least Subscribers",
      "most-popular": "Most Popular",
      "least-popular": "Least Popular",
      "most-ticket-sales": "Most Ticket Sales",
      "least-ticket-sales": "Least Ticket Sales",
      "most-ticket-revenue": "Most Ticket Revenue",
      "least-ticket-revenue": "Least Ticket Revenue",
      newest: "Newest First",
      oldest: "Oldest First",
      alphabetical: "Alphabetical (A–Z)",
      "starts-soon": "Starts Soon",
    };
    return labels[option];
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search events by keyword..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Sort by:</span>
        </div>

        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {activeTab === "live" && (
              <>
                <SelectItem value="most-live-viewers">
                  Most Live Viewers
                </SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="alphabetical">Alphabetical (A–Z)</SelectItem>
              </>
            )}
            {activeTab === "scheduled" && (
              <>
                <SelectItem value="starts-soon">Starts Soon</SelectItem>
                <SelectItem value="alphabetical">Alphabetical (A–Z)</SelectItem>
              </>
            )}
            {activeTab === "my-events" && (
              <>
                <SelectItem value="starts-soon">Starts Soon</SelectItem>
                <SelectItem value="alphabetical">Alphabetical (A–Z)</SelectItem>
              </>
            )}
            {activeTab === "past" && (
              <>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="most-views">Most Views</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="alphabetical">Alphabetical (A–Z)</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>

        <Badge variant="outline" className="flex items-center gap-1">
          {sortBy.includes("most") || sortBy === "newest" ? (
            <SortDesc className="h-3 w-3" />
          ) : (
            <SortAsc className="h-3 w-3" />
          )}
          {getSortLabel(sortBy)}
        </Badge>
      </div>
    </div>
  );
};

export default EventRankingControls;
