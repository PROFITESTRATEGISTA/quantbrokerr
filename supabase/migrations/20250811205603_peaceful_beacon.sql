/*
  # Remove max leverage field

  1. Changes
    - Remove max_leverage column from user_profiles table
    - Remove related constraints
    - Update triggers to only track current_leverage changes
    - Simplify leverage management to single field

  2. Security
    - Maintain RLS policies
    - Keep audit trail for current_leverage changes
*/

-- Remove the constraint that compares current_leverage with max_leverage
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_profiles_current_max_leverage_check'
  ) THEN
    ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_current_max_leverage_check;
  END IF;
END $$;

-- Remove the max_leverage constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_profiles_max_leverage_check'
  ) THEN
    ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_max_leverage_check;
  END IF;
END $$;

-- Drop the max_leverage column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'max_leverage'
  ) THEN
    ALTER TABLE user_profiles DROP COLUMN max_leverage;
  END IF;
END $$;

-- Update the leverage history trigger to only track current_leverage
CREATE OR REPLACE FUNCTION track_leverage_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if current_leverage changed
  IF OLD.current_leverage IS DISTINCT FROM NEW.current_leverage THEN
    INSERT INTO user_leverage_history (
      user_id,
      old_leverage,
      new_leverage,
      changed_by,
      change_reason
    ) VALUES (
      NEW.id,
      OLD.current_leverage,
      NEW.current_leverage,
      'admin', -- Could be enhanced to track actual admin user
      'Manual update via admin panel'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS track_user_leverage_changes ON user_profiles;
CREATE TRIGGER track_user_leverage_changes
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION track_leverage_changes();