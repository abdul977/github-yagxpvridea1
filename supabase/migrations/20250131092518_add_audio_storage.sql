-- Create storage bucket for audio notes if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio_notes', 'audio_notes', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to read files (since we're using public URLs)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio_notes');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload audio files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio_notes'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own audio files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio_notes'
  AND auth.uid() = owner
);
