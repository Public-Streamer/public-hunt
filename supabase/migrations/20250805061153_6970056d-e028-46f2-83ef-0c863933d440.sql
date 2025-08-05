-- Add author_name and author_avatar fields to user_posts table
ALTER TABLE public.user_posts 
ADD COLUMN IF NOT EXISTS author_name TEXT,
ADD COLUMN IF NOT EXISTS author_avatar TEXT;