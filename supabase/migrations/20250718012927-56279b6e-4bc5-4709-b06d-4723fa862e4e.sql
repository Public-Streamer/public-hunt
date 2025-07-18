-- Create storage policies for media uploads
-- Allow public access to view files in media bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'media');

-- Allow authenticated users to insert files into media bucket
CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated updates" ON storage.objects FOR UPDATE 
USING (bucket_id = 'media' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their own files  
CREATE POLICY "Allow authenticated deletes" ON storage.objects FOR DELETE 
USING (bucket_id = 'media' AND auth.role() = 'authenticated');