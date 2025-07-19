-- Create table for storing signed legal documents
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  signature TEXT NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  document_type TEXT NOT NULL DEFAULT 'user_agreement',
  document_version TEXT NOT NULL DEFAULT '1.0',
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own legal documents" 
ON public.legal_documents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert legal documents" 
ON public.legal_documents 
FOR INSERT 
WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_legal_documents_user_id ON public.legal_documents(user_id);
CREATE INDEX idx_legal_documents_email ON public.legal_documents(email);