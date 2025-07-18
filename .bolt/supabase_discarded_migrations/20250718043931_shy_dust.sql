/*
  # Fix user editing policies

  1. Security
    - Drop existing restrictive policies
    - Create new comprehensive policies for admin and user management
    - Allow admin full access and users to manage their own profiles

  2. Changes
    - Admin can manage all user profiles
    - Users can update their own profiles
    - Authenticated users can read profiles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admin pode acessar todos os perfis" ON user_profiles;
DROP POLICY IF EXISTS "authenticated_read_profiles" ON user_profiles;
DROP POLICY IF EXISTS "users_manage_own_profile" ON user_profiles;

-- Create comprehensive admin policy
CREATE POLICY "admin_full_access" ON user_profiles
  FOR ALL
  TO authenticated
  USING (
    (jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text
  )
  WITH CHECK (
    (jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text
  );

-- Allow users to read all profiles (for admin interface)
CREATE POLICY "authenticated_users_read_profiles" ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to update their own profiles
CREATE POLICY "users_update_own_profile" ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profiles
CREATE POLICY "users_insert_own_profile" ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);