-- Add RLS policy to allow public viewing of active ads with remaining budget
CREATE POLICY "Public can view active ads with budget" 
ON public.ads 
FOR SELECT 
USING (campaign_status = 'active' AND budget_remaining > 0);