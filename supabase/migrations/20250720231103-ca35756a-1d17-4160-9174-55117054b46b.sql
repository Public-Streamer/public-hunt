-- Create ad_feedback table to store viewer ratings and feedback
CREATE TABLE public.ad_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id TEXT NOT NULL,
  viewer_session_id TEXT NOT NULL,
  star_rating INTEGER NOT NULL CHECK (star_rating >= 1 AND star_rating <= 5),
  selected_tags TEXT[] DEFAULT '{}',
  feedback_text TEXT,
  is_moderated BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  viewer_ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one feedback per ad per session
  UNIQUE(ad_id, viewer_session_id)
);

-- Enable Row Level Security
ALTER TABLE public.ad_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for ad feedback
CREATE POLICY "Anyone can submit feedback" 
ON public.ad_feedback 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public can view non-flagged feedback" 
ON public.ad_feedback 
FOR SELECT 
USING (NOT is_flagged);

CREATE POLICY "System can update feedback moderation" 
ON public.ad_feedback 
FOR UPDATE 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_ad_feedback_ad_id ON public.ad_feedback(ad_id);
CREATE INDEX idx_ad_feedback_created_at ON public.ad_feedback(created_at);
CREATE INDEX idx_ad_feedback_star_rating ON public.ad_feedback(star_rating);

-- Create function to update timestamps
CREATE TRIGGER update_ad_feedback_updated_at
  BEFORE UPDATE ON public.ad_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();