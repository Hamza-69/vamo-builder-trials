-- Create listings storage bucket for listing screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listings',
  'listings',
  true,
  5242880, -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload screenshots to their own folder
CREATE POLICY "Users can upload listing screenshots"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'listings'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to update (overwrite) their own screenshots
CREATE POLICY "Users can update their listing screenshots"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'listings'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to delete their own screenshots
CREATE POLICY "Users can delete their listing screenshots"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'listings'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read access to all listing screenshots
CREATE POLICY "Anyone can view listing screenshots"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'listings');
