/*
  # Remove max_leverage column from user_profiles

  1. Changes
    - Remove max_leverage column from user_profiles table
    - Update trigger function to only track current_leverage changes
    - Remove any constraints related to max_leverage

  2. Security
    - Maintains existing RLS policies
    - Preserves all other user profile functionality
*/

-- Remove the max_leverage column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'max_leverage'
  ) THEN
    ALTER TABLE user_profiles DROP COLUMN max_leverage;
  END IF;
END $$;

-- Update the trigger function to only track current_leverage changes
CREATE OR REPLACE FUNCTION track_leverage_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if current_leverage actually changed
  IF OLD.current_leverage IS DISTINCT FROM NEW.current_leverage THEN
    INSERT INTO user_leverage_history (
      user_id,
      old_leverage,
      new_leverage,
      changed_at
    ) VALUES (
      NEW.id,
      OLD.current_leverage,
      NEW.current_leverage,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;