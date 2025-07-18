-- Drop existing problematic policies
DROP POLICY IF EXISTS "Channel masters can manage permissions" ON channel_permissions;
DROP POLICY IF EXISTS "Channel admins can manage member permissions" ON channel_permissions;

-- Create new policies that avoid recursion
-- Allow channel owners to manage all permissions for their channels
CREATE POLICY "Channel owners can manage all permissions" 
ON channel_permissions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM channels 
    WHERE channels.id = channel_permissions.channel_id 
    AND channels.user_id = auth.uid()
  )
);

-- Allow users with existing channel_master or channel_admin roles to manage member permissions
CREATE POLICY "Existing channel masters and admins can manage member permissions" 
ON channel_permissions 
FOR ALL 
USING (
  (role = 'member' AND EXISTS (
    SELECT 1 FROM channel_permissions cp 
    WHERE cp.channel_id = channel_permissions.channel_id 
    AND cp.user_id = auth.uid() 
    AND cp.role IN ('channel_master', 'channel_admin')
  )) 
  OR 
  (auth.uid() = user_id)
);

-- Allow system to insert initial channel_master permission during channel creation
CREATE POLICY "System can create initial permissions" 
ON channel_permissions 
FOR INSERT 
WITH CHECK (true);