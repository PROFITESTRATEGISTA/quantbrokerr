/*
  # Fix Storage RLS Policies for File Uploads

  1. Storage Setup
    - Recreate storage buckets with proper configuration
    - Set up RLS policies that actually work for uploads
    - Use correct policy syntax for storage operations

  2. Security
    - Allow authenticated users to upload files
    - Allow public read access for viewing files
    - Restrict file types and sizes appropriately
*/

-- First, clean up any existing buckets and policies
DELETE FROM storage.policies WHERE bucket_id IN (
  SELECT id FROM storage.buckets WHERE name IN ('client-contracts', 'supplier-contracts')
);

DELETE FROM storage.buckets WHERE name IN ('client-contracts', 'supplier-contracts');

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('client-contracts', 'client-contracts', true, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('supplier-contracts', 'supplier-contracts', true, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);

-- Create RLS policies for client-contracts bucket
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES 
  ('Allow authenticated uploads', 'client-contracts', 'INSERT', 'auth.role() = ''authenticated'''),
  ('Allow public downloads', 'client-contracts', 'SELECT', 'true'),
  ('Allow authenticated deletes', 'client-contracts', 'DELETE', 'auth.role() = ''authenticated'''),
  ('Allow authenticated updates', 'client-contracts', 'UPDATE', 'auth.role() = ''authenticated''');

-- Create RLS policies for supplier-contracts bucket
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES 
  ('Allow authenticated uploads', 'supplier-contracts', 'INSERT', 'auth.role() = ''authenticated'''),
  ('Allow public downloads', 'supplier-contracts', 'SELECT', 'true'),
  ('Allow authenticated deletes', 'supplier-contracts', 'DELETE', 'auth.role() = ''authenticated'''),
  ('Allow authenticated updates', 'supplier-contracts', 'UPDATE', 'auth.role() = ''authenticated''');