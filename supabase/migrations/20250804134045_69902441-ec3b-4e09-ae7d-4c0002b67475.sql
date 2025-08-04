-- Update RLS policies to allow streamers with invitation tokens to access scoreboard data
-- Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Streamers can view scoreboard for their events" ON event_scoreboard;
DROP POLICY IF EXISTS "Streamers can update scoreboard for their events" ON event_scoreboard;  
DROP POLICY IF EXISTS "Streamers can insert scoreboard for their events" ON event_scoreboard;
DROP POLICY IF EXISTS "Streamers can delete scoreboard for their events" ON event_scoreboard;

-- Create more permissive policies that allow authenticated users to view scoreboards
-- while still maintaining security for modifications

-- Allow authenticated users to view scoreboard data (including invitation token users)
CREATE POLICY "Authenticated users can view event scoreboards" 
ON event_scoreboard 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Only event hosts can modify scoreboard data
CREATE POLICY "Event hosts can modify scoreboard" 
ON event_scoreboard 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM events 
    WHERE events.id = event_scoreboard.event_id 
    AND events.created_by = auth.uid()
  )
);

-- Also ensure events table real-time updates work for authenticated users
CREATE POLICY IF NOT EXISTS "Authenticated users can view events" 
ON events 
FOR SELECT 
USING (auth.uid() IS NOT NULL);