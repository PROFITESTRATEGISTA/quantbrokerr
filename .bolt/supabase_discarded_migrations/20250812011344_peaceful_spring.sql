/*
  # Create contracts storage bucket

  1. Storage Setup
    - Create 'contracts' bucket for client contract files
    - Configure public access for file downloads
    - Set up RLS policies for secure access

  2. Security
    - Admin can upload/delete files
    - Authenticated users can read files
    - Public access for file downloads via signed URLs
*/

-- Create the contracts storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contracts',
  'contracts',
  true,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for admin to upload files
CREATE POLICY "Admin can upload contract files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'contracts' AND
    (jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text
  );

-- Policy for admin to delete files
CREATE POLICY "Admin can delete contract files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'contracts' AND
    (jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text
  );

-- Policy for authenticated users to read files
CREATE POLICY "Authenticated users can read contract files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'contracts');

-- Policy for public access to files (for signed URLs)
CREATE POLICY "Public can read contract files"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'contracts');