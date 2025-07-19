-- Allow user_id to be nullable for legal documents signed during signup
ALTER TABLE public.legal_documents 
ALTER COLUMN user_id DROP NOT NULL;