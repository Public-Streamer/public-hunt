-- Create table for episodes
CREATE TABLE public.episodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  source_event_id UUID REFERENCES public.past_events(id),
  channel_id UUID REFERENCES public.channels(id),
  creator_id UUID NOT NULL,
  target_length_minutes INTEGER NOT NULL DEFAULT 30,
  current_length_minutes INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'published', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE,
  video_url TEXT,
  thumbnail_url TEXT,
  view_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create table for episode clips
CREATE TABLE public.episode_clips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_id UUID NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  clip_title TEXT NOT NULL,
  start_time_seconds INTEGER NOT NULL,
  end_time_seconds INTEGER NOT NULL,
  clip_order INTEGER NOT NULL,
  clip_type TEXT DEFAULT 'manual' CHECK (clip_type IN ('manual', 'ai_highlight')),
  engagement_score DECIMAL(3,2), -- For AI-generated clips
  highlight_type TEXT, -- goal, reaction, intense, funny, emotional
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for AI highlight analysis results
CREATE TABLE public.ai_highlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_event_id UUID NOT NULL REFERENCES public.past_events(id),
  start_time_seconds INTEGER NOT NULL,
  end_time_seconds INTEGER NOT NULL,
  title TEXT NOT NULL,
  highlight_type TEXT NOT NULL CHECK (highlight_type IN ('goal', 'reaction', 'intense', 'funny', 'emotional', 'climax')),
  engagement_score DECIMAL(3,2) NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL,
  analysis_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_highlights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for episodes
CREATE POLICY "Users can create their own episodes"
  ON public.episodes
  FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can view published episodes or their own episodes"
  ON public.episodes
  FOR SELECT
  USING (status = 'published' OR auth.uid() = creator_id);

CREATE POLICY "Users can update their own episodes"
  ON public.episodes
  FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own episodes"
  ON public.episodes
  FOR DELETE
  USING (auth.uid() = creator_id);

-- RLS Policies for episode clips
CREATE POLICY "Users can manage clips in their episodes"
  ON public.episode_clips
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.episodes 
    WHERE episodes.id = episode_clips.episode_id 
    AND episodes.creator_id = auth.uid()
  ));

CREATE POLICY "Public can view clips of published episodes"
  ON public.episode_clips
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.episodes 
    WHERE episodes.id = episode_clips.episode_id 
    AND episodes.status = 'published'
  ));

-- RLS Policies for AI highlights
CREATE POLICY "Users can view AI highlights for their events"
  ON public.ai_highlights
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.past_events 
    WHERE past_events.id = ai_highlights.source_event_id 
    AND (past_events.event_master_id = auth.uid() OR past_events.channel_master_id = auth.uid())
  ));

CREATE POLICY "System can insert AI highlights"
  ON public.ai_highlights
  FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_episodes_creator_id ON public.episodes(creator_id);
CREATE INDEX idx_episodes_status ON public.episodes(status);
CREATE INDEX idx_episodes_source_event ON public.episodes(source_event_id);
CREATE INDEX idx_episode_clips_episode_id ON public.episode_clips(episode_id);
CREATE INDEX idx_episode_clips_order ON public.episode_clips(episode_id, clip_order);
CREATE INDEX idx_ai_highlights_event_id ON public.ai_highlights(source_event_id);
CREATE INDEX idx_ai_highlights_score ON public.ai_highlights(engagement_score DESC);

-- Create function to update episode length when clips change
CREATE OR REPLACE FUNCTION public.update_episode_length()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.episodes 
  SET 
    current_length_minutes = (
      SELECT COALESCE(SUM((end_time_seconds - start_time_seconds) / 60.0), 0)::INTEGER
      FROM public.episode_clips
      WHERE episode_id = COALESCE(NEW.episode_id, OLD.episode_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.episode_id, OLD.episode_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update episode length
CREATE TRIGGER update_episode_length_on_clip_change
  AFTER INSERT OR UPDATE OR DELETE ON public.episode_clips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_episode_length();

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_episodes_updated_at
  BEFORE UPDATE ON public.episodes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_episode_clips_updated_at
  BEFORE UPDATE ON public.episode_clips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();