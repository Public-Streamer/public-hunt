-- Drop the conflicting trigger that automatically sets is_live based on active streams
DROP TRIGGER IF EXISTS update_event_live_status_trigger ON event_streams;

-- Also drop the trigger from participants table if it exists
DROP TRIGGER IF EXISTS trigger_update_event_live_status_participants ON event_participants;

-- Reset all events to is_live = false to start fresh
UPDATE events SET is_live = false;