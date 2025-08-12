/*
  # Fix client contracts storage policies

  1. Storage Setup
    - Ensure client-contracts bucket exists with proper configuration
    - Fix RLS policies for client contracts uploads
    - Allow admin to upload, update, and delete files
    - Allow public read access for viewing contracts

  2. Security
    - Admin can manage all files in client-contracts bucket
    - Public can view files (for contract access)
    - Proper file type and size restrictions
*/

-- Ensure the client-contracts bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-contracts',
  'client-contracts',
  true,
  10485760, -- 10MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop all existing policies for client-contracts to avoid conflicts
DELETE FROM storage.policies 
WHERE bucket_id = 'client-contracts';

-- Create policies for client-contracts bucket
-- Policy 1: Admin can upload files
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES (
  'Admin can upload client contracts',
  'client-contracts',
  'INSERT',
  '(auth.jwt() ->> ''email'')::text = ''pedropardal04@gmail.com'''
);

-- Policy 2: Admin can update files
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES (
  'Admin can update client contracts',
  'client-contracts',
  'UPDATE',
  '(auth.jwt() ->> ''email'')::text = ''pedropardal04@gmail.com'''
);

-- Policy 3: Admin can delete files
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES (
  'Admin can delete client contracts',
  'client-contracts',
  'DELETE',
  '(auth.jwt() ->> ''email'')::text = ''pedropardal04@gmail.com'''
);

-- Policy 4: Public can view files
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES (
  'Public can view client contracts',
  'client-contracts',
  'SELECT',
  'true'
);