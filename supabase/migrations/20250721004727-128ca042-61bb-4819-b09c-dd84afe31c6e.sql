-- Create admin_users table for role assignments (using existing admin_role type)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role admin_role NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Insert the owner admin email
INSERT INTO admin_users (email, role, is_active) 
VALUES ('grant@ClearHomeLoans.com', 'owner', true);

-- Create admin_user_assignments table to track when emails become users
CREATE TABLE admin_user_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role admin_role NOT NULL,
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_user_assignments ENABLE ROW LEVEL SECURITY;

-- Function to check if user has admin role
CREATE OR REPLACE FUNCTION public.get_user_admin_role(user_email TEXT)
RETURNS admin_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT au.role 
  FROM admin_users au 
  WHERE au.email = user_email AND au.is_active = true
  LIMIT 1;
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM admin_user_assignments aua 
    WHERE aua.user_id = user_id
  );
$$;

-- Function to activate admin role on user creation/login
CREATE OR REPLACE FUNCTION public.activate_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if this email has an admin role assigned
  INSERT INTO admin_user_assignments (user_id, email, role)
  SELECT NEW.id, au.email, au.role
  FROM admin_users au
  WHERE au.email = NEW.email 
    AND au.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM admin_user_assignments aua 
      WHERE aua.user_id = NEW.id
    );
  
  RETURN NEW;
END;
$$;

-- Trigger to activate admin roles
CREATE TRIGGER activate_admin_role_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.activate_admin_role();

-- RLS Policies for admin_users
CREATE POLICY "Admin users can view admin emails" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_user_assignments aua 
      WHERE aua.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can manage admin users" ON admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_user_assignments aua 
      WHERE aua.user_id = auth.uid() AND aua.role = 'owner'
    )
  );

-- RLS Policies for admin_user_assignments
CREATE POLICY "Users can view their own admin status" ON admin_user_assignments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert admin assignments" ON admin_user_assignments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Owner can manage assignments" ON admin_user_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_user_assignments aua 
      WHERE aua.user_id = auth.uid() AND aua.role = 'owner'
    )
  );