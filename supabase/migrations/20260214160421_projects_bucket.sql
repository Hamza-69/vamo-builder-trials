-- Create projects storage bucket for project screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'projects',
  'projects',
  true,
  5242880, -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload screenshots to their own folder
CREATE POLICY "Users can upload project screenshots"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'projects'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to update (overwrite) their own screenshots
CREATE POLICY "Users can update their project screenshots"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'projects'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to delete their own screenshots
CREATE POLICY "Users can delete their project screenshots"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'projects'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read access to all project screenshots
CREATE POLICY "Anyone can view project screenshots"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'projects');
