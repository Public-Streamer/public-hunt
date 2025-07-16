import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Info, AlertCircle } from 'lucide-react';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface Channel {
  id: string;
  name: string;
  description: string;
  user_id: string;
  category: string;
  role?: 'channel_master' | 'channel_admin' | 'member';
}

interface ChannelSelectorProps {
  selectedChannelId: string;
  onChannelChange: (channelId: string, requiresApproval: boolean) => void;
}

const ChannelSelector: React.FC<ChannelSelectorProps> = ({
  selectedChannelId,
  onChannelChange
}) => {
  const [userChannels, setUserChannels] = useState<Channel[]>([]);
  const [searchResults, setSearchResults] = useState<Channel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadUserChannels();
  }, []);

  const loadUserChannels = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) return;

      // Get channels where user has admin or master permissions
      const { data: permissions, error: permError } = await supabase
        .from('channel_permissions')
        .select(`
          channel_id,
          role,
          channels!inner (
            id,
            name,
            description,
            category,
            user_id
          )
        `)
        .eq('user_id', userData.user.id)
        .in('role', ['channel_master', 'channel_admin']);

      if (permError) throw permError;

      // Get channels owned by user (they automatically have channel_master role)
      const { data: ownedChannels, error: ownedError } = await supabase
        .from('channels')
        .select('*')
        .eq('user_id', userData.user.id);

      if (ownedError) throw ownedError;

      // Combine and format channels
      const channelsFromPermissions = permissions?.map(p => ({
        id: (p.channels as any).id,
        name: (p.channels as any).name,
        description: (p.channels as any).description,
        category: (p.channels as any).category,
        user_id: (p.channels as any).user_id,
        role: p.role
      })) || [];

      const ownedChannelsFormatted = ownedChannels?.map(c => ({
        ...c,
        role: 'channel_master' as const
      })) || [];

      // Remove duplicates and combine
      const allChannels = [...ownedChannelsFormatted];
      channelsFromPermissions.forEach(channel => {
        if (!allChannels.find(c => c.id === channel.id)) {
          allChannels.push(channel);
        }
      });

      setUserChannels(allChannels);
    } catch (error) {
      console.error('Error loading user channels:', error);
      toast({
        title: "Error",
        description: "Failed to load your channels.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const searchChannels = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(10);

      if (error) throw error;

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching channels:', error);
      toast({
        title: "Error",
        description: "Failed to search channels.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleChannelSelect = (channelId: string) => {
    if (channelId === 'assign-later') {
      onChannelChange('', false);
      return;
    }

    const userChannel = userChannels.find(c => c.id === channelId);
    const searchChannel = searchResults.find(c => c.id === channelId);
    
    if (userChannel && (userChannel.role === 'channel_master' || userChannel.role === 'channel_admin')) {
      // User has permission to assign to this channel
      onChannelChange(channelId, false);
    } else if (searchChannel) {
      // User doesn't have permission, requires approval
      onChannelChange(channelId, true);
      toast({
        title: "Approval Required",
        description: "A request will be sent to the channel administrators for approval.",
        variant: "default"
      });
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      searchChannels(value);
    } else {
      setSearchResults([]);
    }
  };

  const selectedChannel = userChannels.find(c => c.id === selectedChannelId) || 
                         searchResults.find(c => c.id === selectedChannelId);

  if (loading) {
    return (
      <div className="space-y-2">
        <Label className="text-base font-bold">Channel</Label>
        <div className="animate-pulse bg-muted h-10 rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Label className="text-base font-bold">Channel</Label>
        <TooltipWrapper content="Select a channel to assign this event to. You can only assign events to channels where you are a Channel Master or Channel Admin.">
          <Info className="h-4 w-4 text-muted-foreground" />
        </TooltipWrapper>
      </div>

      <div className="space-y-3">
        <Select value={selectedChannelId || 'assign-later'} onValueChange={handleChannelSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a channel or assign later" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="assign-later">Assign Later</SelectItem>
            {userChannels.map(channel => (
              <SelectItem key={channel.id} value={channel.id}>
                <div className="flex items-center space-x-2">
                  <span>{channel.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({channel.role === 'channel_master' ? 'Master' : 'Admin'})
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowSearch(!showSearch)}
            className="flex items-center space-x-2"
          >
            <Search className="h-4 w-4" />
            <span>Search All Channels</span>
          </Button>
        </div>

        {showSearch && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search channels by name..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {isSearching && (
                <div className="text-sm text-muted-foreground">Searching...</div>
              )}
              
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map(channel => {
                    const hasPermission = userChannels.some(uc => uc.id === channel.id);
                    return (
                      <div
                        key={channel.id}
                        className={`p-3 border rounded-md cursor-pointer hover:bg-muted ${
                          selectedChannelId === channel.id ? 'bg-muted border-primary' : ''
                        }`}
                        onClick={() => handleChannelSelect(channel.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{channel.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {channel.category}
                            </div>
                          </div>
                          {!hasPermission && (
                            <TooltipWrapper content="Selecting this channel will require approval from channel administrators">
                              <AlertCircle className="h-4 w-4 text-amber-500" />
                            </TooltipWrapper>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {searchQuery && !isSearching && searchResults.length === 0 && (
                <div className="text-sm text-muted-foreground">No channels found</div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {selectedChannel && (
        <Card>
          <CardContent className="p-4">
            <div className="text-sm">
              <div className="font-medium">Selected: {selectedChannel.name}</div>
              <div className="text-muted-foreground">{selectedChannel.description}</div>
              {selectedChannel.role && (
                <div className="mt-2 text-xs text-green-600">
                  ✓ You have {selectedChannel.role.replace('_', ' ')} permissions
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ChannelSelector;