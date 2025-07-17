-- Remove conflicting triggers and functions that cause is_live status conflicts

-- Drop the conflicting trigger from event_streams table
DROP TRIGGER IF EXISTS trigger_update_event_live_status_on_stream_change ON event_streams;

-- Drop redundant functions that conflict with participant-based logic
DROP FUNCTION IF EXISTS public.update_event_live_status();
DROP FUNCTION IF EXISTS public.update_event_live_status_on_stream_change();

-- Also drop the old trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_event_live_status ON event_streams;

-- Update the current event's live status based on participants only
UPDATE events 
SET is_live = (
  SELECT COUNT(*) > 0 
  FROM event_participants 
  WHERE event_id = 'ec2bbbfc-5bf0-49a1-8b2a-4d50064fe404' 
  AND is_live = true
  AND role IN ('host', 'streamer')
)
WHERE id = 'ec2bbbfc-5bf0-49a1-8b2a-4d50064fe404';