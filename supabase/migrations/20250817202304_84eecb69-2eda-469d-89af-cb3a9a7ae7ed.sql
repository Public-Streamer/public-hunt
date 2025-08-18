-- Create event_likes table
CREATE TABLE public.event_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Prevent duplicate likes from same user
  UNIQUE(event_id, user_id)
);

-- Create event_comments table  
CREATE TABLE public.event_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.event_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_likes
CREATE POLICY "Anyone can view event likes" 
ON public.event_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own likes" 
ON public.event_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" 
ON public.event_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for event_comments
CREATE POLICY "Anyone can view event comments" 
ON public.event_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create comments" 
ON public.event_comments 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND user_profile_id IN (
  SELECT id FROM user_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update their own comments" 
ON public.event_comments 
FOR UPDATE 
USING (user_profile_id IN (
  SELECT id FROM user_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete their own comments" 
ON public.event_comments 
FOR DELETE 
USING (user_profile_id IN (
  SELECT id FROM user_profiles WHERE user_id = auth.uid()
));

-- Create trigger for updated_at
CREATE TRIGGER update_event_comments_updated_at
BEFORE UPDATE ON public.event_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_event_likes_event_id ON public.event_likes(event_id);
CREATE INDEX idx_event_likes_user_id ON public.event_likes(user_id);
CREATE INDEX idx_event_comments_event_id ON public.event_comments(event_id);
CREATE INDEX idx_event_comments_user_profile_id ON public.event_comments(user_profile_id);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_comments;