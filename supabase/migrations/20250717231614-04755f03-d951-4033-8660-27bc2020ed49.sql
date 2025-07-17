-- Create company_roles table for managing company permissions
CREATE TABLE public.company_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  permissions TEXT[] DEFAULT '{}',
  assigned_by UUID,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- Add company_id to user_profiles to link users to companies
ALTER TABLE public.user_profiles 
ADD COLUMN company_id UUID,
ADD COLUMN is_company_account BOOLEAN DEFAULT false,
ADD COLUMN company_name TEXT;

-- Enable RLS on company_roles
ALTER TABLE public.company_roles ENABLE ROW LEVEL SECURITY;

-- Company members can view their own company roles
CREATE POLICY "Users can view company roles they belong to"
ON public.company_roles
FOR SELECT
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM company_roles cr 
    WHERE cr.company_id = company_roles.company_id 
    AND cr.user_id = auth.uid() 
    AND cr.role IN ('company_master', 'admin')
  )
);

-- Company masters can manage all roles in their company
CREATE POLICY "Company masters can manage company roles"
ON public.company_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM company_roles cr 
    WHERE cr.company_id = company_roles.company_id 
    AND cr.user_id = auth.uid() 
    AND cr.role = 'company_master'
  )
);

-- Users can be assigned roles by company masters
CREATE POLICY "Users can be assigned company roles"
ON public.company_roles
FOR INSERT
WITH CHECK (
  assigned_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM company_roles cr 
    WHERE cr.company_id = company_roles.company_id 
    AND cr.user_id = auth.uid() 
    AND cr.role = 'company_master'
  )
);

-- Create trigger to update updated_at
CREATE TRIGGER update_company_roles_updated_at
BEFORE UPDATE ON public.company_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();