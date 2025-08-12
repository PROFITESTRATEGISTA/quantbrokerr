/*
  # Create contracts storage bucket

  1. Storage Setup
    - Create 'contracts' storage bucket for client contract files
    - Configure size limits and file type restrictions
    - Set up proper RLS policies for admin access

  2. Security
    - Admin can upload and delete contract files
    - Public read access for viewing contracts
    - File size limit of 10MB per file

  3. File Organization
    - Files stored in client-contracts/ folder
    - Unique naming to prevent conflicts
    - Support for PDF, DOC, and DOCX files
*/

-- Create the contracts storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contracts',
  'contracts',
  true,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for admin to upload contract files
CREATE POLICY "Admin can upload contract files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'contracts' AND
    (auth.jwt() ->> 'email') = 'pedropardal04@gmail.com'
  );

-- Policy for admin to update contract files
CREATE POLICY "Admin can update contract files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'contracts' AND
    (auth.jwt() ->> 'email') = 'pedropardal04@gmail.com'
  );

-- Policy for admin to delete contract files
CREATE POLICY "Admin can delete contract files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'contracts' AND
    (auth.jwt() ->> 'email') = 'pedropardal04@gmail.com'
  );

-- Policy for public read access to contract files
CREATE POLICY "Public can view contract files"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'contracts');