import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, UserPlus, X, Lock, Edit, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client"
import { useAppContext } from '@/contexts/AppContext';
import EventRoleManager from '@/components/EventRoleManager';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

interface EventProductionTeamProps {
  eventId: string;
}

const EventProductionTeam: React.FC<EventProductionTeamProps> = ({ eventId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAppContext();
  const { toast } = useToast();
  
  const userRole = 'Event Manager';
  const canModifyRoles = ['Event Manager', 'Event Admin', 'Event Master'].includes(userRole);

  // Load existing team members and available users
  useEffect(() => {
    loadTeamData();
  }, [eventId]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      
      // Load existing team members
      const { data: existingStreamers, error: streamersError } = await supabase
        .from('event_streamers')
        .select(`
          streamer_id,
          permissions,
          role_type
        `)
        .eq('event_id', eventId);

      if (streamersError) throw streamersError;

      // Load user profiles for available team members
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, profile_picture_url, user_id')
        .limit(50);

      if (profilesError) throw profilesError;

      // Convert profiles to subscribers format
      const availableSubscribers: Subscriber[] = profiles?.map(profile => ({
        id: profile.user_id,
        name: profile.display_name || profile.username || 'Unknown',
        email: profile.username,
        avatar: profile.profile_picture_url || undefined
      })) || [];

      setSubscribers(availableSubscribers);

      // Convert existing streamers to selected members format
      if (existingStreamers && existingStreamers.length > 0) {
        const teamMembers: SelectedMember[] = existingStreamers.map(streamer => {
          const profile = availableSubscribers.find(sub => sub.id === streamer.streamer_id);
          return {
            id: streamer.streamer_id,
            name: profile?.name || 'Unknown',
            email: profile?.email || 'Unknown',
            avatar: profile?.avatar,
            permissions: streamer.permissions || [],
            confirmed: true
          };
        });
        
        setSelectedMembers(teamMembers);
        setIsLocked(teamMembers.length > 0);
      }
    } catch (error) {
      console.error('Error loading team data:', error);
      toast({
        title: "Error",
        description: "Failed to load team data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscribers = subscribers.filter(subscriber => 
    !selectedMembers.some(member => member.id === subscriber.id) &&
    (subscriber.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     subscriber.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addMember = (subscriber: Subscriber) => {
    const newMember: SelectedMember = {
      ...subscriber,
      permissions: [],
      confirmed: false
    };
    const updated = [...selectedMembers, newMember];
    setSelectedMembers(updated);
    setSearchTerm('');
  };

  const removeMember = async (id: string) => {
    try {
      // Remove from database
      const { error } = await supabase
        .from('event_streamers')
        .delete()
        .eq('event_id', eventId)
        .eq('streamer_id', id);

      if (error) throw error;

      // Remove from local state
      const updated = selectedMembers.filter(member => member.id !== id);
      setSelectedMembers(updated);
      
      toast({
        title: "Member Removed",
        description: "Team member has been removed successfully",
      });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive",
      });
    }
  };

  const updateMemberPermissions = (memberId: string, permissions: string[]) => {
    const updated = selectedMembers.map(member => {
      if (member.id === memberId) {
        return { ...member, permissions };
      }
      return member;
    });
    setSelectedMembers(updated);
  };

  const confirmMember = async (memberId: string) => {
    try {
      const member = selectedMembers.find(m => m.id === memberId);
      if (!member) return;

      // Add to database
      const { error } = await supabase
        .from('event_streamers')
        .insert({
          event_id: eventId,
          streamer_id: memberId,
          assigned_by: user?.id || '',
          role_type: 'Streamers',
          permissions: member.permissions
        });

      if (error) throw error;

      // Update local state
      const updated = selectedMembers.map(member => {
        if (member.id === memberId) {
          return { ...member, confirmed: true };
        }
        return member;
      });
      setSelectedMembers(updated);
      
      toast({
        title: "Member Confirmed",
        description: "Team member has been added successfully",
      });
    } catch (error) {
      console.error('Error confirming member:', error);
      toast({
        title: "Error",
        description: "Failed to confirm team member",
        variant: "destructive",
      });
    }
  };

  const confirmRoles = () => {
    setIsLocked(true);
    toast({
      title: "Roles Confirmed",
      description: "Team roles and permissions have been locked",
    });
  };

  const unlockRoles = () => {
    if (canModifyRoles) {
      setIsLocked(false);
      toast({
        title: "Roles Unlocked",
        description: "You can now modify team roles and permissions",
      });
    }
  };

  const allMembersConfirmed = selectedMembers.length > 0 && selectedMembers.every(m => m.confirmed);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Event Production Team
            <Badge variant="secondary">{selectedMembers.length}</Badge>
          </div>
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
                        variant="ghost"
                        size="sm"
                        onClick={() => addMember(subscriber)}
                        className="h-8 w-8 p-0"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add to production team</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ))}
            {filteredSubscribers.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No users found matching your search.
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          {selectedMembers.map(member => (
            <div key={member.id} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                  {member.confirmed && (
                    <Badge variant="default" className="bg-green-600">Confirmed</Badge>
                  )}
                </div>
                {!isLocked && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMember(member.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <EventRoleManager
                member={{
                  id: member.id,
                  name: member.name,
                  email: member.email,
                  permissions: member.permissions,
                  confirmed: member.confirmed
                }}
                onPermissionsChange={(permissions) => updateMemberPermissions(member.id, permissions)}
                onConfirm={() => confirmMember(member.id)}
                disabled={isLocked}
              />
            </div>
          ))}
          
          {selectedMembers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No team members added yet.</p>
              <p className="text-sm">Search and add users to build your production team.</p>
            </div>
          )}
        </div>

        {selectedMembers.length > 0 && (
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              {selectedMembers.filter(m => m.confirmed).length} of {selectedMembers.length} members confirmed
            </div>
            
            {!isLocked ? (
              <Button 
                onClick={confirmRoles}
                disabled={!allMembersConfirmed}
                className="bg-green-600 hover:bg-green-700"
              >
                Confirm Team Setup
              </Button>
            ) : (
              canModifyRoles && (
                <Button
                  variant="outline"
                  onClick={unlockRoles}
                  className="flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Modify Team</span>
                </Button>
              )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EventProductionTeam;