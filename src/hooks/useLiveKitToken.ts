import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface LiveKitTokenResult {
  token: string | null;
  loading: boolean;
  error: string | null;
  refreshToken: () => Promise<void>;
}

export const useLiveKitToken = (
  eventId: string | null,
  userRole: 'host' | 'streamer' | 'viewer',
  permissions: {
    canPublish: boolean;
    canSubscribe: boolean;
    canPublishData: boolean;
  } = {
    canPublish: false,
    canSubscribe: true,
    canPublishData: false,
  }
): LiveKitTokenResult => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const generateToken = async (): Promise<void> => {
    if (!eventId) {
      setError('Event ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.functions.invoke(
        'create-livekit-token',
        {
          body: {
            eventId,
            userRole,
            permissions,
          },
        }
      );

      if (fetchError) {
        throw new Error(fetchError.message || 'Failed to generate LiveKit token');
      }

      if (!data?.token) {
        throw new Error('Invalid token response from server');
      }

      setToken(data.token);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error generating token';
      setError(errorMessage);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  // Generate token on initial load
  useEffect(() => {
    generateToken();
  }, [eventId, userRole]);

  return {
    token,
    loading,
    error,
    refreshToken: generateToken,
  };
};

export default useLiveKitToken;
