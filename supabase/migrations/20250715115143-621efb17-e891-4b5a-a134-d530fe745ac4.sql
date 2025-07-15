-- Create function to update event live status based on active streams
CREATE OR REPLACE FUNCTION update_event_live_status()
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

-- Create trigger for INSERT/UPDATE/DELETE on event_streams
DROP TRIGGER IF EXISTS trigger_update_event_live_status ON event_streams;
CREATE TRIGGER trigger_update_event_live_status
  AFTER INSERT OR UPDATE OR DELETE ON event_streams
  FOR EACH ROW
  EXECUTE FUNCTION update_event_live_status();

-- Create function to update event live status based on active participants
CREATE OR REPLACE FUNCTION update_event_live_status_participants()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the event's is_live status based on active participants with streaming roles
  UPDATE events 
  SET is_live = (
    SELECT COUNT(*) > 0 
    FROM event_participants 
    WHERE event_id = COALESCE(NEW.event_id, OLD.event_id) 
    AND is_active = true
    AND role IN ('host', 'streamer')
  )
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT/UPDATE/DELETE on event_participants
DROP TRIGGER IF EXISTS trigger_update_event_live_status_participants ON event_participants;
CREATE TRIGGER trigger_update_event_live_status_participants
  AFTER INSERT OR UPDATE OR DELETE ON event_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_event_live_status_participants();

-- Enable realtime for events table
ALTER TABLE events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE events;