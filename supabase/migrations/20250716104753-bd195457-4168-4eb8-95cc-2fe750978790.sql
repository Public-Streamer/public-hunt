-- Fix is_live status for all events and recreate trigger
-- Step 1: Update all events' is_live status based on their active streams
UPDATE events 
SET is_live = (
  SELECT COUNT(*) > 0 
  FROM event_streams 
  WHERE event_id = events.id 
  AND is_active = true
);

-- Step 2: Drop existing trigger and recreate it
DROP TRIGGER IF EXISTS update_event_live_status_trigger ON event_streams;
DROP TRIGGER IF EXISTS trigger_update_event_live_status ON event_streams;

-- Step 3: Recreate the trigger function with better error handling
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

-- Step 4: Create the trigger on INSERT, UPDATE, and DELETE
CREATE TRIGGER update_event_live_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON event_streams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_live_status();

-- Step 5: Verify the fix worked by checking current live events
SELECT 
  e.id, 
  e.name, 
  e.is_live, 
  COUNT(es.id) as active_streams_count
FROM events e
LEFT JOIN event_streams es ON es.event_id = e.id AND es.is_active = true
GROUP BY e.id, e.name, e.is_live
HAVING COUNT(es.id) > 0 OR e.is_live = true
ORDER BY e.created_at DESC;