-- Check and fix RLS policies for event_scoreboard
-- First, let's check current policies
-- Then ensure streamers can view scoreboard data for events they participate in

-- Enable REPLICA IDENTITY FULL for real-time updates
ALTER TABLE event_scoreboard REPLICA IDENTITY FULL;

-- Add policy for streamers to view scoreboard data for events they participate in
CREATE POLICY "Streamers can view scoreboard for their events" 
ON event_scoreboard 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM event_participants ep 
    WHERE ep.event_id = event_scoreboard.event_id 
    AND ep.user_id = auth.uid() 
    AND ep.role IN ('streamer', 'host')
  )
);

-- Add policy for streamers to update scoreboard data if they have permissions
CREATE POLICY "Streamers can update scoreboard for their events" 
ON event_scoreboard 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM event_participants ep 
    WHERE ep.event_id = event_scoreboard.event_id 
    AND ep.user_id = auth.uid() 
    AND ep.role IN ('streamer', 'host')
    AND 'manage_scoreboard' = ANY(ep.permissions)
  )
);

-- Add policy for streamers to insert scoreboard data if they have permissions
CREATE POLICY "Streamers can insert scoreboard for their events" 
ON event_scoreboard 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM event_participants ep 
    WHERE ep.event_id = event_scoreboard.event_id 
    AND ep.user_id = auth.uid() 
    AND ep.role IN ('streamer', 'host')
    AND 'manage_scoreboard' = ANY(ep.permissions)
  )
);

-- Add policy for streamers to delete scoreboard data if they have permissions
CREATE POLICY "Streamers can delete scoreboard for their events" 
ON event_scoreboard 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 
    FROM event_participants ep 
    WHERE ep.event_id = event_scoreboard.event_id 
    AND ep.user_id = auth.uid() 
    AND ep.role IN ('streamer', 'host')
    AND 'manage_scoreboard' = ANY(ep.permissions)
  )
);

-- Also ensure events table has REPLICA IDENTITY FULL for metadata updates
ALTER TABLE events REPLICA IDENTITY FULL;