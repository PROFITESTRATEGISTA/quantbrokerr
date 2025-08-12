/*
  # Fix storage bucket policies for file uploads

  1. Storage Setup
    - Create client-contracts bucket if not exists
    - Create supplier-contracts bucket if not exists
    - Set proper bucket configuration (public: false, file size limits)

  2. Security Policies
    - Admin can upload, view, and delete files
    - Public can view files (for contract access)
    - Proper RLS policies using auth.uid() and auth.role()

  3. File Restrictions
    - Only PDF, DOC, DOCX files allowed
    - Maximum file size: 10MB
*/

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('client-contracts', 'client-contracts', false, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('supplier-contracts', 'supplier-contracts', false, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admin can upload client contracts" ON storage.objects;
DROP POLICY IF EXISTS "Admin can view client contracts" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete client contracts" ON storage.objects;
DROP POLICY IF EXISTS "Public can view client contracts" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload supplier contracts" ON storage.objects;
DROP POLICY IF EXISTS "Admin can view supplier contracts" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete supplier contracts" ON storage.objects;
DROP POLICY IF EXISTS "Public can view supplier contracts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to client-contracts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to supplier-contracts" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view contracts" ON storage.objects;

-- Create new policies with correct syntax
CREATE POLICY "Admin can manage client contracts"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'client-contracts' AND 
    (auth.jwt() ->> 'email') = 'pedropardal04@gmail.com'
  )
  WITH CHECK (
    bucket_id = 'client-contracts' AND 
    (auth.jwt() ->> 'email') = 'pedropardal04@gmail.com'
  );

CREATE POLICY "Admin can manage supplier contracts"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'supplier-contracts' AND 
    (auth.jwt() ->> 'email') = 'pedropardal04@gmail.com'
  )
  WITH CHECK (
    bucket_id = 'supplier-contracts' AND 
    (auth.jwt() ->> 'email') = 'pedropardal04@gmail.com'
  );

CREATE POLICY "Public can view contract files"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id IN ('client-contracts', 'supplier-contracts'));