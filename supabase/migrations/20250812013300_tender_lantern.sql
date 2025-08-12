/*
  # Create Storage Buckets System for Contracts

  1. Storage Buckets
    - `client-contracts` - For client contract files
    - `supplier-contracts` - For supplier contract files
  
  2. Security
    - Admin can upload/delete files
    - Public read access for viewing contracts
    - File size limit: 10MB
    - Allowed types: PDF, DOC, DOCX
  
  3. Database Updates
    - Add contract_file_url column to client_contracts
    - Add contract_file_url column to supplier_contracts
*/

-- Add contract_file_url column to client_contracts if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_contracts' AND column_name = 'contract_file_url'
  ) THEN
    ALTER TABLE client_contracts ADD COLUMN contract_file_url text;
  END IF;
END $$;

-- Add contract_file_url column to supplier_contracts if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supplier_contracts' AND column_name = 'contract_file_url'
  ) THEN
    ALTER TABLE supplier_contracts ADD COLUMN contract_file_url text;
  END IF;
END $$;

-- Create storage buckets (this will be handled by the edge function)
-- But we can prepare the policies here

-- Enable storage extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "storage" SCHEMA "extensions";

-- Note: Actual bucket creation will be done via edge function
-- This migration prepares the database structure