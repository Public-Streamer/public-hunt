import React, { useEffect, useState } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

  useEffect(() => {
    const generateToken = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.functions.invoke('create-livekit-token', {
          body: {
            eventId,
            userRole,
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
        toast.success('Connected to live stream');
        onConnected?.();
      }}
      onDisconnected={() => {
        toast.info('Disconnected from live stream');
        onDisconnected?.();
      }}
      onError={(error) => {
        toast.error('Live stream connection error');
        onError?.(error);
      }}
      style={{ height: '100%' }}
    >
      {children}
    </LiveKitRoom>
  );
};