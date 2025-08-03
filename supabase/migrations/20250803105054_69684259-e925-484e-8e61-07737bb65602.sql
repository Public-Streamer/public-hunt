-- Add pinned_message column to event_scoreboard table or create a separate table for event metadata
-- Let's add a pinned_message column to the events table since it's event-specific

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS pinned_message TEXT;