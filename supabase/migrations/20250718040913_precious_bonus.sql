/*
  # Fix client_contracts constraint error

  1. Changes
    - Remove problematic check constraint that's causing insertion failures
    - Add more flexible date validation
    - Ensure data can be inserted properly

  2. Security
    - Maintain data integrity with updated constraints
    - Keep RLS policies intact
*/

-- Remove the problematic constraint
ALTER TABLE client_contracts DROP CONSTRAINT IF EXISTS client_contracts_check;

-- Add a more flexible constraint that allows for edge cases
ALTER TABLE client_contracts ADD CONSTRAINT client_contracts_date_check 
  CHECK (contract_end >= contract_start);

-- Also ensure we have proper defaults for dates if needed
ALTER TABLE client_contracts ALTER COLUMN contract_start SET DEFAULT CURRENT_DATE;
ALTER TABLE client_contracts ALTER COLUMN contract_end SET DEFAULT (CURRENT_DATE + INTERVAL '1 month');