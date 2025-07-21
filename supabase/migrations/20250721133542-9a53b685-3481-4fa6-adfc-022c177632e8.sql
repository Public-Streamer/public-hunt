-- Fix infinite recursion in channel_permissions RLS policies
-- Drop the problematic policies first
DROP POLICY IF EXISTS "Existing channel masters and admins can manage member permissio" ON channel_permissions;
DROP POLICY IF EXISTS "System can create initial permissions" ON channel_permissions;

-- Create simpler, non-recursive policies
CREATE POLICY "Channel owners can manage all permissions" 
ON channel_permissions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM channels 
  WHERE channels.id = channel_permissions.channel_id 
  AND channels.user_id = auth.uid()
));

CREATE POLICY "Channel masters can manage member permissions" 
ON channel_permissions 
FOR ALL 
USING (
  (role = 'member'::channel_role AND EXISTS (
    SELECT 1 FROM channel_permissions cp 
    WHERE cp.channel_id = channel_permissions.channel_id 
    AND cp.user_id = auth.uid() 
    AND cp.role = 'channel_master'::channel_role
  ))
  OR 
  (auth.uid() = user_id)  -- Users can see their own permissions
);

-- Policy for system to create initial permissions during channel creation
CREATE POLICY "Allow system to create channel permissions" 
ON channel_permissions 
FOR INSERT 
WITH CHECK (true);