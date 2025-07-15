import React, { useEffect, useState } from 'react';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ConnectionState } from 'livekit-client';

interface LiveKitProviderProps {
  eventId: string;
  userRole: 'host' | 'streamer' | 'viewer';
  children: React.ReactNode;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

export const LiveKitProvider: React.FC<LiveKitProviderProps> = ({
  eventId,
  userRole,
  children,
  onConnected,
  onDisconnected,
  onError,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [roomReady, setRoomReady] = useState(false);

  useEffect(() => {
    const generateToken = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the current session to include auth header
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          throw new Error('Please log in to access this stream');
        }

        const { data, error } = await supabase.functions.invoke('create-livekit-token', {
          body: {
            eventId,
            userRole,
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) {
          throw new Error(error.message || 'Failed to generate token');
        }

        if (!data?.token || !data?.serverUrl) {
          throw new Error('Invalid token response');
        }

        setToken(data.token);
        setServerUrl(data.serverUrl);
        console.log('LiveKit token generated successfully:', { 
          roomName: data.roomName, 
          serverUrl: data.serverUrl,
          userRole 
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate LiveKit token';
        setError(errorMessage);
        toast.error(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      generateToken();
    }
  }, [eventId, userRole, onError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Connecting to live stream...</p>
        </div>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-2">Failed to connect to live stream</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connectOptions={{
        autoSubscribe: true,
      }}
      onConnected={() => {
        console.log('LiveKit room connected');
        setConnectionState(ConnectionState.Connected);
        setRoomReady(true);
        toast.success('Connected to live stream');
        onConnected?.();
      }}
      onDisconnected={(reason) => {
        console.log('LiveKit room disconnected:', reason);
        setConnectionState(ConnectionState.Disconnected);
        setRoomReady(false);
        toast.info('Disconnected from live stream');
        onDisconnected?.();
      }}
      onError={(error) => {
        console.error('LiveKit room error:', error);
        setConnectionState(ConnectionState.Disconnected);
        setRoomReady(false);
        toast.error('Live stream connection error: ' + error.message);
        onError?.(error);
      }}
      style={{ height: '100%' }}
    >
      <RoomAudioRenderer />
      {roomReady ? children : (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {connectionState === ConnectionState.Connecting ? 'Connecting to room...' : 'Preparing live stream...'}
            </p>
          </div>
        </div>
      )}
    </LiveKitRoom>
  );
};