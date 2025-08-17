-- Add support for threaded replies to event_comments
ALTER TABLE public.event_comments 
ADD COLUMN parent_comment_id uuid REFERENCES public.event_comments(id) ON DELETE CASCADE,
ADD COLUMN reply_count integer NOT NULL DEFAULT 0;

-- Create index for efficient parent-child lookups
CREATE INDEX idx_event_comments_parent_id ON public.event_comments(parent_comment_id);
CREATE INDEX idx_event_comments_event_parent ON public.event_comments(event_id, parent_comment_id);

-- Create function to update reply count when replies are added/deleted
CREATE OR REPLACE FUNCTION update_comment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' AND NEW.parent_comment_id IS NOT NULL THEN
    UPDATE public.event_comments 
    SET reply_count = reply_count + 1,
        updated_at = NOW()
    WHERE id = NEW.parent_comment_id;
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' AND OLD.parent_comment_id IS NOT NULL THEN
    UPDATE public.event_comments 
    SET reply_count = reply_count - 1,
        updated_at = NOW()
    WHERE id = OLD.parent_comment_id;
    RETURN OLD;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update reply counts
CREATE TRIGGER trigger_update_reply_count
AFTER INSERT OR DELETE ON public.event_comments
FOR EACH ROW EXECUTE FUNCTION update_comment_reply_count();

-- Update RLS policies to handle replies
CREATE POLICY "Users can create replies to comments" 
ON public.event_comments 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  user_profile_id IN (
    SELECT user_profiles.id
    FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
  ) AND
  (parent_comment_id IS NULL OR EXISTS (
    SELECT 1 FROM public.event_comments pc 
    WHERE pc.id = parent_comment_id AND pc.event_id = event_id
  ))
);

-- Set REPLICA IDENTITY FULL for real-time updates
ALTER TABLE public.event_comments REPLICA IDENTITY FULL;