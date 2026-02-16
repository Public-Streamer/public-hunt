import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Trash2, Search, MoreHorizontal, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Participant {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  role: 'host' | 'streamer' | 'viewer';
  status: 'active' | 'pending' | 'banned';
}

interface ParticipantManagerProps {
  eventId: string;
  currentUserId: string;
  isEventHost: boolean;
}

export const ParticipantManager: React.FC<ParticipantManagerProps> = ({
  eventId,
  currentUserId,
  isEventHost,
}) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newParticipantEmail, setNewParticipantEmail] = useState('');
  const [newParticipantRole, setNewParticipantRole] = useState<'streamer' | 'viewer'>('streamer');
  const [addingParticipant, setAddingParticipant] = useState(false);
  const { toast } = useToast();

  const fetchParticipants = async () => {
    try {
      setLoading(true);

      // Fetch event participants
      const { data: eventParticipants, error: participantsError } = await supabase
        .from('event_participants')
        .select('*, user_profiles!inner(username, display_name)')
        .eq('event_id', eventId);

      if (participantsError) throw participantsError;

      // Fetch event streamers
      const { data: eventStreamers, error: streamersError } = await supabase
        .from('event_streamers')
        .select('*, user_profiles!inner(username, display_name)')
        .eq('event_id', eventId);

      if (streamersError) throw streamersError;

      // Combine and format data
      const formattedParticipants: Participant[] = [];

      // Add host (current user)
      formattedParticipants.push({
        id: `host-${currentUserId}`,
        user_id: currentUserId,
        username: 'current_user', // Would be replaced with actual username in real implementation
        display_name: 'You (Host)',
        role: 'host',
        status: 'active',
      });

      // Add streamers
      if (eventStreamers) {
        eventStreamers.forEach(streamer => {
          formattedParticipants.push({
            id: `streamer-${streamer.user_id}`,
            user_id: streamer.user_id,
            username: streamer.user_profiles?.username || 'unknown',
            display_name: streamer.user_profiles?.display_name || 'Streamer',
            role: 'streamer',
            status: 'active',
          });
        });
      }

      // Add regular participants
      if (eventParticipants) {
        eventParticipants.forEach(participant => {
          // Skip if already added as streamer
          if (!formattedParticipants.some(p => p.user_id === participant.user_id)) {
            formattedParticipants.push({
              id: `participant-${participant.user_id}`,
              user_id: participant.user_id,
              username: participant.user_profiles?.username || 'unknown',
              display_name: participant.user_profiles?.display_name || 'Participant',
              role: 'viewer',
              status: participant.status as 'active' | 'pending' | 'banned',
            });
          }
        });
      }

      setParticipants(formattedParticipants);
    } catch (error) {
      console.error('Error fetching participants:', error);
      toast({
        title: 'Error',
        description: 'Failed to load participants',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addParticipant = async () => {
    if (!newParticipantEmail.trim() || addingParticipant) return;

    try {
      setAddingParticipant(true);

      // Check if user exists
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('user_id, username, display_name')
        .ilike('email', `%${newParticipantEmail}%`)
        .limit(1);

      if (userError) throw userError;
      if (!userData || userData.length === 0) {
        throw new Error('User not found');
      }

      const user = userData[0];

      // Add participant based on role
      if (newParticipantRole === 'streamer') {
        const { error: streamerError } = await supabase
          .from('event_streamers')
          .insert({
            event_id: eventId,
            streamer_id: user.user_id,
            role_type: 'streamer',
          });

        if (streamerError) throw streamerError;
      } else {
        const { error: participantError } = await supabase
          .from('event_participants')
          .insert({
            event_id: eventId,
            user_id: user.user_id,
            status: 'active',
          });

        if (participantError) throw participantError;
      }

      // Refresh participants list
      await fetchParticipants();

      toast({
        title: 'Success',
        description: 'Participant added successfully',
      });

      // Reset form
      setNewParticipantEmail('');
    } catch (error) {
      console.error('Error adding participant:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add participant',
        variant: 'destructive',
      });
    } finally {
      setAddingParticipant(false);
    }
  };

  const removeParticipant = async (participantId: string, userId: string) => {
    try {
      // Remove from streamers first
      const { error: streamerError } = await supabase
        .from('event_streamers')
        .delete()
        .eq('event_id', eventId)
        .eq('streamer_id', userId);

      if (streamerError) console.error('Error removing from streamers:', streamerError);

      // Remove from participants
      const { error: participantError } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);

      if (participantError) console.error('Error removing from participants:', participantError);

      // Refresh participants list
      await fetchParticipants();

      toast({
        title: 'Success',
        description: 'Participant removed successfully',
      });
    } catch (error) {
      console.error('Error removing participant:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove participant',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [eventId]);

  const filteredParticipants = participants.filter(participant =>
    participant.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    participant.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isEventHost) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Participant Management
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Add Participant Form */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-semibold mb-3">Add Participant</h4>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="User email or username"
              value={newParticipantEmail}
              onChange={(e) => setNewParticipantEmail(e.target.value)}
              className="flex-1"
              disabled={addingParticipant}
            />
            <Select
              value={newParticipantRole}
              onValueChange={(value: 'streamer' | 'viewer') => setNewParticipantRole(value)}
              disabled={addingParticipant}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="streamer">Streamer</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={addParticipant}
              disabled={!newParticipantEmail.trim() || addingParticipant}
            >
              {addingParticipant ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search participants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Participants List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading participants...</p>
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No participants found</p>
              {searchTerm && <p className="text-sm mt-2">Try clearing your search</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm">
                      {participant.display_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{participant.display_name}</p>
                      <p className="text-sm text-gray-500">@{participant.username}</p>
                    </div>
                    <Badge
                      variant={participant.role === 'host' ? 'default' :
                              participant.role === 'streamer' ? 'secondary' : 'outline'}
                      className="ml-2"
                    >
                      {participant.role}
                    </Badge>
                    {participant.status !== 'active' && (
                      <Badge variant="destructive" className="ml-1">
                        {participant.status}
                      </Badge>
                    )}
                  </div>

                  {participant.user_id !== currentUserId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeParticipant(participant.id, participant.user_id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ParticipantManager;
