
-- Fix the infinite recursion error in admin_user_assignments RLS policy
-- First, create a security definer function to safely check admin roles
CREATE OR REPLACE FUNCTION public.get_user_admin_role_safe(user_id_param UUID)
RETURNS admin_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT aua.role 
  FROM admin_user_assignments aua 
  WHERE aua.user_id = user_id_param
  LIMIT 1;
$$;

-- Drop the problematic RLS policy that causes infinite recursion
DROP POLICY IF EXISTS "Owner can manage assignments" ON admin_user_assignments;

-- Create a new RLS policy that uses the security definer function
CREATE POLICY "Owner can manage assignments" ON admin_user_assignments
  FOR ALL USING (
    public.get_user_admin_role_safe(auth.uid()) = 'owner'::admin_role
  );

-- Also update the other policy to use the security definer function
DROP POLICY IF EXISTS "Owner can manage admin users" ON admin_users;

CREATE POLICY "Owner can manage admin users" ON admin_users
  FOR ALL USING (
    public.get_user_admin_role_safe(auth.uid()) = 'owner'::admin_role
  );

-- Add a function to update Stripe account status from external data
CREATE OR REPLACE FUNCTION public.update_stripe_account_status(
  account_id TEXT,
  new_status TEXT,
  onboarding_completed BOOLEAN,
  payouts_enabled BOOLEAN
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE host_stripe_accounts 
  SET 
    account_status = new_status,
    onboarding_completed = onboarding_completed,
    payouts_enabled = payouts_enabled,
    updated_at = now()
  WHERE stripe_account_id = account_id;
$$;
