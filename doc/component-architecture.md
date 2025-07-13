# Component Architecture

## 🏗️ Frontend Architecture Overview

This document outlines the React component structure for the LiveKit-integrated event streaming platform.

## 📁 Component Hierarchy

```
src/
├── components/
│   ├── livekit/                    # LiveKit-specific components
│   │   ├── LiveKitProvider.tsx     # Root LiveKit wrapper
│   │   ├── StreamerInterface.tsx   # Streaming controls & interface
│   │   ├── ViewerInterface.tsx     # Viewer experience
│   │   ├── MultiCameraGrid.tsx     # Multiple stream display
│   │   └── StreamingControls.tsx   # Camera/mic controls
│   │
│   ├── events/                     # Event-related components
│   │   ├── CreateEventForm.tsx     # Enhanced with LiveKit
│   │   ├── EventCard.tsx           # Updated with live status
│   │   ├── EventGrid.tsx           # Dynamic event listing
│   │   └── EventAnalytics.tsx      # Stream analytics
│   │
│   ├── access/                     # Access control components
│   │   ├── TicketVerification.tsx  # Payment verification
│   │   ├── StreamPaywall.tsx       # Access restrictions
│   │   ├── ParticipantManager.tsx  # Role management
│   │   └── PermissionGuard.tsx     # Route protection
│   │
│   └── real-time/                  # Real-time features
│       ├── LiveViewerCount.tsx     # Real-time viewer tracking
│       ├── StreamStatus.tsx        # Connection status
│       ├── LiveNotifications.tsx   # Real-time alerts
│       └── BulletinBoard.tsx       # Enhanced chat (existing)
│
├── hooks/                          # Custom hooks
│   ├── useStreamingControls.ts     # Camera/mic management
│   ├── useEventData.ts             # Event data fetching
│   ├── useLiveKitToken.ts          # Token management
│   ├── useParticipantCount.ts      # Real-time counts
│   └── useAccessControl.ts         # Permission checking
│
├── pages/                          # Updated page components
│   ├── StagePage.tsx               # Streamer interface
│   ├── EventPage.tsx               # Viewer interface
│   ├── Events.tsx                  # Dynamic event listing
│   └── EventAnalytics.tsx          # Analytics dashboard
│
└── utils/
    ├── livekit.ts                  # LiveKit utilities
    ├── permissions.ts              # Permission helpers
    └── streaming.ts                # Streaming utilities
```

## 🎯 Core Components

### 1. LiveKitProvider (Root Wrapper)

```tsx
// components/livekit/LiveKitProvider.tsx
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';

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

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connectOptions={{
        autoSubscribe: userRole === 'viewer',
        publishAudio: userRole !== 'viewer',
        publishVideo: userRole !== 'viewer',
      }}
      onConnected={() => {
        setConnectionState('connected');
        onConnected?.();
      }}
      onDisconnected={() => {
        setConnectionState('disconnected');
        onDisconnected?.();
      }}
      onError={onError}
      style={{ height: '100%', width: '100%' }}
    >
      <StreamContext.Provider value={{ eventId, userRole, connectionState }}>
        {children}
      </StreamContext.Provider>
    </LiveKitRoom>
  );
};
```

### 2. StreamerInterface (For Stage Page)

```tsx
// components/livekit/StreamerInterface.tsx
import { useLocalParticipant, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';

interface StreamerInterfaceProps {
  eventId: string;
  onStreamStart?: () => void;
  onStreamStop?: () => void;
}

export const StreamerInterface: React.FC<StreamerInterfaceProps> = ({
  eventId,
  onStreamStart,
  onStreamStop,
}) => {
  const { localParticipant } = useLocalParticipant();
  const [isStreaming, setIsStreaming] = useState(false);
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const toggleStreaming = async () => {
    if (isStreaming) {
      await localParticipant.setCameraEnabled(false);
      await localParticipant.setMicrophoneEnabled(false);
      setIsStreaming(false);
      onStreamStop?.();
    } else {
      await localParticipant.setCameraEnabled(true);
      await localParticipant.setMicrophoneEnabled(true);
      setIsStreaming(true);
      onStreamStart?.();
    }
  };

  return (
    <div className="streamer-interface">
      {/* Local video preview */}
      <div className="preview-section">
        <LocalVideoPreview enabled={previewEnabled} />
      </div>

      {/* Streaming controls */}
      <StreamingControls
        isStreaming={isStreaming}
        onToggleStreaming={toggleStreaming}
        localParticipant={localParticipant}
      />

      {/* Stream information */}
      <StreamInfo eventId={eventId} isLive={isStreaming} />
    </div>
  );
};
```

### 3. ViewerInterface (For Event Page)

```tsx
// components/livekit/ViewerInterface.tsx
import { useTracks, ParticipantLoop } from '@livekit/components-react';
import { Track } from 'livekit-client';

interface ViewerInterfaceProps {
  eventId: string;
  hasAccess: boolean;
  onUpgrade?: () => void;
}

export const ViewerInterface: React.FC<ViewerInterfaceProps> = ({
  eventId,
  hasAccess,
  onUpgrade,
}) => {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: true });
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!hasAccess) {
    return <StreamPaywall eventId={eventId} onUpgrade={onUpgrade} />;
  }

  return (
    <div className="viewer-interface">
      {/* Main video display */}
      <div className="main-video">
        {selectedTrack ? (
          <SingleTrackView trackId={selectedTrack} />
        ) : (
          <MultiCameraGrid tracks={tracks} onTrackSelect={setSelectedTrack} />
        )}
      </div>

      {/* Camera selector */}
      <CameraSelector
        tracks={tracks}
        selectedTrack={selectedTrack}
        onSelect={setSelectedTrack}
      />

      {/* Viewer controls */}
      <ViewerControls
        onFullscreen={() => setIsFullscreen(!isFullscreen)}
        onQualityChange={(quality) => {/* Handle quality change */}}
      />
    </div>
  );
};
```

### 4. StreamingControls

```tsx
// components/livekit/StreamingControls.tsx
import { LocalParticipant } from 'livekit-client';

interface StreamingControlsProps {
  isStreaming: boolean;
  onToggleStreaming: () => void;
  localParticipant: LocalParticipant;
}

export const StreamingControls: React.FC<StreamingControlsProps> = ({
  isStreaming,
  onToggleStreaming,
  localParticipant,
}) => {
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [screenShare, setScreenShare] = useState(false);

  const toggleCamera = async () => {
    const newState = !cameraEnabled;
    await localParticipant.setCameraEnabled(newState);
    setCameraEnabled(newState);
  };

  const toggleMicrophone = async () => {
    const newState = !micEnabled;
    await localParticipant.setMicrophoneEnabled(newState);
    setMicEnabled(newState);
  };

  const toggleScreenShare = async () => {
    const newState = !screenShare;
    await localParticipant.setScreenShareEnabled(newState);
    setScreenShare(newState);
  };

  return (
    <div className="streaming-controls">
      <div className="control-group">
        <Button
          variant={isStreaming ? "destructive" : "default"}
          size="lg"
          onClick={onToggleStreaming}
          className="go-live-btn"
        >
          {isStreaming ? (
            <>
              <Square className="h-4 w-4 mr-2" />
              Stop Streaming
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Go Live
            </>
          )}
        </Button>
      </div>

      <div className="control-group">
        <Button
          variant={cameraEnabled ? "default" : "outline"}
          onClick={toggleCamera}
          disabled={!isStreaming}
        >
          {cameraEnabled ? <Video /> : <VideoOff />}
        </Button>

        <Button
          variant={micEnabled ? "default" : "outline"}
          onClick={toggleMicrophone}
          disabled={!isStreaming}
        >
          {micEnabled ? <Mic /> : <MicOff />}
        </Button>

        <Button
          variant={screenShare ? "default" : "outline"}
          onClick={toggleScreenShare}
          disabled={!isStreaming}
        >
          <Monitor />
        </Button>
      </div>

      <StreamQualitySelector />
    </div>
  );
};
```

## 🎛️ Custom Hooks

### 1. useLiveKitToken Hook

```tsx
// hooks/useLiveKitToken.ts
export const useLiveKitToken = (eventId: string, userRole: string) => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateToken = async () => {
      try {
        setLoading(true);
        const { data } = await supabase.functions.invoke('create-livekit-token', {
          body: { eventId, userRole },
        });
        
        if (data.error) throw new Error(data.error);
        
        setToken(data.token);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Token generation failed');
      } finally {
        setLoading(false);
      }
    };

    generateToken();
  }, [eventId, userRole]);

  return { token, loading, error, refreshToken: () => generateToken() };
};
```

### 2. useStreamingControls Hook

```tsx
// hooks/useStreamingControls.ts
export const useStreamingControls = (localParticipant: LocalParticipant) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('');

  const startPublishing = async () => {
    try {
      await localParticipant.enableCameraAndMicrophone();
      setIsPublishing(true);
    } catch (error) {
      console.error('Failed to start publishing:', error);
    }
  };

  const stopPublishing = async () => {
    try {
      await localParticipant.setCameraEnabled(false);
      await localParticipant.setMicrophoneEnabled(false);
      setIsPublishing(false);
    } catch (error) {
      console.error('Failed to stop publishing:', error);
    }
  };

  const switchCamera = async (deviceId: string) => {
    try {
      await localParticipant.switchActiveDevice('videoinput', deviceId);
      setSelectedCamera(deviceId);
    } catch (error) {
      console.error('Failed to switch camera:', error);
    }
  };

  return {
    isPublishing,
    devices,
    selectedCamera,
    selectedMicrophone,
    startPublishing,
    stopPublishing,
    switchCamera,
  };
};
```

## 🛡️ Access Control Components

### PermissionGuard

```tsx
// components/access/PermissionGuard.tsx
interface PermissionGuardProps {
  eventId: string;
  requiredRole?: string;
  requiresTicket?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  eventId,
  requiredRole,
  requiresTicket = false,
  children,
  fallback,
}) => {
  const { hasAccess, loading, userRole } = useAccessControl(eventId, requiredRole, requiresTicket);

  if (loading) return <LoadingSpinner />;
  
  if (!hasAccess) {
    return fallback || <AccessDenied eventId={eventId} requiredRole={requiredRole} />;
  }

  return <>{children}</>;
};
```

## 📊 Real-time Components

### LiveViewerCount

```tsx
// components/real-time/LiveViewerCount.tsx
export const LiveViewerCount: React.FC<{ eventId: string }> = ({ eventId }) => {
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    const channel = supabase
      .channel('viewer-count')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`,
        },
        (payload) => {
          setViewerCount(payload.new.viewer_count || 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  return (
    <div className="live-viewer-count">
      <Users className="h-4 w-4" />
      <span>{viewerCount.toLocaleString()} watching</span>
    </div>
  );
};
```

## 🔄 State Management

### Stream Context

```tsx
// contexts/StreamContext.tsx
interface StreamContextType {
  eventId: string;
  userRole: 'host' | 'streamer' | 'viewer';
  connectionState: ConnectionState;
  isLive: boolean;
  participants: Participant[];
  error: string | null;
}

const StreamContext = createContext<StreamContextType | null>(null);

export const useStreamContext = () => {
  const context = useContext(StreamContext);
  if (!context) {
    throw new Error('useStreamContext must be used within StreamProvider');
  }
  return context;
};
```

This architecture provides a scalable, maintainable structure for the LiveKit integration while maintaining clear separation of concerns and reusable components.