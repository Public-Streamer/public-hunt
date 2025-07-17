-- Create trigger to automatically update events.is_live based on event_streams
CREATE OR REPLACE FUNCTION public.update_event_live_status_on_stream_change()
RETURNS trigger AS $$
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

-- Create trigger on event_streams table
CREATE TRIGGER trigger_update_event_live_status_on_stream_change
    AFTER INSERT OR UPDATE OR DELETE ON event_streams
    FOR EACH ROW
    EXECUTE FUNCTION public.update_event_live_status_on_stream_change();

-- Fix RLS policy for event_participants to allow system operations
DROP POLICY IF EXISTS "Event hosts can manage participants" ON event_participants;
DROP POLICY IF EXISTS "Users can view own participation" ON event_participants;

CREATE POLICY "Event hosts can manage participants" ON event_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_participants.event_id 
            AND events.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can view own participation" ON event_participants
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert participants" ON event_participants
    FOR INSERT WITH CHECK (true);

-- Update events table to allow updates for live status
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
DROP POLICY IF EXISTS "Public can view events" ON events;

CREATE POLICY "Authenticated users can create events" ON events
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Public can view events" ON events
    FOR SELECT USING (true);

CREATE POLICY "Event hosts can update events" ON events
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "System can update event status" ON events
    FOR UPDATE USING (true);