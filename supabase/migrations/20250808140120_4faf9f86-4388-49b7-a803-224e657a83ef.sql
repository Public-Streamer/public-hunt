
-- Revert auto-updating triggers that were causing stop live issues

-- 1) Viewer count trigger on event_streams
DROP TRIGGER IF EXISTS trigger_update_event_viewer_count ON public.event_streams;

-- 2) Event live status from participants trigger
DROP TRIGGER IF EXISTS trigger_update_event_live_status_participants ON public.event_participants;

-- 3) LiveKit room cleanup on event end trigger
DROP TRIGGER IF EXISTS trigger_cleanup_livekit_room_on_event_end ON public.events;
