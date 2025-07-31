-- Enable real-time for event_chat_messages table
ALTER TABLE event_chat_messages REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE event_chat_messages;