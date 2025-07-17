-- Drop the problematic trigger function that causes race conditions
DROP FUNCTION IF EXISTS public.update_event_live_status_participants() CASCADE;

-- Remove any existing triggers that might reference this function
DROP TRIGGER IF EXISTS trigger_update_event_live_status_participants ON event_participants;