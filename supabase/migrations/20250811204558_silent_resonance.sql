/*
  # Add leverage and plan control columns to user_profiles

  1. New Columns
    - `current_leverage` (integer) - Current leverage multiplier being used
    - `max_leverage` (integer) - Maximum leverage allowed for this user
    - `plan_status` (text) - Status of the contracted plan (active, suspended, expired)
    - `plan_start_date` (date) - When the plan started
    - `plan_end_date` (date) - When the plan expires
    - `auto_renewal` (boolean) - Whether the plan auto-renews

  2. Indexes
    - Add indexes for better query performance

  3. Constraints
    - Ensure leverage values are within valid range
    - Ensure plan status has valid values
*/

-- Add new columns for better leverage and plan control
DO $$
BEGIN
  -- Add current_leverage column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'current_leverage'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN current_leverage integer DEFAULT 1;
  END IF;

  -- Add max_leverage column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'max_leverage'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN max_leverage integer DEFAULT 5;
  END IF;

  -- Add plan_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'plan_status'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN plan_status text DEFAULT 'inactive';
  END IF;

  -- Add plan_start_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'plan_start_date'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN plan_start_date date DEFAULT NULL;
  END IF;

  -- Add plan_end_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'plan_end_date'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN plan_end_date date DEFAULT NULL;
  END IF;

  -- Add auto_renewal column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'auto_renewal'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN auto_renewal boolean DEFAULT false;
  END IF;
END $$;

-- Add constraints for new columns
DO $$
BEGIN
  -- Add constraint for current_leverage if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_profiles_current_leverage_check'
  ) THEN
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_current_leverage_check 
    CHECK (current_leverage >= 1 AND current_leverage <= 5);
  END IF;

  -- Add constraint for max_leverage if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_profiles_max_leverage_check'
  ) THEN
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_max_leverage_check 
    CHECK (max_leverage >= 1 AND max_leverage <= 5);
  END IF;

  -- Add constraint for plan_status if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_profiles_plan_status_check'
  ) THEN
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_plan_status_check 
    CHECK (plan_status IN ('active', 'inactive', 'suspended', 'expired', 'pending'));
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_current_leverage ON user_profiles(current_leverage);
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan_status ON user_profiles(plan_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan_dates ON user_profiles(plan_start_date, plan_end_date);

-- Update existing users to have proper values
UPDATE user_profiles 
SET 
  current_leverage = COALESCE(leverage_multiplier, 1),
  max_leverage = 5,
  plan_status = CASE 
    WHEN contracted_plan IS NOT NULL AND contracted_plan != 'none' THEN 'active'
    ELSE 'inactive'
  END
WHERE current_leverage IS NULL OR plan_status IS NULL;

-- Add comment to table
COMMENT ON COLUMN user_profiles.current_leverage IS 'Current leverage multiplier being used by the user';
COMMENT ON COLUMN user_profiles.max_leverage IS 'Maximum leverage allowed for this user';
COMMENT ON COLUMN user_profiles.plan_status IS 'Status of the contracted plan';
COMMENT ON COLUMN user_profiles.plan_start_date IS 'Date when the current plan started';
COMMENT ON COLUMN user_profiles.plan_end_date IS 'Date when the current plan expires';
COMMENT ON COLUMN user_profiles.auto_renewal IS 'Whether the plan should auto-renew';