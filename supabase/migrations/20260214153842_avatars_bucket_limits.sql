-- Add file size limit and allowed MIME types to avatars bucket
UPDATE storage.buckets
SET
  file_size_limit = 5242880, -- 5MB max
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'avatars';
