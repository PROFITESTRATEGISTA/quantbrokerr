/*
  # Add leverage multiplier to client contracts

  1. Schema Changes
    - Add `leverage_multiplier` column to `client_contracts` table
    - Set default value to 1
    - Add constraint to ensure value is between 1 and 100

  2. Notes
    - This column tracks the leverage multiplier for each client contract
    - Default value of 1 means no leverage applied
    - Maximum leverage is capped at 100x for safety
*/

-- Add leverage_multiplier column to client_contracts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_contracts' AND column_name = 'leverage_multiplier'
  ) THEN
    ALTER TABLE client_contracts ADD COLUMN leverage_multiplier integer DEFAULT 1 NOT NULL;
  END IF;
END $$;

-- Add constraint to ensure leverage multiplier is within valid range
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'client_contracts_leverage_multiplier_check'
  ) THEN
    ALTER TABLE client_contracts ADD CONSTRAINT client_contracts_leverage_multiplier_check 
    CHECK (leverage_multiplier >= 1 AND leverage_multiplier <= 100);
  END IF;
END $$;

-- Create index for leverage_multiplier for better query performance
CREATE INDEX IF NOT EXISTS idx_client_contracts_leverage_multiplier 
ON client_contracts (leverage_multiplier);