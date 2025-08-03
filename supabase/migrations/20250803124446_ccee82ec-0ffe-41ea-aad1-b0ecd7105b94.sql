-- Add metadata column to events table to store selected game type and other event configurations
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;