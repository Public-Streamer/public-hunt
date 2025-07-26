-- Add shares column to user_posts table
ALTER TABLE public.user_posts 
ADD COLUMN shares INTEGER NOT NULL DEFAULT 0;