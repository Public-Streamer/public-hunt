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
  | "most-live-viewers"
  | "newest"
  | "oldest"
  | "most-ticket-sales";

interface EventRankingControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  memberSearch: string;
  onMemberSearchChange: (value: string) => void;
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
      newest: "Newest First",
      oldest: "Oldest First",
      "most-live-viewers": "Most Live Viewers",
      "most-ticket-sales": "Most Ticket Sales",
    };
    return labels[option];
  };

  console.log(activeTab);

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
            {activeTab === "scheduled" && (
              <>
                <SelectItem value="most-ticket-sales">
                  Most Ticket Sales
                </SelectItem>
                <SelectItem value="most-ticket-revenue">
                  Most Ticket Revenue
                </SelectItem>
                <SelectItem value="least-ticket-sales">
                  Least Ticket Sales
                </SelectItem>
                <SelectItem value="least-ticket-revenue">
                  Least Ticket Revenue
                </SelectItem>
              </>
            )}
            {activeTab === "live" && (
              <>
                <SelectItem value="most-live-viewers">
                  Most Live Viewers
                </SelectItem>
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
