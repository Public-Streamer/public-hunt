-- Fix infinite recursion in channel_permissions policy
DROP POLICY IF EXISTS "Users can view their channel permissions" ON public.channel_permissions;

-- Create a simple policy without recursion
CREATE POLICY "Users can view their channel permissions" 
ON public.channel_permissions 
FOR SELECT 
USING (user_id = auth.uid());