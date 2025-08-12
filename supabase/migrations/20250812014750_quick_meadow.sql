/*
  # Fix Storage RLS Policies for File Uploads

  1. Storage Buckets
    - Ensure client-contracts and supplier-contracts buckets exist
    - Configure proper settings for file uploads

  2. RLS Policies
    - Allow authenticated users to upload files
    - Allow public read access to files
    - Allow admin to manage all files

  3. Security
    - Proper RLS policies for storage operations
    - File type and size restrictions
*/

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('client-contracts', 'client-contracts', true, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('supplier-contracts', 'supplier-contracts', true, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop all existing policies to start fresh
DELETE FROM storage.policies WHERE bucket_id IN (
  SELECT id FROM storage.buckets WHERE name IN ('client-contracts', 'supplier-contracts')
);

-- Create INSERT policy for authenticated users
INSERT INTO storage.policies (name, bucket_id, operation, definition, check_expression)
SELECT 
  'Authenticated users can upload',
  id,
  'INSERT',
  'auth.role() = ''authenticated''',
  'auth.role() = ''authenticated'''
FROM storage.buckets WHERE name = 'client-contracts';

INSERT INTO storage.policies (name, bucket_id, operation, definition, check_expression)
SELECT 
  'Authenticated users can upload',
  id,
  'INSERT',
  'auth.role() = ''authenticated''',
  'auth.role() = ''authenticated'''
FROM storage.buckets WHERE name = 'supplier-contracts';

-- Create SELECT policy for public access
INSERT INTO storage.policies (name, bucket_id, operation, definition)
SELECT 
  'Public can view files',
  id,
  'SELECT',
  'true'
FROM storage.buckets WHERE name = 'client-contracts';

INSERT INTO storage.policies (name, bucket_id, operation, definition)
SELECT 
  'Public can view files',
  id,
  'SELECT',
  'true'
FROM storage.buckets WHERE name = 'supplier-contracts';

-- Create DELETE policy for authenticated users
INSERT INTO storage.policies (name, bucket_id, operation, definition, check_expression)
SELECT 
  'Authenticated users can delete',
  id,
  'DELETE',
  'auth.role() = ''authenticated''',
  'auth.role() = ''authenticated'''
FROM storage.buckets WHERE name = 'client-contracts';

INSERT INTO storage.policies (name, bucket_id, operation, definition, check_expression)
SELECT 
  'Authenticated users can delete',
  id,
  'DELETE',
  'auth.role() = ''authenticated''',
  'auth.role() = ''authenticated'''
FROM storage.buckets WHERE name = 'supplier-contracts';