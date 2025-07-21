-- Drop ALL existing policies for company_roles
DROP POLICY IF EXISTS "Users can view company roles they belong to" ON company_roles;
DROP POLICY IF EXISTS "Users can be assigned company roles" ON company_roles;
DROP POLICY IF EXISTS "Company masters can manage company roles" ON company_roles;

-- Create simple company_roles policies without recursion
CREATE POLICY "View own company roles" 
ON company_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can assign company roles" 
ON company_roles 
FOR INSERT 
WITH CHECK (true);