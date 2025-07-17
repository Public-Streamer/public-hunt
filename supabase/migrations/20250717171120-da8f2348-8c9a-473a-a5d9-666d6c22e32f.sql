-- Restore the participant-based trigger function
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

-- Restore the trigger
CREATE TRIGGER update_event_live_status_on_participant_change
  AFTER INSERT OR UPDATE OF is_live OR DELETE ON event_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_event_live_status_participants();