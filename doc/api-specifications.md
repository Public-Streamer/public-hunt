# API Specifications

## 🔗 Supabase Edge Functions API

This document details all Edge Functions required for the LiveKit integration, including request/response formats, authentication, and error handling.

## 🎯 Overview

All Edge Functions follow these conventions:
- **Authentication**: Bearer token in Authorization header
- **CORS**: Enabled for all origins with preflight support
- **Content-Type**: `application/json`
- **Error Format**: `{ error: string, details?: any }`

## 🔑 Authentication Flow

```typescript
// Standard auth pattern for all functions
const authHeader = req.headers.get('authorization');
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
  { global: { headers: { authorization: authHeader! } } }
);

const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  return new Response('Unauthorized', { status: 401 });
}
```

---

## 📊 Edge Functions

### 1. Create LiveKit Token

**Endpoint:** `/functions/v1/create-livekit-token`  
**Method:** `POST`  
**Description:** Generate LiveKit access tokens with role-based permissions

#### Request Body
```typescript
interface CreateTokenRequest {
  eventId: string;
  userRole?: 'host' | 'streamer' | 'viewer'; // Default: 'viewer'
  permissions?: {
    canPublish?: boolean;
    canSubscribe?: boolean;
    canPublishData?: boolean;
  };
}
```

#### Response
```typescript
interface CreateTokenResponse {
  token: string;
  roomName: string;
  serverUrl: string;
  expiresAt: string; // ISO timestamp
}
```

#### Example Usage
```typescript
const { data, error } = await supabase.functions.invoke('create-livekit-token', {
  body: {
    eventId: 'event-123',
    userRole: 'streamer'
  }
});
```

#### Implementation Details
```typescript
// Token permissions based on role
const getPermissions = (role: string, hasTicket: boolean) => {
  switch (role) {
    case 'host':
      return {
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
        hidden: false,
        recorder: false,
      };
    
    case 'streamer':
      return {
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
        hidden: false,
        recorder: false,
      };
    
    case 'viewer':
      return {
        roomJoin: hasTicket,
        canPublish: false,
        canSubscribe: hasTicket,
        canPublishData: false,
        hidden: false,
        recorder: false,
      };
    
    default:
      return { roomJoin: false };
  }
};
```

---

### 2. Manage LiveKit Room

**Endpoint:** `/functions/v1/manage-livekit-room`  
**Method:** `POST`  
**Description:** Create, configure, and manage LiveKit rooms

#### Request Body
```typescript
interface ManageRoomRequest {
  action: 'create' | 'close' | 'update' | 'get_info';
  eventId: string;
  roomConfig?: {
    maxParticipants?: number;
    emptyTimeout?: number; // seconds
    enableRecording?: boolean;
    nodeId?: string;
    metadata?: Record<string, any>;
  };
}
```

#### Response
```typescript
interface ManageRoomResponse {
  success: boolean;
  room?: {
    sid: string;
    name: string;
    maxParticipants: number;
    numParticipants: number;
    creationTime: string;
    turnPassword: string;
    enabledCodecs: string[];
    metadata: string;
  };
  error?: string;
}
```

#### Example Usage
```typescript
// Create room
const { data } = await supabase.functions.invoke('manage-livekit-room', {
  body: {
    action: 'create',
    eventId: 'event-123',
    roomConfig: {
      maxParticipants: 50,
      emptyTimeout: 300,
      enableRecording: true
    }
  }
});

// Close room
await supabase.functions.invoke('manage-livekit-room', {
  body: {
    action: 'close',
    eventId: 'event-123'
  }
});
```

---

### 3. LiveKit Webhook Handler

**Endpoint:** `/functions/v1/webhook/livekit`  
**Method:** `POST`  
**Description:** Handle LiveKit webhooks for participant and room events  
**Authentication:** Webhook signature verification (no user auth)

#### Webhook Events Handled
- `participant_joined`
- `participant_left`
- `track_published`
- `track_unpublished`
- `room_started`
- `room_finished`
- `recording_started`
- `recording_finished`

#### Implementation
```typescript
// Verify webhook signature
const signature = req.headers.get('livekit-signature');
const body = await req.text();

if (!verifyWebhookSignature(body, signature, LIVEKIT_WEBHOOK_SECRET)) {
  return new Response('Invalid signature', { status: 401 });
}

const event = JSON.parse(body);

switch (event.event) {
  case 'participant_joined':
    await handleParticipantJoined(event);
    break;
  case 'participant_left':
    await handleParticipantLeft(event);
    break;
  // ... other events
}
```

#### Database Updates
```typescript
const handleParticipantJoined = async (event: WebhookEvent) => {
  const { room, participant } = event;
  
  // Update viewer count
  await supabase
    .from('events')
    .update({ 
      viewer_count: participant.num_participants 
    })
    .eq('livekit_room_name', room.name);
    
  // Log analytics
  await supabase
    .from('stream_analytics')
    .insert({
      event_id: extractEventId(room.name),
      metric_type: 'participant_joined',
      metric_value: { participant_identity: participant.identity }
    });
};
```

---

### 4. Stream Analytics

**Endpoint:** `/functions/v1/stream-analytics`  
**Method:** `GET`  
**Description:** Retrieve stream analytics and metrics

#### Query Parameters
```typescript
interface AnalyticsQuery {
  eventId: string;
  timeRange?: '1h' | '24h' | '7d' | '30d'; // Default: '24h'
  metrics?: ('viewers' | 'duration' | 'quality' | 'engagement')[];
}
```

#### Response
```typescript
interface AnalyticsResponse {
  eventId: string;
  timeRange: string;
  metrics: {
    totalViewers: number;
    peakViewers: number;
    averageViewTime: number; // minutes
    totalStreamTime: number; // minutes
    qualityMetrics: {
      averageBitrate: number;
      connectionIssues: number;
      rebufferEvents: number;
    };
    engagement: {
      chatMessages: number;
      reactions: number;
      shares: number;
    };
  };
  timeline: Array<{
    timestamp: string;
    viewers: number;
    bitrate?: number;
    fps?: number;
  }>;
}
```

---

### 5. Update Event Stream Status

**Endpoint:** `/functions/v1/update-stream-status`  
**Method:** `POST`  
**Description:** Update event live status and stream metadata

#### Request Body
```typescript
interface UpdateStreamStatusRequest {
  eventId: string;
  isLive: boolean;
  streamMetadata?: {
    resolution: string;
    fps: number;
    bitrate: number;
    codec: string;
  };
  participantUpdate?: {
    userId: string;
    action: 'join' | 'leave';
    role: string;
  };
}
```

#### Response
```typescript
interface UpdateStreamStatusResponse {
  success: boolean;
  event: {
    id: string;
    isLive: boolean;
    viewerCount: number;
    lastUpdated: string;
  };
}
```

---

### 6. Verify Event Access

**Endpoint:** `/functions/v1/verify-event-access`  
**Method:** `POST`  
**Description:** Verify user access to event based on tickets and permissions

#### Request Body
```typescript
interface VerifyAccessRequest {
  eventId: string;
  accessType: 'view' | 'stream' | 'moderate';
}
```

#### Response
```typescript
interface VerifyAccessResponse {
  hasAccess: boolean;
  accessLevel: 'none' | 'basic' | 'premium' | 'host';
  permissions: string[];
  ticket?: {
    id: string;
    type: string;
    purchasedAt: string;
  };
  reason?: string; // If hasAccess is false
}
```

---

## 🔒 Security & Error Handling

### Authentication Middleware
```typescript
const requireAuth = async (req: Request) => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    throw new Error('Missing authorization header');
  }

  const supabase = createClient(/* ... */);
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Invalid or expired token');
  }
  
  return { user, supabase };
};
```

### Error Response Format
```typescript
interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
}

const handleError = (error: Error, context: string) => {
  console.error(`[${context}] Error:`, error);
  
  return new Response(
    JSON.stringify({
      error: error.message,
      code: error.name,
      timestamp: new Date().toISOString()
    }),
    { 
      status: error.name === 'AuthError' ? 401 : 500,
      headers: corsHeaders 
    }
  );
};
```

### Rate Limiting
```typescript
// Simple rate limiting implementation
const rateLimiter = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (userId: string, limit = 10, windowMs = 60000) => {
  const now = Date.now();
  const userLimit = rateLimiter.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimiter.set(userId, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= limit) {
    return false;
  }
  
  userLimit.count++;
  return true;
};
```

## 📝 Usage Examples

### Frontend Integration
```typescript
// Custom hook for LiveKit token management
export const useLiveKitToken = (eventId: string, userRole: string) => {
  const [tokenData, setTokenData] = useState<CreateTokenResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateToken = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('create-livekit-token', {
        body: { eventId, userRole }
      });
      
      if (error) throw new Error(error.message);
      setTokenData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [eventId, userRole]);

  useEffect(() => {
    generateToken();
  }, [generateToken]);

  return { tokenData, loading, error, refresh: generateToken };
};
```

### Room Management
```typescript
// Event creation with room setup
const createEventWithStream = async (eventData: EventFormData) => {
  // 1. Create event in database
  const { data: event } = await supabase
    .from('events')
    .insert(eventData)
    .select()
    .single();

  // 2. Create LiveKit room
  const { data: roomData } = await supabase.functions.invoke('manage-livekit-room', {
    body: {
      action: 'create',
      eventId: event.id,
      roomConfig: {
        maxParticipants: 100,
        enableRecording: true
      }
    }
  });

  // 3. Set up host permissions
  await supabase
    .from('event_participants')
    .insert({
      event_id: event.id,
      user_id: user.id,
      role: 'host',
      permissions: ['can_stream', 'can_moderate', 'can_manage']
    });

  return event;
};
```

This API specification provides complete documentation for implementing the LiveKit integration with proper security, error handling, and real-time capabilities.
