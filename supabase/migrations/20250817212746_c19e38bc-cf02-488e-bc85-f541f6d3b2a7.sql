-- Fix real-time synchronization for likes and comments
-- This ensures DELETE events contain full row data for proper filtering

ALTER TABLE public.event_likes REPLICA IDENTITY FULL;
ALTER TABLE public.event_comments REPLICA IDENTITY FULL;