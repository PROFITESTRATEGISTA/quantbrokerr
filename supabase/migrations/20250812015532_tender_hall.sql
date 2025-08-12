/*
  # Create supplier contracts table

  1. New Tables
    - `supplier_contracts`
      - `id` (uuid, primary key)
      - `supplier_name` (text, required)
      - `supplier_email` (text, required)
      - `supplier_phone` (text, optional)
      - `contract_type` (text, required, with check constraint)
      - `service_description` (text, required)
      - `monthly_value` (numeric, required, positive)
      - `contract_start` (date, required)
      - `contract_end` (date, optional)
      - `payment_frequency` (text, required, with check constraint)
      - `contract_file_url` (text, optional)
      - `is_active` (boolean, default true)
      - `auto_renewal` (boolean, default false)
      - `cancellation_reason` (text, optional)
      - `cancelled_at` (timestamp, optional)
      - `created_at` (timestamp, default now)
      - `updated_at` (timestamp, default now)

  2. Security
    - Enable RLS on `supplier_contracts` table
    - Add policy for admin to manage all supplier contracts
    - Add policy for authenticated users to read supplier contracts

  3. Constraints
    - Check constraint for contract_type values
    - Check constraint for payment_frequency values
    - Check constraint for positive monthly_value

  4. Indexes
    - Index on contract_type for filtering
    - Index on is_active for status filtering
    - Index on created_at for sorting
*/

CREATE TABLE IF NOT EXISTS supplier_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name text NOT NULL,
  supplier_email text NOT NULL,
  supplier_phone text,
  contract_type text NOT NULL,
  service_description text NOT NULL,
  monthly_value numeric(10,2) NOT NULL,
  contract_start date NOT NULL,
  contract_end date,
  payment_frequency text NOT NULL,
  contract_file_url text,
  is_active boolean NOT NULL DEFAULT true,
  auto_renewal boolean NOT NULL DEFAULT false,
  cancellation_reason text,
  cancelled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add check constraints
ALTER TABLE supplier_contracts 
ADD CONSTRAINT supplier_contracts_contract_type_check 
CHECK (contract_type = ANY (ARRAY['tecnologia'::text, 'marketing'::text, 'operacional'::text, 'juridico'::text, 'contabil'::text, 'consultoria'::text, 'infraestrutura'::text, 'outros'::text]));

ALTER TABLE supplier_contracts 
ADD CONSTRAINT supplier_contracts_payment_frequency_check 
CHECK (payment_frequency = ANY (ARRAY['monthly'::text, 'quarterly'::text, 'semiannual'::text, 'annual'::text]));

ALTER TABLE supplier_contracts 
ADD CONSTRAINT supplier_contracts_monthly_value_positive 
CHECK (monthly_value > 0);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_supplier_contracts_contract_type ON supplier_contracts (contract_type);
CREATE INDEX IF NOT EXISTS idx_supplier_contracts_is_active ON supplier_contracts (is_active);
CREATE INDEX IF NOT EXISTS idx_supplier_contracts_created_at ON supplier_contracts (created_at);
CREATE INDEX IF NOT EXISTS idx_supplier_contracts_payment_frequency ON supplier_contracts (payment_frequency);

-- Enable RLS
ALTER TABLE supplier_contracts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin pode gerenciar contratos de fornecedores"
  ON supplier_contracts
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text);

CREATE POLICY "Usuários autenticados podem ler contratos de fornecedores"
  ON supplier_contracts
  FOR SELECT
  TO authenticated
  USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_supplier_contracts_updated_at
  BEFORE UPDATE ON supplier_contracts
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();