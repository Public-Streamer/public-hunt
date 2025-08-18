-- Fix RLS policy for comment replies - the existing policy is conflicting
-- First, drop the problematic policy we just created
DROP POLICY IF EXISTS "Users can create replies to comments" ON public.event_comments;

-- Update the existing policy to handle both comments and replies properly
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.event_comments;

-- Create a comprehensive policy for both comments and replies
CREATE POLICY "Users can create comments and replies" 
ON public.event_comments 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  user_profile_id IN (
    SELECT user_profiles.id
    FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
  )
);