/*
  # Create supplier contracts table

  1. New Tables
    - `supplier_contracts`
      - `id` (uuid, primary key)
      - `supplier_name` (text, required)
      - `supplier_email` (text, required)
      - `supplier_phone` (text, optional)
      - `contract_type` (text, required - categoria do serviço)
      - `service_description` (text, required)
      - `monthly_value` (numeric, required)
      - `contract_start` (date, required)
      - `contract_end` (date, optional - null para contratos sem prazo)
      - `payment_frequency` (text, required)
      - `contract_file_url` (text, optional - URL do arquivo)
      - `is_active` (boolean, default true)
      - `auto_renewal` (boolean, default false)
      - `cancellation_reason` (text, optional)
      - `cancelled_at` (timestamp, optional)
      - `created_at` (timestamp, default now)
      - `updated_at` (timestamp, default now)

  2. Security
    - Enable RLS on `supplier_contracts` table
    - Add policy for admin access only

  3. Storage
    - Create bucket for contract files
    - Set up policies for file access
*/

-- Create supplier contracts table
CREATE TABLE IF NOT EXISTS supplier_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name text NOT NULL,
  supplier_email text NOT NULL,
  supplier_phone text,
  contract_type text NOT NULL CHECK (contract_type IN ('tecnologia', 'marketing', 'operacional', 'juridico', 'contabil', 'consultoria', 'infraestrutura', 'outros')),
  service_description text NOT NULL,
  monthly_value numeric(10,2) NOT NULL CHECK (monthly_value > 0),
  contract_start date NOT NULL,
  contract_end date,
  payment_frequency text NOT NULL CHECK (payment_frequency IN ('monthly', 'quarterly', 'semiannual', 'annual')),
  contract_file_url text,
  is_active boolean DEFAULT true,
  auto_renewal boolean DEFAULT false,
  cancellation_reason text,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT supplier_contracts_date_check CHECK (contract_end IS NULL OR contract_end >= contract_start)
);

-- Enable RLS
ALTER TABLE supplier_contracts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin pode gerenciar contratos de fornecedores"
  ON supplier_contracts
  FOR ALL
  TO authenticated
  USING ((jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text)
  WITH CHECK ((jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_supplier_contracts_is_active ON supplier_contracts(is_active);
CREATE INDEX IF NOT EXISTS idx_supplier_contracts_contract_type ON supplier_contracts(contract_type);
CREATE INDEX IF NOT EXISTS idx_supplier_contracts_payment_frequency ON supplier_contracts(payment_frequency);
CREATE INDEX IF NOT EXISTS idx_supplier_contracts_created_at ON supplier_contracts(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION handle_supplier_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_supplier_contracts_updated_at
  BEFORE UPDATE ON supplier_contracts
  FOR EACH ROW
  EXECUTE FUNCTION handle_supplier_contracts_updated_at();

-- Create storage bucket for contract files (if not exists)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('contracts', 'contracts', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Create storage policies
CREATE POLICY "Admin pode fazer upload de contratos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'contracts' AND
    (jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text
  );

CREATE POLICY "Admin pode ver contratos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'contracts' AND
    (jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text
  );

CREATE POLICY "Contratos são públicos para visualização"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'contracts');