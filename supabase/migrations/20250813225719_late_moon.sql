/*
  # Add referral partner field to client contracts

  1. Changes to client_contracts table
    - Add `referral_partner_id` column to track which supplier/partner referred the client
    - Add foreign key constraint to supplier_contracts table
    - Add index for better query performance

  2. Security
    - Maintain existing RLS policies
    - Admin can manage all referral data
    - Users can view their own contract referral info
*/

-- Add referral partner column to client_contracts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_contracts' AND column_name = 'referral_partner_id'
  ) THEN
    ALTER TABLE client_contracts ADD COLUMN referral_partner_id uuid;
  END IF;
END $$;

-- Add foreign key constraint to supplier_contracts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'client_contracts_referral_partner_fkey'
  ) THEN
    ALTER TABLE client_contracts 
    ADD CONSTRAINT client_contracts_referral_partner_fkey 
    FOREIGN KEY (referral_partner_id) REFERENCES supplier_contracts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for referral partner queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_client_contracts_referral_partner'
  ) THEN
    CREATE INDEX idx_client_contracts_referral_partner ON client_contracts(referral_partner_id);
  END IF;
END $$;

-- Add comment to explain the referral system
COMMENT ON COLUMN client_contracts.referral_partner_id IS 'ID do fornecedor/parceiro que indicou este cliente para rastreamento de comissões';