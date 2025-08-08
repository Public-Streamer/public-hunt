import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, X, Lock, Edit } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import EventRoleManager from '@/components/EventRoleManager';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from "@/integrations/supabase/client"

interface Subscriber {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface SelectedMember extends Subscriber {
  permissions: string[];
  confirmed: boolean;
}

interface StreamerSelectorProps {
  onStreamersChange: (streamers: SelectedMember[]) => void;
  initialStreamers?: SelectedMember[];
}

const StreamerSelector: React.FC<StreamerSelectorProps> = ({ onStreamersChange, initialStreamers = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>(initialStreamers);
  const [isLocked, setIsLocked] = useState(false);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAppContext();
  
  const userRole = 'Event Manager';
  const canModifyRoles = ['Event Manager', 'Event Admin', 'Event Master'].includes(userRole);

  // Fetch real users from user_profiles table
  // Future: This will be replaced with channel_subscribers query when channels are implemented
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, username, display_name, profile_picture_url, user_id')
          .limit(50);

        if (error) {
          console.error('Error fetching users:', error);
          return;
        }

        // Transform user_profiles data into subscribers format
        const transformedSubscribers: Subscriber[] = (data || []).map(profile => ({
          id: profile.user_id || profile.id,
          name: profile.display_name || profile.username || 'Unknown User',
          email: profile.username || 'user@example.com', // Username as email placeholder
          avatar: profile.profile_picture_url
        }));

        setSubscribers(transformedSubscribers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Update selectedMembers when initialStreamers changes
  useEffect(() => {
    console.log('useEffect triggered - initialStreamers:', initialStreamers, 'current selectedMembers:', selectedMembers);
    // Only update if initialStreamers is different and not empty (unless we're resetting)
    if (initialStreamers.length > 0 && JSON.stringify(initialStreamers) !== JSON.stringify(selectedMembers)) {
      console.log('Updating selectedMembers from initialStreamers');
      setSelectedMembers(initialStreamers);
    }
  }, [initialStreamers]);

  const filteredSubscribers = subscribers.filter(sub => 
    sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addMember = (subscriber: Subscriber) => {
    if (selectedMembers.length >= 20 || isLocked) return;
    
    const newMember: SelectedMember = {
      ...subscriber,
      permissions: ['event_master'], // Default to event_master role (Streamer)
      confirmed: false
    };
    
    console.log('Adding member:', newMember);
    const updated = [...selectedMembers, newMember];
    console.log('Updated selectedMembers:', updated);
    setSelectedMembers(updated);
    onStreamersChange(updated);
    setSearchTerm(''); // Clear search after adding
  };

  const removeMember = (id: string) => {
    if (isLocked) return;
    const updated = selectedMembers.filter(s => s.id !== id);
    setSelectedMembers(updated);
    onStreamersChange(updated);
  };

  const updateMemberPermissions = (memberId: string, permissions: string[]) => {
    if (isLocked) return;
    const updated = selectedMembers.map(member => {
      if (member.id === memberId) {
        return { ...member, permissions };
      }
      return member;
    });
    setSelectedMembers(updated);
    onStreamersChange(updated);
  };

  const confirmMember = (memberId: string) => {
    const updated = selectedMembers.map(member => {
      if (member.id === memberId) {
        return { ...member, confirmed: true };
      }
      return member;
    });
    setSelectedMembers(updated);
    onStreamersChange(updated);
  };

  const confirmRoles = () => {
    setIsLocked(true);
    onStreamersChange(selectedMembers);
  };

  const unlockRoles = () => {
    if (canModifyRoles) {
      setIsLocked(false);
      onStreamersChange(selectedMembers);
    }
  };

  const allMembersConfirmed = selectedMembers.length > 0 && selectedMembers.every(m => m.confirmed);

  console.log('StreamerSelector render - selectedMembers:', selectedMembers, 'length:', selectedMembers.length);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Event Production Team
          {isLocked && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Lock className="h-5 w-5 text-green-600" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Team roles and permissions are confirmed</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isLocked && (
          <div>
            <Label htmlFor="search">Search and add subscribers to event production team</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
            {loading && (
              <div className="text-sm text-gray-500 mt-2">Loading users...</div>
            )}
          </div>
        )}

        {searchTerm && !isLocked && (
          <div className="max-h-40 overflow-y-auto border rounded-md p-2">
            {filteredSubscribers.map(subscriber => (
              <div key={subscriber.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={subscriber.avatar} />
                    <AvatarFallback>{subscriber.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{subscriber.name}</p>
                    <p className="text-xs text-gray-500">{subscriber.email}</p>
                  </div>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addMember(subscriber)}
                        disabled={selectedMembers.length >= 20 || selectedMembers.some(s => s.id === subscriber.id)}
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add {subscriber.name} to the production team</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ))}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <Label className="text-base font-semibold text-gray-700">Event Production Team ({selectedMembers.length}/20)</Label>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              isLocked 
                ? "bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200 shadow-sm" 
                : selectedMembers.length > 0
                  ? "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200 shadow-sm"
                  : "bg-gray-100 text-gray-600 border border-gray-200"
            }`}>
              <span className="font-semibold">
                {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
              </span>
              {isLocked && (
                <div className="flex items-center justify-center w-5 h-5 bg-green-600 rounded-full">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            {selectedMembers.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                No team members selected yet. Search and add members above.
              </div>
            ) : (
              selectedMembers.map(member => {
                console.log('Rendering member:', member);
                return (
                  <EventRoleManager
                    key={member.id}
                    member={member}
                    onPermissionsChange={(permissions) => updateMemberPermissions(member.id, permissions)}
                    onConfirm={() => confirmMember(member.id)}
                    onRemove={!isLocked ? () => removeMember(member.id) : undefined}
                    disabled={isLocked}
                  />
                );
              })
            )}
          </div>
        </div>

        {selectedMembers.length > 0 && !isLocked && allMembersConfirmed && (
          <div className="flex justify-center pt-4 px-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={confirmRoles}
                    className="bg-green-600 hover:bg-green-700 text-white w-full max-w-md px-4 py-3 text-center whitespace-normal leading-tight break-words min-h-[60px]"
                  >
                    <span className="text-xs sm:text-sm md:text-base leading-tight">
                      Confirm Event Production Team Roles and Permissions
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Lock in the current team setup and permissions</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {isLocked && (
          <div className="text-center bg-green-50 p-3 rounded border border-green-200">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Lock className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 font-medium">
                Production team confirmed with {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''}
              </span>
            </div>
            {canModifyRoles && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={unlockRoles}
                      size="sm"
                      variant="outline"
                      className="mt-2"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Modify Team
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Unlock to edit team roles and permissions</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StreamerSelector;