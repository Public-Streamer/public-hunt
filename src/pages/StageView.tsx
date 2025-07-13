import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Video, Users, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import LiveKitRoom from '@/components/LiveKitRoom';
import StreamControls from '@/components/StreamControls';
import { useToast } from '@/hooks/use-toast';

interface EventData {
  id: string;
  name: string;
  description: string;
  is_live: boolean;
  created_by: string;
  livekit_room_name: string;
}

const StageView: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [userRole, setUserRole] = useState<'host' | 'streamer' | 'viewer'>('viewer');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventAndUserData = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          toast({
            title: "Authentication Required",
            description: "Please log in to access the stage",
            variant: "destructive"
          });
          navigate('/login');
          return;
        }

        setCurrentUser(user.id);

        // Get event data
        const { data: event, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();

        if (eventError) throw eventError;
        setEventData(event);

        // Determine user role
        if (event.created_by === user.id) {
          setUserRole('host');
        } else {
          // Check if user is a participant
          const { data: participant } = await supabase
            .from('event_participants')
            .select('role')
            .eq('event_id', eventId)
            .eq('user_id', user.id)
            .single();

          if (participant) {
            setUserRole(participant.role as 'host' | 'streamer' | 'viewer');
          } else {
            setUserRole('viewer');
          }
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load event data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (eventId) {
      fetchEventAndUserData();
    }
  }, [eventId, navigate, toast]);

  const handleBackToEvent = () => {
    navigate(`/event/${eventId}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading stage...</p>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <Button onClick={() => navigate('/events')}>Back to Events</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button 
          onClick={handleBackToEvent}
          variant="outline" 
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Event
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{eventData.name}</h1>
            <p className="text-gray-600 mt-2">Stage View</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={eventData.is_live ? "default" : "secondary"}
              className={eventData.is_live ? "bg-red-600" : ""}
            >
              {eventData.is_live ? "LIVE" : "OFFLINE"}
            </Badge>
            <Badge variant="outline">
              {userRole.toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Stream Area */}
        <div className="lg:col-span-3 space-y-6">
          <LiveKitRoom
            eventId={eventId!}
            userRole={userRole}
            userName="User"
            autoConnect={false}
            showControls={true}
            onDisconnect={handleBackToEvent}
          />
          
          {/* Event Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Video className="h-5 w-5 mr-2" />
                Event Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{eventData.description}</p>
            </CardContent>
          </Card>
        </div>

        {/* Controls Sidebar */}
        <div className="space-y-6">
          {/* Stream Controls - Only for hosts and streamers */}
          {(userRole === 'host' || userRole === 'streamer') && (
            <StreamControls
              eventId={eventId!}
              userRole={userRole as 'host' | 'streamer'}
              onStreamStart={() => {
                setEventData(prev => prev ? { ...prev, is_live: true } : null);
              }}
              onStreamEnd={() => {
                setEventData(prev => prev ? { ...prev, is_live: false } : null);
              }}
            />
          )}

          {/* Participant Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Your Role</span>
                  <Badge variant="outline" className="text-xs">
                    {userRole}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge 
                    variant={eventData.is_live ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {eventData.is_live ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={handleBackToEvent}
              >
                Return to Event Page
              </Button>
              {userRole === 'host' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate(`/event/${eventId}/setup`)}
                >
                  Event Settings
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StageView;