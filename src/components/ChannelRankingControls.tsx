import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users } from 'lucide-react';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';

export type ChannelSortOption = 
  | 'most-revenue-all-time'
  | 'most-revenue-12-months'
  | 'most-revenue-30-days'
  | 'most-revenue'
  | 'least-revenue'
  | 'most-subscribers'
  | 'least-subscribers'
  | 'most-views'
  | 'least-views'
  | 'highest-rated'
  | 'lowest-rated'
  | 'most-events'
  | 'least-events';

interface ChannelRankingControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: ChannelSortOption;
  onSortChange: (value: ChannelSortOption) => void;
  memberSearch: string;
  onMemberSearchChange: (value: string) => void;
}

const ChannelRankingControls: React.FC<ChannelRankingControlsProps> = ({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  memberSearch,
  onMemberSearchChange
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <TooltipWrapper content="Search channels by name or description">
          <Input
            placeholder="Search channels..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </TooltipWrapper>
      </div>
      
      <div className="relative flex-1">
        <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <TooltipWrapper content="Search by channel owner or member">
          <Input
            placeholder="Search by member..."
            value={memberSearch}
            onChange={(e) => onMemberSearchChange(e.target.value)}
            className="pl-10"
          />
        </TooltipWrapper>
      </div>
      
      <TooltipWrapper content="Sort channels by different criteria">
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="most-revenue-all-time">Most Revenue All Time</SelectItem>
            <SelectItem value="most-revenue-12-months">Most Revenue Past 12 Months</SelectItem>
            <SelectItem value="most-revenue-30-days">Most Revenue Past 30 Days</SelectItem>
            <SelectItem value="most-revenue">Most Revenue</SelectItem>
            <SelectItem value="least-revenue">Least Revenue</SelectItem>
            <SelectItem value="most-subscribers">Most Subscribers</SelectItem>
            <SelectItem value="least-subscribers">Least Subscribers</SelectItem>
            <SelectItem value="most-views">Most Views</SelectItem>
            <SelectItem value="least-views">Least Views</SelectItem>
            <SelectItem value="highest-rated">Highest Rated</SelectItem>
            <SelectItem value="lowest-rated">Lowest Rated</SelectItem>
            <SelectItem value="most-events">Most Events</SelectItem>
            <SelectItem value="least-events">Least Events</SelectItem>
          </SelectContent>
        </Select>
      </TooltipWrapper>
    </div>
  );
};

export default ChannelRankingControls;