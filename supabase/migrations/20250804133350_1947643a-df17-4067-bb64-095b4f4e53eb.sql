-- First check if there are tables that need RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('companies');

-- Enable RLS on companies table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'companies') THEN
        ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
        
        -- Create basic policies for companies
        CREATE POLICY IF NOT EXISTS "Company members can view companies" 
        ON companies 
        FOR SELECT 
        USING (
          EXISTS (
            SELECT 1 
            FROM company_roles cr 
            WHERE cr.company_id = companies.id 
            AND cr.user_id = auth.uid()
          )
        );

        CREATE POLICY IF NOT EXISTS "Users can create companies" 
        ON companies 
        FOR INSERT 
        WITH CHECK (auth.uid() = created_by);

        CREATE POLICY IF NOT EXISTS "Company masters can update companies" 
        ON companies 
        FOR UPDATE 
        USING (
          EXISTS (
            SELECT 1 
            FROM company_roles cr 
            WHERE cr.company_id = companies.id 
            AND cr.user_id = auth.uid() 
            AND cr.role = 'company_master'
          )
        );
    END IF;
END
$$;