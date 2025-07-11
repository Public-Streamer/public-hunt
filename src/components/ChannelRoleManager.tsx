import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, Users, UserMinus } from 'lucide-react';
import ChannelPermissionCheckboxes from './ChannelPermissionCheckboxes';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  permissions?: string[];
}

interface ChannelRoleManagerProps {
  channelId: string;
  currentUserRole: 'channel_master' | 'channel_administrator' | 'channel_manager';
}

const ChannelRoleManager: React.FC<ChannelRoleManagerProps> = ({ channelId, currentUserRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [channelSubscribers, setChannelSubscribers] = useState<User[]>([]);
  const [channelTeam, setChannelTeam] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const availableRoles = [
    { 
      value: 'channel_master', 
      label: 'Channel Master',
      description: 'Full control over channel - can transfer ownership, manage all settings, and assign/remove all roles'
    },
    { 
      value: 'channel_administrator', 
      label: 'Channel Administrator',
      description: 'Can manage channel settings, assign roles (except Channel Master), and moderate content'
    },
    { 
      value: 'channel_manager', 
      label: 'Channel Manager',
      description: 'Can create and manage events, moderate comments, and manage basic channel operations'
    },
    { 
      value: 'channel_moderator', 
      label: 'Channel Moderator',
      description: 'Can moderate comments, manage live chat, and assist with basic channel maintenance'
    }
  ];

  useEffect(() => {
    if (channelId && channelId !== 'new-channel') {
      fetchChannelSubscribers();
    } else {
      // Mock data for new channel creation
      setChannelSubscribers([
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
        { id: '3', name: 'Bob Johnson', email: 'bob@example.com' },
        { id: '4', name: 'Alice Wilson', email: 'alice@example.com' },
        { id: '5', name: 'Mike Davis', email: 'mike@example.com' }
      ]);
    }
  }, [channelId]);

  const fetchChannelSubscribers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('channel_subscribers')
        .select(`
          user_id,
          user_profiles!inner(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('channel_id', channelId);

      if (error) throw error;

      // Use more defensive approach for the data structure
      const subscribers = data?.map(sub => {
        // Handle both object and array cases for user_profiles
        const profile = Array.isArray(sub.user_profiles) ? sub.user_profiles[0] : sub.user_profiles;
        return {
          id: profile?.id || sub.user_id,
          name: `${profile?.first_name || 'Unknown'} ${profile?.last_name || 'User'}`,
          email: profile?.email || 'No email'
        };
      }) || [];

      setChannelSubscribers(subscribers);
    } catch (error) {
      console.error('Error fetching channel subscribers:', error);
      // Fallback to mock data on error
      setChannelSubscribers([
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
        { id: '3', name: 'Bob Johnson', email: 'bob@example.com' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscribers = channelSubscribers.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (user.name.toLowerCase().includes(searchLower) ||
           user.email.toLowerCase().includes(searchLower)) &&
           !channelTeam.find(member => member.id === user.id);
  });

  const assignRole = (userId: string, role: string) => {
    const user = channelSubscribers.find(u => u.id === userId);
    if (user) {
      setChannelTeam(prev => {
        const existing = prev.find(r => r.id === userId);
        if (existing) {
          return prev.map(r => r.id === userId ? { ...r, role } : r);
        } else {
          return [...prev, { ...user, role }];
        }
      });
      setSearchTerm(''); // Clear search after adding
    }
  };

  const removeRole = (userId: string) => {
    setChannelTeam(prev => prev.filter(r => r.id !== userId));
  };

  const canManageRoles = currentUserRole === 'channel_master' || currentUserRole === 'channel_administrator';

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Channel Production Team
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {canManageRoles && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search channel subscribers to add..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
              
              {searchTerm && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredSubscribers.length > 0 ? (
                    filteredSubscribers.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        <Select onValueChange={(role) => assignRole(user.id, role)}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Assign role" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableRoles.map(role => (
                              <Tooltip key={role.value}>
                                <TooltipTrigger asChild>
                                  <SelectItem value={role.value}>
                                    {role.label}
                                  </SelectItem>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-xs">
                                  <p className="font-medium">{role.label}</p>
                                  <p className="text-sm">{role.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No subscribers found matching your search.</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <h4 className="font-medium">Current Team Members</h4>
            {channelTeam.length > 0 ? (
              channelTeam.map(user => (
                <div key={user.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {availableRoles.find(r => r.value === user.role)?.label}
                      </Badge>
                      {canManageRoles && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeRole(user.id)}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <ChannelPermissionCheckboxes
                    selectedRole={user.role || ''}
                    permissions={user.permissions || []}
                    onPermissionChange={() => {}}
                  />
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No team members assigned yet. Use the search box above to add channel subscribers to your production team.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default ChannelRoleManager;