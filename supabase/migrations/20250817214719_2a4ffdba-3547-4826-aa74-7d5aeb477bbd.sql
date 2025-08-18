-- Create trigger for the updated function
CREATE TRIGGER trigger_update_reply_count
AFTER INSERT OR DELETE ON public.event_comments
FOR EACH ROW EXECUTE FUNCTION update_comment_reply_count();