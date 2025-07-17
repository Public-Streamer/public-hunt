-- Create company_profiles table for company information
CREATE TABLE public.company_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  founded_year INTEGER,
  headquarters TEXT,
  website TEXT,
  logo_url TEXT,
  cover_photo_url TEXT,
  employee_count TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on company_profiles
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

-- Company members can view company profiles
CREATE POLICY "Users can view company profiles"
ON public.company_profiles
FOR SELECT
USING (true);

-- Company masters can manage company profiles
CREATE POLICY "Company masters can manage company profiles"
ON public.company_profiles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM company_roles cr 
    WHERE cr.company_id = company_profiles.company_id 
    AND cr.user_id = auth.uid() 
    AND cr.role = 'company_master'
  )
);

-- Company masters can insert company profiles
CREATE POLICY "Company masters can create company profiles"
ON public.company_profiles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM company_roles cr 
    WHERE cr.company_id = company_profiles.company_id 
    AND cr.user_id = auth.uid() 
    AND cr.role = 'company_master'
  )
);

-- Create trigger to update updated_at
CREATE TRIGGER update_company_profiles_updated_at
BEFORE UPDATE ON public.company_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();