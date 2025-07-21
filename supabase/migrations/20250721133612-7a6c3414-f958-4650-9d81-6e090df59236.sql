-- Drop all existing problematic policies for channel_permissions
DROP POLICY IF EXISTS "Channel owners can manage all permissions" ON channel_permissions;
DROP POLICY IF EXISTS "Channel masters can manage member permissions" ON channel_permissions;
DROP POLICY IF EXISTS "Allow system to create channel permissions" ON channel_permissions;
DROP POLICY IF EXISTS "Users can view channel permissions" ON channel_permissions;

-- Create simple, non-recursive policies for channel_permissions
CREATE POLICY "Channel owners full access" 
ON channel_permissions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM channels 
  WHERE channels.id = channel_permissions.channel_id 
  AND channels.user_id = auth.uid()
));

CREATE POLICY "Users can view their own permissions" 
ON channel_permissions 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can create permissions" 
ON channel_permissions 
FOR INSERT 
WITH CHECK (true);

-- Fix company_roles infinite recursion too
DROP POLICY IF EXISTS "Company masters can manage company roles" ON company_roles;
DROP POLICY IF EXISTS "Users can be assigned company roles" ON company_roles;

-- Create simple company_roles policies without recursion
CREATE POLICY "Users can view company roles they belong to" 
ON company_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Allow company role assignment" 
ON company_roles 
FOR INSERT 
WITH CHECK (true);