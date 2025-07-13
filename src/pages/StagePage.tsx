import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LiveKitProvider } from '@/components/LiveKitProvider';
import { StreamerInterface } from '@/components/StreamerInterface';
import { toast } from 'sonner';

const StagePage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'host' | 'streamer' | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuthAndFetchEvent = async () => {
      try {
        // Check authentication
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !currentUser) {
          toast.error('Please log in to access the stage');
          return;
        }

        setUser(currentUser);

        if (!eventId) {
          toast.error('Event ID is required');
          return;
        }

        // Fetch event details
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();

        if (eventError) {
          toast.error('Event not found');
          return;
        }

        setEvent(eventData);

        // Check if user is host (event creator)
        if (eventData.created_by === currentUser.id) {
          setUserRole('host');
          return;
        }

        // Check if user is assigned as streamer
        const { data: streamerData } = await supabase
          .from('event_streamers')
          .select('*')
          .eq('event_id', eventId)
          .eq('streamer_id', currentUser.id)
          .single();

        if (streamerData) {
          setUserRole('streamer');
          return;
        }

        // User is not authorized to access stage
        toast.error('You are not authorized to access this stage');
      } catch (error) {
        console.error('Error checking access:', error);
        toast.error('Failed to load stage');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchEvent();
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading stage...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!event || !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You are not authorized to access this stage.</p>
        </div>
      </div>
    );
  }
  
  return (
    <LiveKitProvider
      eventId={eventId}
      userRole={userRole}
      onError={(error) => {
        console.error('LiveKit error:', error);
        toast.error('Connection error: ' + error.message);
      }}
    >
      <StreamerInterface 
        eventId={eventId} 
        eventTitle={event.name}
      />
    </LiveKitProvider>
  );
};

export default StagePage;