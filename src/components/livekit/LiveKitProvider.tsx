import React, { useState, createContext, useContext } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';
import { Participant } from 'livekit-client';

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'failed';

interface StreamContextType {
  eventId: string;
  userRole: 'host' | 'streamer' | 'viewer';
  connectionState: ConnectionState;
  isLive: boolean;
  participants: Participant[];
  error: string | null;
}

interface LiveKitProviderProps {
  token: string;
  serverUrl: string;
  children: React.ReactNode;
  eventId: string;
  userRole: 'host' | 'streamer' | 'viewer';
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

const StreamContext = createContext<StreamContextType | null>(null);

export const LiveKitProvider: React.FC<LiveKitProviderProps> = ({
  token,
  serverUrl,
  children,
  eventId,
  userRole,
  onConnected,
  onDisconnected,
  onError,
}) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  const handleConnected = () => {
    setConnectionState('connected');
    setIsLive(true);
    onConnected?.();
  };

  const handleDisconnected = () => {
    setConnectionState('disconnected');
    setIsLive(false);
    onDisconnected?.();
  };

  const handleError = (err: Error) => {
    setError(err.message);
    setConnectionState('failed');
    onError?.(err);
  };

  const contextValue: StreamContextType = {
    eventId,
    userRole,
    connectionState,
    isLive,
    participants,
    error,
  };

  return (
    <StreamContext.Provider value={contextValue}>
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connectOptions={{
          autoSubscribe: userRole === 'viewer',
        }}
        onConnected={handleConnected}
        onDisconnected={handleDisconnected}
        onError={handleError}
        style={{ height: '100%', width: '100%' }}
      >
        {children}
      </LiveKitRoom>
    </StreamContext.Provider>
  );
};

export const useStreamContext = () => {
  const context = useContext(StreamContext);
  if (!context) {
    throw new Error('useStreamContext must be used within StreamProvider');
  }
  return context;
};

export default LiveKitProvider;
