-- Add is_live column to event_participants table
ALTER TABLE public.event_participants 
ADD COLUMN is_live boolean DEFAULT false;

-- Update the trigger function to use event_participants.is_live instead of event_streams.is_active
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

-- Drop the old trigger on event_streams
DROP TRIGGER IF EXISTS update_event_live_status_on_stream_change ON event_streams;

-- Create new trigger on event_participants
CREATE TRIGGER update_event_live_status_on_participant_change
  AFTER INSERT OR UPDATE OR DELETE ON event_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_event_live_status_participants();

-- Update RLS policies to allow system operations on event_participants
CREATE POLICY "System can update participants" ON event_participants
  FOR UPDATE
  USING (true)
  WITH CHECK (true);