-- Create event_ad_sessions table to track when ads are played in events
CREATE TABLE public.event_ad_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  triggered_by UUID NOT NULL, -- host who triggered the ad
  session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_end TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  viewer_count INTEGER DEFAULT 0, -- number of viewers when ad was shown
  billing_amount NUMERIC(10,2) DEFAULT 0, -- amount charged for this session
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create host_earnings table to track revenue share for hosts
CREATE TABLE public.host_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_user_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ad_session_id UUID NOT NULL REFERENCES public.event_ad_sessions(id) ON DELETE CASCADE,
  earning_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  earning_percentage NUMERIC(5,2) NOT NULL DEFAULT 10.00, -- e.g., 10% revenue share
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'paid', 'cancelled')),
  payout_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.event_ad_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_earnings ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_ad_sessions
CREATE POLICY "Event hosts can view ad sessions for their events"
ON public.event_ad_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_ad_sessions.event_id 
    AND events.created_by = auth.uid()
  )
);

CREATE POLICY "Event hosts can create ad sessions for their events"
ON public.event_ad_sessions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_ad_sessions.event_id 
    AND events.created_by = auth.uid()
  )
  AND triggered_by = auth.uid()
);

CREATE POLICY "System can update ad sessions"
ON public.event_ad_sessions FOR UPDATE
USING (true);

CREATE POLICY "Ad owners can view sessions for their ads"
ON public.event_ad_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ads 
    WHERE ads.id = event_ad_sessions.ad_id 
    AND ads.user_id = auth.uid()
  )
);

-- RLS policies for host_earnings
CREATE POLICY "Hosts can view their own earnings"
ON public.host_earnings FOR SELECT
USING (host_user_id = auth.uid());

CREATE POLICY "System can create host earnings"
ON public.host_earnings FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update host earnings"
ON public.host_earnings FOR UPDATE
USING (true);

-- Add indexes for performance
CREATE INDEX idx_event_ad_sessions_event_id ON public.event_ad_sessions(event_id);
CREATE INDEX idx_event_ad_sessions_ad_id ON public.event_ad_sessions(ad_id);
CREATE INDEX idx_event_ad_sessions_triggered_by ON public.event_ad_sessions(triggered_by);
CREATE INDEX idx_host_earnings_host_user_id ON public.host_earnings(host_user_id);
CREATE INDEX idx_host_earnings_event_id ON public.host_earnings(event_id);

-- Create trigger to update updated_at column
CREATE TRIGGER update_event_ad_sessions_updated_at
  BEFORE UPDATE ON public.event_ad_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_host_earnings_updated_at
  BEFORE UPDATE ON public.host_earnings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update ads table with new columns for better tracking
ALTER TABLE public.ads 
ADD COLUMN IF NOT EXISTS daily_cap INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cpm_rate NUMERIC(10,2) DEFAULT 5.00,
ADD COLUMN IF NOT EXISTS skip_after_seconds INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS spend_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS budget_remaining NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS actual_impressions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS estimated_impressions INTEGER DEFAULT 0;

-- Set budget_remaining to budget for existing ads
UPDATE public.ads 
SET budget_remaining = budget 
WHERE budget_remaining = 0 AND budget > 0;