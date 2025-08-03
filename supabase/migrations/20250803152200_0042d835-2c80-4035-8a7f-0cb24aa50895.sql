-- Enable real-time for event_scoreboard table
ALTER TABLE event_scoreboard REPLICA IDENTITY FULL;

-- Add the table to the supabase_realtime publication to enable real-time functionality
ALTER PUBLICATION supabase_realtime ADD TABLE event_scoreboard;