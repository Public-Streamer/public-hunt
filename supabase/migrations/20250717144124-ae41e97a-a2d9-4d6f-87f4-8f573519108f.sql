-- Ensure all related triggers are properly removed
DROP TRIGGER IF EXISTS update_event_live_status_on_participant_change ON event_participants;
DROP TRIGGER IF EXISTS trigger_update_event_live_status_on_stream_change ON event_streams;
DROP TRIGGER IF EXISTS update_event_live_status_trigger ON event_streams;
DROP TRIGGER IF EXISTS trigger_update_event_live_status ON event_streams;

-- Clean up any remaining trigger functions
DROP FUNCTION IF EXISTS public.update_event_live_status_on_stream_change() CASCADE;
DROP FUNCTION IF EXISTS public.update_event_live_status() CASCADE;