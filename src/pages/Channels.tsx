import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Star, ChevronDown, ChevronUp, Plus, DollarSign } from 'lucide-react';
import CreateChannelForm from '@/components/CreateChannelForm';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import ChannelRankingControls, { ChannelSortOption } from '@/components/ChannelRankingControls';
import { supabase } from '@/lib/supabase';

const Channels: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [sortBy, setSortBy] = useState<ChannelSortOption>('most-revenue-12-months');
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightedChannel, setHighlightedChannel] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    channelName: '',
    channelDescription: '',
    category: ''
  });

  useEffect(() => {
    fetchChannels();
    
    // Check if there's a channel parameter in URL to highlight
    const channelParam = searchParams.get('channel');
    if (channelParam) {
      setHighlightedChannel(channelParam);
      // Clear highlight after 3 seconds
      setTimeout(() => setHighlightedChannel(null), 3000);
    }
  }, [searchParams]);

  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching channels:', error);
        return;
      }

      // Transform data to match expected format
      const transformedChannels = data.map((channel, index) => ({
        id: channel.id,
        name: channel.name,
        description: channel.description,
        subscribers: Math.floor(Math.random() * 50000) + 1000,
        views: Math.floor(Math.random() * 500000) + 5000,
        rating: (Math.random() * 2 + 3).toFixed(1),
        isLive: Math.random() < 0.05,
        eventCount: Math.floor(Math.random() * 50) + 1,
        ticketRevenue: Math.floor(Math.random() * 100000) + 5000,
        revenueAllTime: Math.floor(Math.random() * 500000) + 10000,
        revenue12Months: Math.floor(Math.random() * 200000) + 5000,
        revenue30Days: Math.floor(Math.random() * 50000) + 1000,
        members: [`Owner${index + 1}`, `Member${index + 1}`, `Moderator${index + 1}`],
        category: channel.category,
        media_urls: channel.media_urls || [],
        owner_first_name: channel.owner_first_name,
        owner_last_name: channel.owner_last_name,
        created_at: channel.created_at
      }));

      setChannels(transformedChannels);
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const sortChannels = (channels: any[], sortOption: ChannelSortOption) => {
    return [...channels].sort((a, b) => {
      switch (sortOption) {
        case 'most-revenue-all-time':
          return b.revenueAllTime - a.revenueAllTime;
        case 'most-revenue-12-months':
          return b.revenue12Months - a.revenue12Months;
        case 'most-revenue-30-days':
          return b.revenue30Days - a.revenue30Days;
        case 'most-revenue':
          return b.ticketRevenue - a.ticketRevenue;
        case 'least-revenue':
          return a.ticketRevenue - b.ticketRevenue;
        case 'most-subscribers':
          return b.subscribers - a.subscribers;
        case 'least-subscribers':
          return a.subscribers - b.subscribers;
        case 'most-views':
          return b.views - a.views;
        case 'least-views':
          return a.views - b.views;
        case 'highest-rated':
          return parseFloat(b.rating) - parseFloat(a.rating);
        case 'lowest-rated':
          return parseFloat(a.rating) - parseFloat(b.rating);
        case 'most-events':
          return b.eventCount - a.eventCount;
        case 'least-events':
          return a.eventCount - b.eventCount;
        default:
          return b.revenue12Months - a.revenue12Months;
      }
    });
  };
  
  const filterChannels = (channels: any[]) => {
    return channels.filter(channel => {
      const matchesKeyword = channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            channel.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesMember = memberSearch === '' || 
                           channel.members?.some((member: string) => 
                             member.toLowerCase().includes(memberSearch.toLowerCase())
                           );
      
      return matchesKeyword && matchesMember;
    });
  };
  
  const filteredChannels = sortChannels(filterChannels(channels), sortBy);
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Channel created:', formData);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      channelName: '',
      channelDescription: '',
      category: ''
    });
    setIsCreateFormOpen(false);
  };
  
  const handleMediaUpload = (files: any[]) => {
    console.log('Media uploaded:', files);
  };
  
  const handleChannelClick = (channelId: string) => {
    navigate(`/channel/${channelId}`);
  };
  
  const isFormValid = formData.firstName && formData.lastName && formData.email && 
                     formData.channelName && formData.channelDescription && formData.category;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Channels</h1>
        
        <Collapsible open={isCreateFormOpen} onOpenChange={setIsCreateFormOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              className="mb-4 w-full md:w-auto bg-gradient-to-r from-green-500 to-blue-500 text-white border-none hover:from-green-600 hover:to-blue-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Channel
              {isCreateFormOpen ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mb-6">
            <CreateChannelForm 
              formData={formData}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              onMediaUpload={handleMediaUpload}
              isValid={typeof isFormValid === 'boolean' ? isFormValid : false}
            />
          </CollapsibleContent>
        </Collapsible>
        
        <ChannelRankingControls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortBy={sortBy}
          onSortChange={setSortBy}
          memberSearch={memberSearch}
          onMemberSearchChange={setMemberSearch}
        />
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="text-lg">Loading channels...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChannels.map((channel, index) => (
            <TooltipWrapper key={channel.id} content={`View ${channel.name} - ${channel.subscribers.toLocaleString()} subscribers`}>
              <Card 
                className={`hover:shadow-lg transition-all cursor-pointer relative ${
                  highlightedChannel === channel.id ? 'ring-4 ring-blue-500 ring-opacity-50 shadow-xl' : ''
                }`}
                onClick={() => handleChannelClick(channel.id)}
              >
                <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                  #{index + 1}
                </div>
                
                {/* Channel Thumbnail */}
                {channel.media_urls && channel.media_urls.length > 0 && (
                  <div className="h-40 overflow-hidden">
                    <img 
                      src={channel.media_urls[0]} 
                      alt={`${channel.name} thumbnail`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <CardHeader className="pt-8">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{channel.name}</CardTitle>
                    {channel.isLive && (
                      <TooltipWrapper content="This channel is currently live streaming">
                        <Badge className="bg-red-500">LIVE</Badge>
                      </TooltipWrapper>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-2">{channel.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                    <TooltipWrapper content="Total subscribers">
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {channel.subscribers.toLocaleString()}
                      </span>
                    </TooltipWrapper>
                    <TooltipWrapper content="Channel rating">
                      <span className="flex items-center">
                        <Star className="h-4 w-4 mr-1" />
                        {channel.rating}
                      </span>
                    </TooltipWrapper>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{channel.eventCount} events • {channel.views.toLocaleString()} views</span>
                    <TooltipWrapper content="Revenue (12 months)">
                      <span className="flex items-center font-semibold text-green-600">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {channel.revenue12Months.toLocaleString()}
                      </span>
                    </TooltipWrapper>
                  </div>
                </CardContent>
              </Card>
            </TooltipWrapper>
          ))}
        </div>
      )}
    </div>
  );
};

export default Channels;