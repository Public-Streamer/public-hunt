import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type SortOption = 
  | 'most-views' 
  | 'least-views' 
  | 'most-revenue' 
  | 'least-revenue' 
  | 'most-live-viewers' 
  | 'least-live-viewers'
  | 'most-subscribers'
  | 'least-subscribers'
  | 'most-popular'
  | 'least-popular'
  | 'newest'
  | 'oldest'
  | 'most-ticket-sales'
  | 'least-ticket-sales'
  | 'most-ticket-revenue'
  | 'least-ticket-revenue';

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
  memberSearch,
  onMemberSearchChange,
  activeTab
}) => {
  const getSortLabel = (option: SortOption): string => {
    const labels: Record<SortOption, string> = {
      'most-views': 'Most Views',
      'least-views': 'Least Views',
      'newest': 'Newest First',
      'oldest': 'Oldest First',
      'most-revenue': 'Most Revenue',
      'least-revenue': 'Least Revenue',
      'most-live-viewers': 'Most Live Viewers',
      'least-live-viewers': 'Least Live Viewers',
      'most-subscribers': 'Most Subscribers',
      'least-subscribers': 'Least Subscribers',
      'most-popular': 'Most Popular',
      'least-popular': 'Least Popular',
      'most-ticket-sales': 'Most Ticket Sales',
      'least-ticket-sales': 'Least Ticket Sales',
      'most-ticket-revenue': 'Most Ticket Revenue',
      'least-ticket-revenue': 'Least Ticket Revenue'
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
        
        {/* <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by member/participant..."
            value={memberSearch}
            onChange={(e) => onMemberSearchChange(e.target.value)}
            className="pl-10"
          />
        </div> */}
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
            {activeTab === 'scheduled' && (
              <>
                <SelectItem value="most-ticket-sales">Most Ticket Sales</SelectItem>
                <SelectItem value="most-ticket-revenue">Most Ticket Revenue</SelectItem>
                <SelectItem value="least-ticket-sales">Least Ticket Sales</SelectItem>
                <SelectItem value="least-ticket-revenue">Least Ticket Revenue</SelectItem>
              </>
            )}
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            {activeTab === 'live' && (
              <>
                <SelectItem value="most-live-viewers">Most Live Viewers</SelectItem>
                <SelectItem value="least-live-viewers">Least Live Viewers</SelectItem>
              </>
            )}
            <SelectItem value="most-popular">Most Popular</SelectItem>
            <SelectItem value="least-popular">Least Popular</SelectItem>
            
            <SelectItem value="most-revenue">Most Revenue</SelectItem>
            <SelectItem value="least-revenue">Least Revenue</SelectItem>
            <SelectItem value="most-views">Most Views</SelectItem>
            <SelectItem value="least-views">Least Views</SelectItem>
            <SelectItem value="most-subscribers">Most Subscribers</SelectItem>
            <SelectItem value="least-subscribers">Least Subscribers</SelectItem>
            
            
          </SelectContent>
        </Select>
        
        <Badge variant="outline" className="flex items-center gap-1">
          {sortBy.includes('most') || sortBy === 'newest' ? (
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