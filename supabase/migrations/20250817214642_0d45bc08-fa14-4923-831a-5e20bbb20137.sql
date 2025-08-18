-- Fix the reply count trigger and update existing reply counts
-- First update existing reply counts manually
UPDATE public.event_comments 
SET reply_count = (
  SELECT COUNT(*) 
  FROM public.event_comments replies 
  WHERE replies.parent_comment_id = event_comments.id
)
WHERE parent_comment_id IS NULL;

-- Fix the trigger to handle both insert and update properly
DROP TRIGGER IF EXISTS trigger_update_reply_count ON public.event_comments;

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
    SET reply_count = GREATEST(0, reply_count - 1),
        updated_at = NOW()
    WHERE id = OLD.parent_comment_id;
    RETURN OLD;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;