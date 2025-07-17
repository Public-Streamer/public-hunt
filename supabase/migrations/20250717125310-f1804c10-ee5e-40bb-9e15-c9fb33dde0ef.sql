-- Fix the current event status manually
UPDATE events 
SET is_live = (
  SELECT COUNT(*) > 0 
  FROM event_participants 
  WHERE event_id = 'ec2bbbfc-5bf0-49a1-8b2a-4d50064fe404' 
  AND is_live = true
  AND role IN ('host', 'streamer')
)
WHERE id = 'ec2bbbfc-5bf0-49a1-8b2a-4d50064fe404';

-- Drop and recreate the trigger to ensure it's working properly
DROP TRIGGER IF EXISTS update_event_live_status_on_participant_change ON event_participants;

-- Recreate the trigger function with better logic
CREATE OR REPLACE FUNCTION public.update_event_live_status_participants()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update the event's is_live status based on participants with is_live = true
  UPDATE events 
  SET is_live = (
    SELECT COUNT(*) > 0 
    FROM event_participants 
    WHERE event_id = COALESCE(NEW.event_id, OLD.event_id) 
    AND is_live = true
    AND role IN ('host', 'streamer')
  )
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create the trigger with proper timing
CREATE TRIGGER update_event_live_status_on_participant_change
  AFTER INSERT OR UPDATE OF is_live OR DELETE ON event_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_event_live_status_participants();