/*
  # Fix JWT function in RLS policies

  1. Security Updates
    - Replace jwt() with auth.jwt() in all policies
    - Update admin policies to use correct JWT function
    - Ensure proper authentication checks

  2. Policy Updates
    - Admin can manage all user profiles
    - Users can read all profiles (for admin interface)
    - Users can manage their own profiles
*/

-- Drop existing policies that use incorrect jwt() function
DROP POLICY IF EXISTS "Admin pode acessar todos os perfis" ON user_profiles;
DROP POLICY IF EXISTS "Admin pode gerenciar todos os contratos" ON client_contracts;
DROP POLICY IF EXISTS "Admin pode gerenciar custos financeiros" ON financial_costs;

-- Create corrected policies using auth.jwt()
CREATE POLICY "Admin pode acessar todos os perfis"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text);

-- Update client_contracts policies
CREATE POLICY "Admin pode gerenciar todos os contratos"
  ON client_contracts
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text);

-- Update financial_costs policies
CREATE POLICY "Admin pode gerenciar custos financeiros"
  ON financial_costs
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text);

-- Update monthly_results policies
DROP POLICY IF EXISTS "Admin can manage monthly results" ON monthly_results;
CREATE POLICY "Admin can manage monthly results"
  ON monthly_results
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text);

-- Update trading_statistics policies  
DROP POLICY IF EXISTS "Admin pode gerenciar estatísticas" ON trading_statistics;
CREATE POLICY "Admin pode gerenciar estatísticas"
  ON trading_statistics
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text);