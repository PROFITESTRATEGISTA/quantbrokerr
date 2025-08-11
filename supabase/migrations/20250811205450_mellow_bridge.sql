/*
  # Remove leverage constraints and allow unlimited leverage

  1. Database Changes
    - Remove check constraints that limit leverage to 5x
    - Update constraints to allow leverage up to 100x
    - Update default values for better flexibility

  2. Security
    - Maintain RLS policies
    - Keep data validation for positive values only
*/

-- Remove existing leverage constraints
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_leverage_multiplier_check;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_current_leverage_check;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_max_leverage_check;

-- Add new constraints with higher limits (up to 100x)
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_leverage_multiplier_check 
  CHECK (leverage_multiplier >= 1 AND leverage_multiplier <= 100);

ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_current_leverage_check 
  CHECK (current_leverage >= 1 AND current_leverage <= 100);

ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_max_leverage_check 
  CHECK (max_leverage >= 1 AND max_leverage <= 100);

-- Update default max_leverage to 100 for existing users
UPDATE user_profiles 
SET max_leverage = 100 
WHERE max_leverage < 100 OR max_leverage IS NULL;

-- Ensure current_leverage doesn't exceed max_leverage
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_current_max_leverage_check 
  CHECK (current_leverage <= max_leverage);