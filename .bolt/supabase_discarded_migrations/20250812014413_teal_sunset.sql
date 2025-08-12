/*
  # Create Storage Buckets and RLS Policies for Contracts

  1. New Storage Buckets
    - `client-contracts` - For client contract files
    - `supplier-contracts` - For supplier contract files

  2. Security
    - Enable RLS on storage.objects
    - Add policies for admin to upload, view, and delete files
    - Add policies for public to view files (if needed)

  3. Configuration
    - File size limit: 10MB
    - Allowed file types: PDF, DOC, DOCX
    - Public access for viewing
*/

-- Create client-contracts bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-contracts',
  'client-contracts',
  true,
  10485760, -- 10MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create supplier-contracts bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'supplier-contracts',
  'supplier-contracts',
  true,
  10485760, -- 10MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Remove any existing conflicting policies
DELETE FROM storage.policies 
WHERE bucket_id IN (
  SELECT id FROM storage.buckets WHERE name IN ('client-contracts', 'supplier-contracts')
);

-- Create RLS policies for client-contracts bucket
INSERT INTO storage.policies (name, bucket_id, operation, definition, check_expression)
SELECT 
  'Admin can upload client contracts',
  id,
  'INSERT',
  '(auth.jwt() ->> ''email''::text) = ''pedropardal04@gmail.com''::text',
  '(auth.jwt() ->> ''email''::text) = ''pedropardal04@gmail.com''::text'
FROM storage.buckets WHERE name = 'client-contracts';

INSERT INTO storage.policies (name, bucket_id, operation, definition, check_expression)
SELECT 
  'Admin can view client contracts',
  id,
  'SELECT',
  '(auth.jwt() ->> ''email''::text) = ''pedropardal04@gmail.com''::text',
  '(auth.jwt() ->> ''email''::text) = ''pedropardal04@gmail.com''::text'
FROM storage.buckets WHERE name = 'client-contracts';

INSERT INTO storage.policies (name, bucket_id, operation, definition, check_expression)
SELECT 
  'Admin can delete client contracts',
  id,
  'DELETE',
  '(auth.jwt() ->> ''email''::text) = ''pedropardal04@gmail.com''::text',
  '(auth.jwt() ->> ''email''::text) = ''pedropardal04@gmail.com''::text'
FROM storage.buckets WHERE name = 'client-contracts';

INSERT INTO storage.policies (name, bucket_id, operation, definition, check_expression)
SELECT 
  'Public can view client contracts',
  id,
  'SELECT',
  'true',
  'true'
FROM storage.buckets WHERE name = 'client-contracts';

-- Create RLS policies for supplier-contracts bucket
INSERT INTO storage.policies (name, bucket_id, operation, definition, check_expression)
SELECT 
  'Admin can upload supplier contracts',
  id,
  'INSERT',
  '(auth.jwt() ->> ''email''::text) = ''pedropardal04@gmail.com''::text',
  '(auth.jwt() ->> ''email''::text) = ''pedropardal04@gmail.com''::text'
FROM storage.buckets WHERE name = 'supplier-contracts';

INSERT INTO storage.policies (name, bucket_id, operation, definition, check_expression)
SELECT 
  'Admin can view supplier contracts',
  id,
  'SELECT',
  '(auth.jwt() ->> ''email''::text) = ''pedropardal04@gmail.com''::text',
  '(auth.jwt() ->> ''email''::text) = ''pedropardal04@gmail.com''::text'
FROM storage.buckets WHERE name = 'supplier-contracts';

INSERT INTO storage.policies (name, bucket_id, operation, definition, check_expression)
SELECT 
  'Admin can delete supplier contracts',
  id,
  'DELETE',
  '(auth.jwt() ->> ''email''::text) = ''pedropardal04@gmail.com''::text',
  '(auth.jwt() ->> ''email''::text) = ''pedropardal04@gmail.com''::text'
FROM storage.buckets WHERE name = 'supplier-contracts';

INSERT INTO storage.policies (name, bucket_id, operation, definition, check_expression)
SELECT 
  'Public can view supplier contracts',
  id,
  'SELECT',
  'true',
  'true'
FROM storage.buckets WHERE name = 'supplier-contracts';

-- Add contract_file_url column to client_contracts table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_contracts' AND column_name = 'contract_file_url'
  ) THEN
    ALTER TABLE client_contracts ADD COLUMN contract_file_url text;
  END IF;
END $$;

-- Add contract_file_url column to supplier_contracts table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supplier_contracts' AND column_name = 'contract_file_url'
  ) THEN
    ALTER TABLE supplier_contracts ADD COLUMN contract_file_url text;
  END IF;
END $$;