-- Add cam_name field to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN cam_name TEXT DEFAULT 'Camera 01';