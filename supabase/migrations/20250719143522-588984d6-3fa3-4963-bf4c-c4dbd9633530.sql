-- Add cleanup trigger for when events go offline
CREATE OR REPLACE FUNCTION cleanup_livekit_room_on_event_end()
RETURNS TRIGGER AS $$
BEGIN
  -- When event becomes not live, mark room as inactive and close it
  IF OLD.is_live = true AND NEW.is_live = false THEN
    UPDATE livekit_rooms 
    SET is_active = false, closed_at = NOW()
    WHERE event_id = NEW.id AND is_active = true;
    
    -- Log the cleanup for debugging
    RAISE NOTICE 'Event % ended, marked LiveKit rooms as inactive', NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic room cleanup when event ends
DROP TRIGGER IF EXISTS trigger_cleanup_room_on_event_end ON events;
CREATE TRIGGER trigger_cleanup_room_on_event_end
  AFTER UPDATE OF is_live ON events
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_livekit_room_on_event_end();