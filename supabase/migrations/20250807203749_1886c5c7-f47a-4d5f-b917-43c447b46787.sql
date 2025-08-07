-- Create triggers to keep event live status and viewer counts consistent
-- 1) Trigger to update event viewer_count from event_streams changes
DROP TRIGGER IF EXISTS trigger_update_event_viewer_count ON public.event_streams;
CREATE TRIGGER trigger_update_event_viewer_count
  AFTER INSERT OR UPDATE OR DELETE ON public.event_streams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_viewer_count();

-- 2) Trigger to update events.is_live when participants change
DROP TRIGGER IF EXISTS trigger_update_event_live_status_participants ON public.event_participants;
CREATE TRIGGER trigger_update_event_live_status_participants
  AFTER INSERT OR UPDATE OR DELETE ON public.event_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_live_status_participants();

-- 3) Trigger to cleanup livekit room when an event transitions from live to not live
DROP TRIGGER IF EXISTS trigger_cleanup_livekit_room_on_event_end ON public.events;
CREATE TRIGGER trigger_cleanup_livekit_room_on_event_end
  AFTER UPDATE OF is_live ON public.events
  FOR EACH ROW
  WHEN (OLD.is_live = true AND NEW.is_live = false)
  EXECUTE FUNCTION public.cleanup_livekit_room_on_event_end();