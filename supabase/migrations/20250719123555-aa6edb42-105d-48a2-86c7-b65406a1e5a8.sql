-- Create ads table for storing commercial/advertisement data
CREATE TABLE public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  budget DECIMAL(10,2) NOT NULL,
  target_channels UUID[] DEFAULT '{}',
  media_urls TEXT[] DEFAULT '{}',
  ad_type TEXT DEFAULT 'video',
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'active', 'paused', 'completed')),
  stripe_account_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Create policies for ads table
CREATE POLICY "Users can view their own ads" 
ON public.ads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ads" 
ON public.ads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ads" 
ON public.ads 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ads" 
ON public.ads 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ads_updated_at
BEFORE UPDATE ON public.ads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();