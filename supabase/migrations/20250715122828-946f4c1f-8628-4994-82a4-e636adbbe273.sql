-- Fix the database trigger for event_streams to update is_live status
-- First, check if the trigger exists and drop it if it does
DROP TRIGGER IF EXISTS update_event_live_status_trigger ON event_streams;

-- Create the corrected trigger function
CREATE OR REPLACE FUNCTION public.update_event_live_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the event's is_live status based on active streams
  UPDATE events 
  SET is_live = (
    SELECT COUNT(*) > 0 
    FROM event_streams 
    WHERE event_id = COALESCE(NEW.event_id, OLD.event_id) 
    AND is_active = true
  )
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on INSERT, UPDATE, and DELETE
CREATE TRIGGER update_event_live_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON event_streams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_live_status();

-- Manually trigger the update for the current event with active streams
UPDATE events 
SET is_live = (
  SELECT COUNT(*) > 0 
  FROM event_streams 
  WHERE event_id = events.id 
  AND is_active = true
)
WHERE id = 'ed37c5e4-409d-4f1d-b4a5-7ed1e39f661c';

-- Verify the update worked
SELECT id, name, is_live, 
       (SELECT COUNT(*) FROM event_streams WHERE event_id = events.id AND is_active = true) as active_streams_count
FROM events 
WHERE id = 'ed37c5e4-409d-4f1d-b4a5-7ed1e39f661c';