/*
  # Update leverage limits to 100x

  1. Schema Changes
    - Update constraints to allow leverage up to 100x
    - Add new leverage control fields
    - Update existing constraints

  2. Security
    - Maintain RLS policies
    - Keep admin-only access for leverage changes

  3. Data Migration
    - Update existing records to use new limits
    - Preserve current leverage settings
*/

-- Remove old constraints that limit leverage to 5x
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_leverage_multiplier_check;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_current_leverage_check;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_max_leverage_check;

-- Add new constraints allowing up to 100x leverage
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_leverage_multiplier_check 
  CHECK (leverage_multiplier >= 1 AND leverage_multiplier <= 100);

ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_current_leverage_check 
  CHECK (current_leverage >= 1 AND current_leverage <= 100);

ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_max_leverage_check 
  CHECK (max_leverage >= 1 AND max_leverage <= 100);

-- Update default max_leverage to 100x for existing users
UPDATE user_profiles 
SET max_leverage = 100 
WHERE max_leverage IS NULL OR max_leverage < 100;

-- Add leverage change history table for audit trail
CREATE TABLE IF NOT EXISTS user_leverage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  old_leverage integer,
  new_leverage integer NOT NULL,
  changed_by text, -- Email of admin who made the change
  change_reason text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on leverage history
ALTER TABLE user_leverage_history ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage leverage history
CREATE POLICY "Admin can manage leverage history"
  ON user_leverage_history
  FOR ALL
  TO authenticated
  USING ((jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text)
  WITH CHECK ((jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_leverage_history_user_id 
  ON user_leverage_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_leverage_history_created_at 
  ON user_leverage_history(created_at);

-- Function to log leverage changes
CREATE OR REPLACE FUNCTION log_leverage_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if leverage actually changed
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
      current_setting('request.jwt.claims', true)::json ->> 'email',
      'Admin panel update'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for leverage change logging
DROP TRIGGER IF EXISTS trigger_log_leverage_change ON user_profiles;
CREATE TRIGGER trigger_log_leverage_change
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_leverage_change();