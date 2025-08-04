-- Fix the RLS security issues by enabling RLS on tables that have policies but RLS disabled

-- Enable RLS on livekit_rooms table
ALTER TABLE livekit_rooms ENABLE ROW LEVEL SECURITY;

-- Enable RLS on companies table  
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create basic policies for livekit_rooms
CREATE POLICY "Event hosts can manage livekit rooms" 
ON livekit_rooms 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM events 
    WHERE events.id = livekit_rooms.event_id 
    AND events.created_by = auth.uid()
  )
);

-- Create basic policies for companies
CREATE POLICY "Company members can view companies" 
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

CREATE POLICY "Users can create companies" 
ON companies 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Company masters can update companies" 
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