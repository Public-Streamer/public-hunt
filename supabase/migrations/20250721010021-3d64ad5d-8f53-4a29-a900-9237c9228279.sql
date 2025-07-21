-- Create the missing admin_user_assignments table
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