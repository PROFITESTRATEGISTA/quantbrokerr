/*
  # Create client_contracts table

  1. New Tables
    - `client_contracts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `plan_type` (text, constrained values)
      - `billing_period` (text, constrained values)
      - `monthly_value` (numeric, positive values)
      - `contract_start` (date)
      - `contract_end` (date)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `client_contracts` table
    - Add policy for admin to manage all contracts
    - Add policy for users to read their own contracts

  3. Constraints
    - Valid plan types: bitcoin, mini-indice, mini-dolar, portfolio-completo
    - Valid billing periods: monthly, semiannual, annual
    - Positive monthly values
    - Contract end date after start date

  4. Indexes
    - Index on user_id for performance
    - Index on is_active for filtering
    - Index on created_at for ordering
*/

-- Create client_contracts table
CREATE TABLE IF NOT EXISTS client_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  plan_type text NOT NULL CHECK (plan_type IN ('bitcoin', 'mini-indice', 'mini-dolar', 'portfolio-completo')),
  billing_period text NOT NULL CHECK (billing_period IN ('monthly', 'semiannual', 'annual')),
  monthly_value numeric(10,2) NOT NULL CHECK (monthly_value > 0),
  contract_start date NOT NULL,
  contract_end date NOT NULL CHECK (contract_end > contract_start),
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE client_contracts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin pode gerenciar todos os contratos"
  ON client_contracts
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'pedropardal04@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'pedropardal04@gmail.com');

CREATE POLICY "Usuários podem ver seus próprios contratos"
  ON client_contracts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_contracts_user_id ON client_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_client_contracts_is_active ON client_contracts(is_active);
CREATE INDEX IF NOT EXISTS idx_client_contracts_created_at ON client_contracts(created_at);
CREATE INDEX IF NOT EXISTS idx_client_contracts_plan_type ON client_contracts(plan_type);
CREATE INDEX IF NOT EXISTS idx_client_contracts_billing_period ON client_contracts(billing_period);

-- Create trigger for updated_at
CREATE TRIGGER handle_client_contracts_updated_at
  BEFORE UPDATE ON client_contracts
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();