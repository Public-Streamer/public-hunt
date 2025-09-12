-- Phase 1: Database Schema Fixes for Viewer Count System

-- Connect the existing update_event_viewer_count() trigger to event_streams table changes
CREATE OR REPLACE TRIGGER trigger_update_event_viewer_count
  AFTER INSERT OR UPDATE OR DELETE ON event_streams
  FOR EACH ROW EXECUTE FUNCTION update_event_viewer_count();

-- Add indexes for efficient viewer count queries
CREATE INDEX IF NOT EXISTS idx_event_streams_viewer_count 
  ON event_streams(event_id, is_active, viewer_count);

CREATE INDEX IF NOT EXISTS idx_events_viewer_count 
  ON events(viewer_count);

-- Create a function to get accurate viewer count for an event
CREATE OR REPLACE FUNCTION get_event_viewer_count(event_id_param uuid)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(SUM(viewer_count), 0)::integer
  FROM event_streams 
  WHERE event_id = event_id_param 
    AND is_active = true;
$$;

-- Create a function to update viewer count with proper participant filtering
CREATE OR REPLACE FUNCTION update_event_viewer_count_filtered(
  event_id_param uuid,
  participant_count integer,
  streamer_count integer DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  actual_viewer_count integer;
BEGIN
  -- Calculate actual viewers (total participants minus streamers/hosts)
  actual_viewer_count := GREATEST(0, participant_count - streamer_count);
  
  -- Update the events table
  UPDATE events 
  SET viewer_count = actual_viewer_count,
      updated_at = NOW()
  WHERE id = event_id_param;
END;
$$;