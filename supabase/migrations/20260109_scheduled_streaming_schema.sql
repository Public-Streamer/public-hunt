-- Migration for Scheduled Streaming System

-- Add scheduled streaming fields to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS scheduled_start_time TIMESTAMP;
ALTER TABLE events ADD COLUMN IF NOT EXISTS scheduled_end_time TIMESTAMP;
ALTER TABLE events ADD COLUMN IF NOT EXISTS automatic_room_creation BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS time_zone TEXT DEFAULT 'UTC';
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT; -- 'none', 'daily', 'weekly', 'monthly'
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_end_date TIMESTAMP;
ALTER TABLE events ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT FALSE;

-- Create streaming_schedule table
CREATE TABLE streaming_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  scheduled_start_time TIMESTAMP NOT NULL,
  scheduled_end_time TIMESTAMP,
  time_zone TEXT DEFAULT 'UTC',
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  automatic_room_creation BOOLEAN DEFAULT FALSE,
  room_created BOOLEAN DEFAULT FALSE,
  room_creation_time TIMESTAMP,
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_time TIMESTAMP,
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_sent_time TIMESTAMP,
  recurrence_pattern TEXT DEFAULT 'none',
  recurrence_end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

-- Create scheduled_stream_notifications table
CREATE TABLE scheduled_stream_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES streaming_schedule(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('reminder', 'start', 'cancelled', 'rescheduled')),
  notification_method TEXT NOT NULL CHECK (notification_method IN ('email', 'push', 'in_app')),
  notification_status TEXT DEFAULT 'pending' CHECK (notification_status IN ('pending', 'sent', 'failed', 'read')),
  notification_content JSONB,
  scheduled_send_time TIMESTAMP,
  actual_send_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_streaming_preferences table
CREATE TABLE user_streaming_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "in_app": true}',
  time_zone TEXT DEFAULT 'UTC',
  default_stream_quality TEXT DEFAULT 'HD',
  default_recording_settings JSONB DEFAULT '{"auto_record": false, "quality": "HD"}',
  calendar_integration_enabled BOOLEAN DEFAULT FALSE,
  calendar_integration_token TEXT,
  calendar_integration_type TEXT,
  last_notification_check TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create stream_calendar_integration table
CREATE TABLE stream_calendar_integration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  calendar_type TEXT NOT NULL CHECK (calendar_type IN ('google', 'outlook', 'apple', 'ics')),
  calendar_event_id TEXT,
  calendar_event_url TEXT,
  integration_status TEXT DEFAULT 'pending' CHECK (integration_status IN ('pending', 'success', 'failed')),
  integration_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_streaming_schedule_event_id ON streaming_schedule(event_id);
CREATE INDEX idx_streaming_schedule_start_time ON streaming_schedule(scheduled_start_time);
CREATE INDEX idx_streaming_schedule_status ON streaming_schedule(status);
CREATE INDEX idx_scheduled_notifications_schedule_id ON scheduled_stream_notifications(schedule_id);
CREATE INDEX idx_scheduled_notifications_user_id ON scheduled_stream_notifications(user_id);
CREATE INDEX idx_scheduled_notifications_status ON scheduled_stream_notifications(notification_status);
CREATE INDEX idx_user_streaming_preferences_user_id ON user_streaming_preferences(user_id);
CREATE INDEX idx_stream_calendar_integration_event_id ON stream_calendar_integration(event_id);

-- Create RLS policies
ALTER TABLE streaming_schedule ENABLE ROW LEVEL SECURITY;

-- Event hosts can manage their streaming schedules
CREATE POLICY "Event hosts can manage their streaming schedules" ON streaming_schedule
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = streaming_schedule.event_id
      AND events.created_by = auth.uid()
    )
  );

-- Public can view scheduled streams for public events
CREATE POLICY "Public can view scheduled streams" ON streaming_schedule
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = streaming_schedule.event_id
      AND (events.is_live = true OR events.ticket_price <= 0)
    )
  );

ALTER TABLE scheduled_stream_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON scheduled_stream_notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Event hosts can manage notifications for their events
CREATE POLICY "Event hosts can manage notifications" ON scheduled_stream_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM streaming_schedule
      WHERE streaming_schedule.id = scheduled_stream_notifications.schedule_id
      AND EXISTS (
        SELECT 1 FROM events
        WHERE events.id = streaming_schedule.event_id
        AND events.created_by = auth.uid()
      )
    )
  );

ALTER TABLE user_streaming_preferences ENABLE ROW LEVEL SECURITY;

-- Users can manage their own preferences
CREATE POLICY "Users can manage their own preferences" ON user_streaming_preferences
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE stream_calendar_integration ENABLE ROW LEVEL SECURITY;

-- Event hosts can manage calendar integration for their events
CREATE POLICY "Event hosts can manage calendar integration" ON stream_calendar_integration
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = stream_calendar_integration.event_id
      AND events.created_by = auth.uid()
    )
  );

-- Public can view calendar integration for public events
CREATE POLICY "Public can view calendar integration" ON stream_calendar_integration
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = stream_calendar_integration.event_id
      AND (events.is_live = true OR events.ticket_price <= 0)
    )
  );