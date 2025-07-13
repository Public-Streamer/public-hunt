# Database Schema Design

## 📊 Schema Overview

This document outlines the database schema changes needed to support dynamic event streaming with LiveKit integration.

## 🔄 Events Table Enhancements

### Current Schema
```sql
-- Existing events table structure
events (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  date DATE,
  time TIME,
  location TEXT,
  category TEXT,
  ticket_price NUMERIC DEFAULT 0.00,
  channel_id UUID,
  media_urls TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### Required Additions
```sql
ALTER TABLE events ADD COLUMN livekit_room_name TEXT UNIQUE;
ALTER TABLE events ADD COLUMN is_live BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN stream_url TEXT;
ALTER TABLE events ADD COLUMN viewer_count INTEGER DEFAULT 0;
ALTER TABLE events ADD COLUMN created_by UUID; -- Reference to user who created event
ALTER TABLE events ADD COLUMN max_participants INTEGER DEFAULT 100;
ALTER TABLE events ADD COLUMN stream_quality TEXT DEFAULT 'HD'; -- HD, FHD, 4K
```

## 🎥 New Tables

### 1. event_streams
```sql
CREATE TABLE event_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  streamer_id UUID NOT NULL, -- User streaming
  stream_name TEXT NOT NULL, -- "Main Camera", "Player 1 Cam", etc.
  livekit_track_sid TEXT, -- LiveKit track identifier
  is_active BOOLEAN DEFAULT FALSE,
  viewer_count INTEGER DEFAULT 0,
  stream_type TEXT DEFAULT 'camera', -- camera, screen, audio
  quality_settings JSONB, -- Resolution, bitrate, etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_event_streams_event_id ON event_streams(event_id);
CREATE INDEX idx_event_streams_streamer_id ON event_streams(streamer_id);
CREATE INDEX idx_event_streams_active ON event_streams(is_active);
```

### 2. event_participants
```sql
CREATE TABLE event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('host', 'streamer', 'viewer', 'moderator')),
  permissions TEXT[] DEFAULT '{}', -- ['can_stream', 'can_chat', 'can_moderate']
  livekit_token TEXT, -- Encrypted token storage
  token_expires_at TIMESTAMP,
  joined_at TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Unique constraint: one role per user per event
CREATE UNIQUE INDEX idx_event_participants_unique ON event_participants(event_id, user_id);
CREATE INDEX idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX idx_event_participants_role ON event_participants(role);
```

### 3. livekit_rooms
```sql
CREATE TABLE livekit_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL UNIQUE,
  livekit_room_sid TEXT UNIQUE, -- LiveKit's room identifier
  is_active BOOLEAN DEFAULT FALSE,
  participant_count INTEGER DEFAULT 0,
  max_participants INTEGER DEFAULT 100,
  recording_enabled BOOLEAN DEFAULT FALSE,
  recording_url TEXT,
  room_settings JSONB, -- LiveKit room configuration
  created_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP
);

CREATE INDEX idx_livekit_rooms_event_id ON livekit_rooms(event_id);
CREATE INDEX idx_livekit_rooms_active ON livekit_rooms(is_active);
```

### 4. stream_analytics
```sql
CREATE TABLE stream_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id),
  stream_id UUID REFERENCES event_streams(id),
  metric_type TEXT NOT NULL, -- 'viewer_join', 'viewer_leave', 'quality_change'
  metric_value JSONB,
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Partitioning by date for performance
CREATE INDEX idx_stream_analytics_event_date ON stream_analytics(event_id, recorded_at);
```

## 🔐 Row Level Security (RLS) Policies

### event_streams Policies
```sql
-- Enable RLS
ALTER TABLE event_streams ENABLE ROW LEVEL SECURITY;

-- Streamers can manage their own streams
CREATE POLICY "Streamers can manage own streams" ON event_streams
  FOR ALL USING (auth.uid() = streamer_id);

-- Event hosts can manage all streams for their events
CREATE POLICY "Event hosts can manage event streams" ON event_streams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_streams.event_id 
      AND events.created_by = auth.uid()
    )
  );

-- Public can view active streams
CREATE POLICY "Public can view active streams" ON event_streams
  FOR SELECT USING (is_active = true);
```

### event_participants Policies
```sql
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- Users can view their own participation
CREATE POLICY "Users can view own participation" ON event_participants
  FOR SELECT USING (auth.uid() = user_id);

-- Event hosts can manage participants
CREATE POLICY "Event hosts can manage participants" ON event_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_participants.event_id 
      AND events.created_by = auth.uid()
    )
  );
```

## 🔄 Database Triggers

### Update viewer counts
```sql
-- Function to update event viewer count
CREATE OR REPLACE FUNCTION update_event_viewer_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE events 
  SET viewer_count = (
    SELECT COALESCE(SUM(viewer_count), 0) 
    FROM event_streams 
    WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
    AND is_active = true
  )
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger on stream updates
CREATE TRIGGER trigger_update_event_viewer_count
  AFTER INSERT OR UPDATE OR DELETE ON event_streams
  FOR EACH ROW
  EXECUTE FUNCTION update_event_viewer_count();
```

### Auto-generate LiveKit room names
```sql
-- Function to generate unique room names
CREATE OR REPLACE FUNCTION generate_livekit_room_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.livekit_room_name IS NULL THEN
    NEW.livekit_room_name := 'event-' || NEW.id::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger before insert
CREATE TRIGGER trigger_generate_room_name
  BEFORE INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION generate_livekit_room_name();
```

## 📈 Indexing Strategy

```sql
-- Performance indexes
CREATE INDEX CONCURRENTLY idx_events_live ON events(is_live) WHERE is_live = true;
CREATE INDEX CONCURRENTLY idx_events_created_by ON events(created_by);
CREATE INDEX CONCURRENTLY idx_events_date_time ON events(date, time);

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY idx_streams_event_active ON event_streams(event_id, is_active);
CREATE INDEX CONCURRENTLY idx_participants_event_role ON event_participants(event_id, role);
```

## 🔄 Migration Order

1. **First Migration**: Add new columns to existing events table
2. **Second Migration**: Create new tables (event_streams, event_participants, livekit_rooms)
3. **Third Migration**: Set up RLS policies
4. **Fourth Migration**: Create triggers and functions
5. **Fifth Migration**: Add performance indexes
6. **Sixth Migration**: Create analytics table and partitioning

This schema design supports the complete LiveKit integration while maintaining data integrity and performance.