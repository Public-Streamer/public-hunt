-- Add scoreboard_type column to event_scoreboard table to distinguish different types
ALTER TABLE public.event_scoreboard 
ADD COLUMN scoreboard_type text DEFAULT 'coon_hunt';

-- Add index for better performance when filtering by scoreboard type
CREATE INDEX idx_event_scoreboard_type ON public.event_scoreboard (event_id, scoreboard_type);

-- Add scoreboard_type to events metadata to track which type is selected
-- This will be handled in the application code using the existing metadata jsonb column