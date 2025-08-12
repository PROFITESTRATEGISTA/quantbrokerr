/*
  # Create contracts storage bucket

  1. Storage Bucket
    - Create 'contracts' bucket for storing contract files
    - Configure public access for downloads
    - Set file size limits and allowed file types

  2. Security
    - RLS policies for admin upload/delete access
    - Public read access for file downloads
    - File type restrictions (PDF, DOC, DOCX)
*/

-- Create the contracts storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contracts',
  'contracts',
  true,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for admin to upload/delete contract files
CREATE POLICY "Admin can upload contract files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'contracts' AND
    (jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text
  );

CREATE POLICY "Admin can delete contract files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'contracts' AND
    (jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text
  );

-- Policy for public read access to contract files
CREATE POLICY "Public can view contract files"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'contracts');

-- Policy for admin to update contract files
CREATE POLICY "Admin can update contract files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'contracts' AND
    (jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text
  )
  WITH CHECK (
    bucket_id = 'contracts' AND
    (jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text
  );