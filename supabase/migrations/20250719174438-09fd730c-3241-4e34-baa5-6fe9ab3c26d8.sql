-- Update the legal_documents RLS policy to allow unauthenticated users to sign during signup
DROP POLICY IF EXISTS "System can insert legal documents" ON public.legal_documents;

-- Create a new policy that allows both authenticated and unauthenticated users to insert legal documents
CREATE POLICY "Allow legal document signing during signup" 
ON public.legal_documents 
FOR INSERT 
WITH CHECK (true);

-- Also ensure users can view their own documents after authentication
DROP POLICY IF EXISTS "Users can view their own legal documents" ON public.legal_documents;

CREATE POLICY "Users can view their own legal documents" 
ON public.legal_documents 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);