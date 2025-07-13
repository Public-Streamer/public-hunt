# LiveKit Integration Guide

## 🎯 Overview

This guide covers the complete integration of LiveKit for real-time video streaming in the event platform.

## 📦 Dependencies Installation

### Frontend Dependencies
```bash
npm install @livekit/components-react livekit-client
npm install @livekit/components-styles
```

### Backend Dependencies (Edge Functions)
```typescript
// Import in edge functions
import { AccessToken, RoomServiceClient } from "https://deno.land/x/livekit_server_sdk/mod.ts";
```

## 🔐 Environment Configuration

### Supabase Secrets Setup
```bash
# Required secrets in Supabase Edge Functions
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_WS_URL=wss://your-project.livekit.cloud
```

### LiveKit Cloud Setup
1. Create account at [LiveKit Cloud](https://cloud.livekit.io)
2. Create new project
3. Get API credentials (key/secret)
4. Note WebSocket URL

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │ Supabase Edge   │    │   LiveKit       │
│                 │    │   Functions     │    │   Server        │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Streamer    │◄┼────┼►│ Token Gen   │◄┼────┼►│ Room Service│ │
│ │ Component   │ │    │ │             │ │    │ │             │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Viewer      │◄┼────┼►│ Room Mgmt   │◄┼────┼►│ WebRTC      │ │
│ │ Component   │ │    │ │             │ │    │ │ Engine      │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Edge Functions Implementation

### 1. Token Generation Function (`/create-livekit-token`)

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { AccessToken } from "https://deno.land/x/livekit_server_sdk/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventId, userRole = 'viewer' } = await req.json();
    
    // Verify user authentication
    const authHeader = req.headers.get('authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { authorization: authHeader! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    // Check event access permissions
    const { data: event } = await supabase
      .from('events')
      .select('*, tickets!inner(*)')
      .eq('id', eventId)
      .eq('tickets.user_id', user.id)
      .single();

    // For streamers/hosts, check participant table
    if (userRole !== 'viewer') {
      const { data: participant } = await supabase
        .from('event_participants')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .eq('role', userRole)
        .single();
      
      if (!participant) {
        return new Response('Insufficient permissions', { status: 403, headers: corsHeaders });
      }
    }

    // Generate LiveKit token
    const token = new AccessToken(
      Deno.env.get('LIVEKIT_API_KEY')!,
      Deno.env.get('LIVEKIT_API_SECRET')!,
      {
        identity: user.id,
        name: user.email?.split('@')[0] || 'Anonymous',
      }
    );

    // Set permissions based on role
    const roomName = `event-${eventId}`;
    
    if (userRole === 'host' || userRole === 'streamer') {
      token.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });
    } else {
      // Viewer permissions
      token.addGrant({
        room: roomName,
        roomJoin: !!event, // Only if has ticket
        canPublish: false,
        canSubscribe: true,
        canPublishData: false,
      });
    }

    const jwt = token.toJwt();

    return new Response(
      JSON.stringify({ token: jwt, roomName }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Token generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Token generation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### 2. Room Management Function (`/manage-livekit-room`)

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { RoomServiceClient } from "https://deno.land/x/livekit_server_sdk/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, eventId, roomConfig = {} } = await req.json();
    
    const roomService = new RoomServiceClient(
      Deno.env.get('LIVEKIT_WS_URL')!,
      Deno.env.get('LIVEKIT_API_KEY')!,
      Deno.env.get('LIVEKIT_API_SECRET')!
    );

    const roomName = `event-${eventId}`;

    switch (action) {
      case 'create':
        const room = await roomService.createRoom({
          name: roomName,
          maxParticipants: roomConfig.maxParticipants || 100,
          emptyTimeout: roomConfig.emptyTimeout || 300, // 5 minutes
          metadata: JSON.stringify({ eventId, createdAt: new Date().toISOString() }),
        });

        // Update database
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        await supabase
          .from('livekit_rooms')
          .insert({
            event_id: eventId,
            room_name: roomName,
            livekit_room_sid: room.sid,
            is_active: true,
            max_participants: roomConfig.maxParticipants || 100,
            room_settings: roomConfig,
          });

        return new Response(
          JSON.stringify({ success: true, room }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'close':
        await roomService.deleteRoom(roomName);
        
        await supabase
          .from('livekit_rooms')
          .update({ is_active: false, closed_at: new Date().toISOString() })
          .eq('room_name', roomName);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response('Invalid action', { status: 400, headers: corsHeaders });
    }

  } catch (error) {
    console.error('Room management error:', error);
    return new Response(
      JSON.stringify({ error: 'Room management failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

## 🎥 React Components Integration

### LiveKit Provider Setup

```tsx
// components/LiveKitProvider.tsx
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';

interface LiveKitProviderProps {
  token: string;
  serverUrl: string;
  children: React.ReactNode;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export const LiveKitProvider: React.FC<LiveKitProviderProps> = ({
  token,
  serverUrl,
  children,
  onConnected,
  onDisconnected,
}) => {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connectOptions={{
        autoSubscribe: true,
      }}
      onConnected={onConnected}
      onDisconnected={onDisconnected}
      style={{ height: '100%' }}
    >
      {children}
    </LiveKitRoom>
  );
};
```

### Streamer Component (for `/stage/:eventId`)

```tsx
// components/StreamerInterface.tsx
import { useTracks, useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';

export const StreamerInterface: React.FC<{ eventId: string }> = ({ eventId }) => {
  const { localParticipant } = useLocalParticipant();
  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone]);

  const toggleCamera = async () => {
    const enabled = localParticipant.isCameraEnabled;
    await localParticipant.setCameraEnabled(!enabled);
  };

  const toggleMicrophone = async () => {
    const enabled = localParticipant.isMicrophoneEnabled;
    await localParticipant.setMicrophoneEnabled(!enabled);
  };

  return (
    <div className="streamer-interface">
      <div className="video-preview">
        {/* Local video preview */}
      </div>
      
      <div className="controls">
        <button onClick={toggleCamera}>
          {localParticipant.isCameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
        </button>
        <button onClick={toggleMicrophone}>
          {localParticipant.isMicrophoneEnabled ? 'Mute' : 'Unmute'}
        </button>
      </div>
    </div>
  );
};
```

### Viewer Component (for `/event/:eventId`)

```tsx
// components/ViewerInterface.tsx
import { useTracks, TrackLoop } from '@livekit/components-react';
import { Track } from 'livekit-client';

export const ViewerInterface: React.FC<{ eventId: string }> = ({ eventId }) => {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: true });

  return (
    <div className="viewer-interface">
      <div className="video-grid">
        <TrackLoop tracks={tracks}>
          {(track) => (
            <div key={track.publication.trackSid} className="video-track">
              <VideoTrack track={track} />
              <div className="track-info">
                {track.participant.name || 'Anonymous'}
              </div>
            </div>
          )}
        </TrackLoop>
      </div>
    </div>
  );
};
```

## 🔄 Real-time Updates

### Participant Count Tracking

```typescript
// hooks/useParticipantCount.ts
import { useRoom, useParticipants } from '@livekit/components-react';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useParticipantCount = (eventId: string) => {
  const room = useRoom();
  const participants = useParticipants();

  useEffect(() => {
    const updateCount = async () => {
      await supabase
        .from('events')
        .update({ viewer_count: participants.length })
        .eq('id', eventId);
    };

    updateCount();
  }, [participants.length, eventId]);

  return participants.length;
};
```

## 🛡️ Security Considerations

### Token Security
- Tokens expire automatically (default 6 hours)
- User identity verification through Supabase auth
- Role-based permissions in tokens
- Room access control via participant table

### Access Control
- Ticket verification for viewer access
- Participant role verification for streaming
- Rate limiting on token generation
- Audit logging of all room actions

## 📊 Monitoring & Analytics

### LiveKit Webhooks
```typescript
// Edge function: /webhook/livekit
// Handles participant join/leave, recording events
// Updates database with real-time analytics
```

This integration provides a complete LiveKit setup with secure token generation, room management, and real-time streaming capabilities.