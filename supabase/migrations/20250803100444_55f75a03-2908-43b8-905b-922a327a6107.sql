-- Add custom fields support to event_scoreboard table
ALTER TABLE event_scoreboard 
ADD COLUMN custom_fields jsonb DEFAULT '{}'::jsonb;

-- Add column for team name editability
ALTER TABLE event_scoreboard 
ADD COLUMN is_editable boolean DEFAULT true;

-- Create index for better performance on custom fields queries
CREATE INDEX idx_event_scoreboard_custom_fields ON event_scoreboard USING GIN (custom_fields);

-- Update function to handle custom fields in scoreboard operations
-- This will be handled in the edge function update