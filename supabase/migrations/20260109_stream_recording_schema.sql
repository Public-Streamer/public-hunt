-- Migration for Stream Recording System

-- Add recording settings to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS recording_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS auto_record BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS recording_quality TEXT DEFAULT 'HD';
ALTER TABLE events ADD COLUMN IF NOT EXISTS recording_storage_limit INTEGER DEFAULT 1024; -- in MB

-- Create recordings table
CREATE TABLE recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  stream_id UUID REFERENCES event_streams(id) ON DELETE SET NULL,
  recording_name TEXT NOT NULL,
  recording_url TEXT NOT NULL,
  recording_key TEXT,
  file_size INTEGER, -- in bytes
  file_type TEXT,
  duration INTEGER, -- in seconds
  quality TEXT,
  resolution TEXT,
  status TEXT DEFAULT 'processing',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  starts_at TIMESTAMP,
  ends_at TIMESTAMP,
  is_public BOOLEAN DEFAULT FALSE,
  viewer_count INTEGER DEFAULT 0,
  metadata JSONB
);

-- Create recording_access table
CREATE TABLE recording_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_level TEXT DEFAULT 'view' CHECK (access_level IN ('view', 'edit', 'delete')),
  granted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Create recording_playback_stats table
CREATE TABLE recording_playback_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  playback_start TIMESTAMP DEFAULT NOW(),
  playback_end TIMESTAMP,
  duration_watched INTEGER, -- in seconds
  percentage_watched NUMERIC,
  device_info TEXT,
  location TEXT,
  ip_address TEXT
);

-- Create recording_comments table
CREATE TABLE recording_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  timestamp INTEGER NOT NULL, -- in seconds from start
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  likes INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  metadata JSONB
);

-- Create recording_reactions table
CREATE TABLE recording_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  timestamp INTEGER NOT NULL, -- in seconds from start
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_recordings_event_id ON recordings(event_id);
CREATE INDEX idx_recordings_stream_id ON recordings(stream_id);
CREATE INDEX idx_recordings_status ON recordings(status);
CREATE INDEX idx_recordings_created_at ON recordings(created_at);
CREATE INDEX idx_recording_access_recording_id ON recording_access(recording_id);
CREATE INDEX idx_recording_access_user_id ON recording_access(user_id);
CREATE INDEX idx_recording_playback_stats_recording_id ON recording_playback_stats(recording_id);
CREATE INDEX idx_recording_comments_recording_id ON recording_comments(recording_id);
CREATE INDEX idx_recording_reactions_recording_id ON recording_reactions(recording_id);

-- Create RLS policies
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

-- Event hosts can manage their recordings
CREATE POLICY "Event hosts can manage their recordings" ON recordings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = recordings.event_id
      AND events.created_by = auth.uid()
    )
  );

-- Users with access can view recordings
CREATE POLICY "Users with access can view recordings" ON recordings
  FOR SELECT USING (
    is_public = true OR
    EXISTS (
      SELECT 1 FROM recording_access
      WHERE recording_access.recording_id = recordings.id
      AND recording_access.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = recordings.event_id
      AND events.created_by = auth.uid()
    )
  );

ALTER TABLE recording_access ENABLE ROW LEVEL SECURITY;

-- Users can manage their own access
CREATE POLICY "Users can manage their own access" ON recording_access
  FOR ALL USING (auth.uid() = user_id);

-- Event hosts can manage all access for their recordings
CREATE POLICY "Event hosts can manage recording access" ON recording_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recordings
      WHERE recordings.id = recording_access.recording_id
      AND EXISTS (
        SELECT 1 FROM events
        WHERE events.id = recordings.event_id
        AND events.created_by = auth.uid()
      )
    )
  );

ALTER TABLE recording_playback_stats ENABLE ROW LEVEL SECURITY;

-- Users can view their own playback stats
CREATE POLICY "Users can view their own playback stats" ON recording_playback_stats
  FOR SELECT USING (auth.uid() = user_id);

-- Event hosts can view all playback stats for their recordings
CREATE POLICY "Event hosts can view playback stats" ON recording_playback_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recordings
      WHERE recordings.id = recording_playback_stats.recording_id
      AND EXISTS (
        SELECT 1 FROM events
        WHERE events.id = recordings.event_id
        AND events.created_by = auth.uid()
      )
    )
  );

ALTER TABLE recording_comments ENABLE ROW LEVEL SECURITY;

-- Users can manage their own comments
CREATE POLICY "Users can manage their own comments" ON recording_comments
  FOR ALL USING (auth.uid() = user_id);

-- Public can view comments on public recordings
CREATE POLICY "Public can view comments on public recordings" ON recording_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recordings
      WHERE recordings.id = recording_comments.recording_id
      AND recordings.is_public = true
    ) OR
    EXISTS (
      SELECT 1 FROM recording_access
      WHERE recording_access.recording_id = recording_comments.recording_id
      AND recording_access.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM recordings
      WHERE recordings.id = recording_comments.recording_id
      AND EXISTS (
        SELECT 1 FROM events
        WHERE events.id = recordings.event_id
        AND events.created_by = auth.uid()
      )
    )
  );

ALTER TABLE recording_reactions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own reactions
CREATE POLICY "Users can manage their own reactions" ON recording_reactions
  FOR ALL USING (auth.uid() = user_id);

-- Public can view reactions on public recordings
CREATE POLICY "Public can view reactions on public recordings" ON recording_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recordings
      WHERE recordings.id = recording_reactions.recording_id
      AND recordings.is_public = true
    ) OR
    EXISTS (
      SELECT 1 FROM recording_access
      WHERE recording_access.recording_id = recording_reactions.recording_id
      AND recording_access.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM recordings
      WHERE recordings.id = recording_reactions.recording_id
      AND EXISTS (
        SELECT 1 FROM events
        WHERE events.id = recordings.event_id
        AND events.created_by = auth.uid()
      )
    )
  );