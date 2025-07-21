-- Drop and recreate the trigger to fix any permission issues
DROP TRIGGER IF EXISTS activate_admin_role_trigger ON auth.users;

-- Recreate the function with proper permissions
CREATE OR REPLACE FUNCTION public.activate_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Check if this email has an admin role assigned
  INSERT INTO public.admin_user_assignments (user_id, email, role)
  SELECT NEW.id, au.email, au.role
  FROM public.admin_users au
  WHERE au.email = NEW.email 
    AND au.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.admin_user_assignments aua 
      WHERE aua.user_id = NEW.id
    );
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't block user creation
    RAISE WARNING 'Failed to activate admin role for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER activate_admin_role_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.activate_admin_role();