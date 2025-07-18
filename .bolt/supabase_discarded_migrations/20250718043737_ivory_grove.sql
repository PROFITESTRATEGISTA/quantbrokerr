/*
  # Fix user profiles policies for admin operations

  1. Security Changes
    - Update RLS policies to allow admin to edit all user profiles
    - Ensure admin can update leverage_multiplier and contracted_plan
    - Maintain user self-management capabilities
*/

-- Drop existing policies that might be restrictive
DROP POLICY IF EXISTS "users_manage_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "Admin pode acessar todos os perfis" ON user_profiles;

-- Create comprehensive admin policy for all operations
CREATE POLICY "Admin can manage all user profiles"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (
    (jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text
  )
  WITH CHECK (
    (jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text
  );

-- Allow users to manage their own profiles
CREATE POLICY "Users can manage own profile"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = id
  )
  WITH CHECK (
    auth.uid() = id
  );

-- Allow public read access for authenticated users
CREATE POLICY "Authenticated users can read profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);