-- Add RLS policies for the media storage bucket to allow users to upload and access files

-- First, ensure we have the storage.objects policies for profile pictures and cover photos

-- Allow users to upload their own profile pictures and cover photos
CREATE POLICY "Users can upload their own profile media" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'media' AND 
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    path_tokens[1] = 'covers'
  )
);

-- Allow users to update their own profile pictures and cover photos
CREATE POLICY "Users can update their own profile media" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'media' AND 
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    path_tokens[1] = 'covers'
  )
);

-- Allow public access to view media files
CREATE POLICY "Public can view media files" 
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'media');

-- Allow users to delete their own uploaded media
CREATE POLICY "Users can delete their own uploaded media" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'media' AND 
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    path_tokens[1] = 'covers'
  )
);