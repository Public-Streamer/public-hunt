-- Create storage bucket for ad videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('ad-videos', 'ad-videos', true, 52428800, ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']);

-- Create RLS policies for ad videos bucket
CREATE POLICY "Users can upload their own ad videos"
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'ad-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own ad videos"
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'ad-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view ad videos"
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'ad-videos');

CREATE POLICY "Users can update their own ad videos"
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'ad-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own ad videos"
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'ad-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);