/*
  # Add contract_file_url column to client_contracts table

  1. Schema Changes
    - Add `contract_file_url` column to `client_contracts` table
    - Column type: TEXT (nullable)
    - Allows storing URLs to uploaded contract files

  2. Notes
    - This column is required for file upload functionality
    - Nullable to allow contracts without attached files
*/

-- Add contract_file_url column to client_contracts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_contracts' AND column_name = 'contract_file_url'
  ) THEN
    ALTER TABLE client_contracts ADD COLUMN contract_file_url TEXT;
  END IF;
END $$;