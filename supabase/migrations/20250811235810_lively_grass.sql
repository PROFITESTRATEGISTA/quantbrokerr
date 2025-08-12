/*
  # Update client_contracts table for enhanced contract management

  1. Schema Updates
    - Add contract_file_url column for storing uploaded contract documents
    - Update billing_period constraint to include monthly_no_term option
    - Make contract_end nullable for contracts without end date
    - Add cancellation tracking fields

  2. New Features
    - Support for monthly contracts without fixed end date
    - Contract file upload capability
    - Enhanced cancellation tracking
    - Better contract lifecycle management

  3. Security
    - Maintain existing RLS policies
    - Ensure proper access control for file uploads
*/

-- Add new columns for enhanced contract management
DO $$
BEGIN
  -- Add contract file URL column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_contracts' AND column_name = 'contract_file_url'
  ) THEN
    ALTER TABLE client_contracts ADD COLUMN contract_file_url text;
  END IF;

  -- Add cancellation reason column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_contracts' AND column_name = 'cancellation_reason'
  ) THEN
    ALTER TABLE client_contracts ADD COLUMN cancellation_reason text;
  END IF;

  -- Add cancellation date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_contracts' AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE client_contracts ADD COLUMN cancelled_at timestamp with time zone;
  END IF;
END $$;

-- Make contract_end nullable for contracts without end date
ALTER TABLE client_contracts ALTER COLUMN contract_end DROP NOT NULL;

-- Update billing_period constraint to include monthly_no_term
ALTER TABLE client_contracts DROP CONSTRAINT IF EXISTS client_contracts_billing_period_check;
ALTER TABLE client_contracts ADD CONSTRAINT client_contracts_billing_period_check 
  CHECK (billing_period = ANY (ARRAY['monthly'::text, 'monthly_no_term'::text, 'semiannual'::text, 'annual'::text]));

-- Create storage bucket for contract files if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for contract files
CREATE POLICY "Admin can upload contract files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'contracts' AND 
    (jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text
  );

CREATE POLICY "Admin can view contract files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
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

-- Add comment to table
COMMENT ON TABLE client_contracts IS 'Enhanced contract management with file uploads and flexible terms';
COMMENT ON COLUMN client_contracts.contract_file_url IS 'URL path to uploaded contract document';
COMMENT ON COLUMN client_contracts.cancellation_reason IS 'Reason provided when contract is cancelled';
COMMENT ON COLUMN client_contracts.cancelled_at IS 'Timestamp when contract was cancelled';
COMMENT ON COLUMN client_contracts.contract_end IS 'End date of contract (nullable for contracts without fixed term)';