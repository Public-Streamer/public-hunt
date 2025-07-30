-- Create event_chat_messages table for persistent chat storage
CREATE TABLE event_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  profile_picture_url TEXT,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'user' CHECK (message_type IN ('user', 'system')),
  sequence_number BIGINT DEFAULT extract(epoch from now()) * 1000000 + extract(microseconds from now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_event_chat_messages_event_id ON event_chat_messages(event_id);
CREATE INDEX idx_event_chat_messages_created_at ON event_chat_messages(event_id, created_at);
CREATE INDEX idx_event_chat_messages_sequence ON event_chat_messages(event_id, sequence_number);

-- Enable RLS
ALTER TABLE event_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view all messages for events they can access
CREATE POLICY "Users can view event chat messages" ON event_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_chat_messages.event_id
    )
  );

-- Authenticated users can insert their own messages
CREATE POLICY "Authenticated users can insert chat messages" ON event_chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    (user_id = auth.uid() OR user_id IS NULL)
  );

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE event_chat_messages;