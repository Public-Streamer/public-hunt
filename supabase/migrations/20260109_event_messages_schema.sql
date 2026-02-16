-- Migration for Event Messages and Chat System

-- Create event_messages table
CREATE TABLE event_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'chat' CHECK (message_type IN ('chat', 'announcement', 'moderation', 'system')),
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'flagged', 'hidden', 'deleted')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB,
  parent_message_id UUID REFERENCES event_messages(id) ON DELETE SET NULL,
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'auto_approved')),
  moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMP,
  moderation_notes TEXT,
  is_highlighted BOOLEAN DEFAULT FALSE,
  highlight_color TEXT,
  reaction_counts JSONB DEFAULT '{}',
  edited BOOLEAN DEFAULT FALSE,
  edit_history JSONB
);

-- Create message_reactions table
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES event_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, user_id, reaction_type)
);

-- Create moderation_rules table
CREATE TABLE moderation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('keyword', 'regex', 'user', 'profanity')),
  rule_pattern TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('flag', 'hide', 'delete', 'ban_user')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create moderation_queue table
CREATE TABLE moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES event_messages(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'auto_approved')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Create banned_users table
CREATE TABLE banned_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ban_reason TEXT,
  ban_expiration TIMESTAMP,
  is_permanent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create chat_settings table
CREATE TABLE chat_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  chat_enabled BOOLEAN DEFAULT TRUE,
  moderation_enabled BOOLEAN DEFAULT FALSE,
  auto_moderation_threshold NUMERIC DEFAULT 0.7,
  profanity_filter_enabled BOOLEAN DEFAULT TRUE,
  message_delay_seconds INTEGER DEFAULT 0,
  max_message_length INTEGER DEFAULT 500,
  allow_anonymous_messages BOOLEAN DEFAULT FALSE,
  allow_images BOOLEAN DEFAULT FALSE,
  allow_links BOOLEAN DEFAULT TRUE,
  slow_mode_enabled BOOLEAN DEFAULT FALSE,
  slow_mode_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_event_messages_event_id ON event_messages(event_id);
CREATE INDEX idx_event_messages_user_id ON event_messages(user_id);
CREATE INDEX idx_event_messages_status ON event_messages(status);
CREATE INDEX idx_event_messages_created_at ON event_messages(created_at);
CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user_id ON message_reactions(user_id);
CREATE INDEX idx_moderation_rules_event_id ON moderation_rules(event_id);
CREATE INDEX idx_moderation_queue_event_id ON moderation_queue(event_id);
CREATE INDEX idx_moderation_queue_status ON moderation_queue(status);
CREATE INDEX idx_banned_users_event_id ON banned_users(event_id);
CREATE INDEX idx_banned_users_user_id ON banned_users(user_id);
CREATE INDEX idx_chat_settings_event_id ON chat_settings(event_id);

-- Create RLS policies
ALTER TABLE event_messages ENABLE ROW LEVEL SECURITY;

-- Event participants can view messages
CREATE POLICY "Event participants can view messages" ON event_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM event_participants
      WHERE event_participants.event_id = event_messages.event_id
      AND event_participants.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_messages.event_id
      AND (events.is_live = true OR events.ticket_price <= 0)
    )
  );

-- Event hosts and moderators can manage messages
CREATE POLICY "Event hosts and moderators can manage messages" ON event_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_messages.event_id
      AND events.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM event_participants
      WHERE event_participants.event_id = event_messages.event_id
      AND event_participants.user_id = auth.uid()
      AND 'moderator' = ANY(event_participants.permissions)
    )
  );

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own reactions
CREATE POLICY "Users can manage their own reactions" ON message_reactions
  FOR ALL USING (auth.uid() = user_id);

-- Event participants can view reactions
CREATE POLICY "Event participants can view reactions" ON message_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM event_messages
      WHERE event_messages.id = message_reactions.message_id
      AND (
        EXISTS (
          SELECT 1 FROM event_participants
          WHERE event_participants.event_id = event_messages.event_id
          AND event_participants.user_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM events
          WHERE events.id = event_messages.event_id
          AND (events.is_live = true OR events.ticket_price <= 0)
        )
      )
    )
  );

ALTER TABLE moderation_rules ENABLE ROW LEVEL SECURITY;

-- Event hosts can manage moderation rules
CREATE POLICY "Event hosts can manage moderation rules" ON moderation_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = moderation_rules.event_id
      AND events.created_by = auth.uid()
    )
  );

ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;

-- Event hosts and moderators can manage moderation queue
CREATE POLICY "Event hosts and moderators can manage moderation queue" ON moderation_queue
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = moderation_queue.event_id
      AND events.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM event_participants
      WHERE event_participants.event_id = moderation_queue.event_id
      AND event_participants.user_id = auth.uid()
      AND 'moderator' = ANY(event_participants.permissions)
    )
  );

ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;

-- Event hosts can manage banned users
CREATE POLICY "Event hosts can manage banned users" ON banned_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = banned_users.event_id
      AND events.created_by = auth.uid()
    )
  );

ALTER TABLE chat_settings ENABLE ROW LEVEL SECURITY;

-- Event hosts can manage chat settings
CREATE POLICY "Event hosts can manage chat settings" ON chat_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = chat_settings.event_id