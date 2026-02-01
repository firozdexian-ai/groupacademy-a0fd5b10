-- Create feed-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('feed-images', 'feed-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public can view feed images" ON storage.objects
  FOR SELECT USING (bucket_id = 'feed-images');

-- Allow authenticated users (admins) to upload
CREATE POLICY "Authenticated users can upload feed images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'feed-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete feed images" ON storage.objects
  FOR DELETE USING (bucket_id = 'feed-images' AND auth.role() = 'authenticated');