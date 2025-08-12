/*
  # Create supplier_contracts table

  1. New Tables
    - `supplier_contracts`
      - `id` (uuid, primary key)
      - `supplier_name` (text, required) - Nome do fornecedor
      - `supplier_email` (text, required) - Email do fornecedor
      - `supplier_phone` (text, optional) - Telefone do fornecedor
      - `contract_type` (text, required) - Tipo do contrato (tecnologia, marketing, etc.)
      - `service_description` (text, required) - Descrição dos serviços
      - `monthly_value` (numeric, required) - Valor mensal do contrato
      - `contract_start` (date, required) - Data de início do contrato
      - `contract_end` (date, optional) - Data de fim do contrato
      - `payment_frequency` (text, required) - Frequência de pagamento
      - `contract_file_url` (text, optional) - URL do arquivo do contrato
      - `is_active` (boolean, default true) - Se o contrato está ativo
      - `auto_renewal` (boolean, default false) - Renovação automática
      - `cancellation_reason` (text, optional) - Motivo do cancelamento
      - `cancelled_at` (timestamptz, optional) - Data do cancelamento
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `supplier_contracts` table
    - Add policy for admin to manage all supplier contracts
    - Add indexes for performance optimization

  3. Constraints
    - Check constraints for contract_type and payment_frequency
    - Positive value constraint for monthly_value
*/

-- Create supplier_contracts table
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
  is_active boolean DEFAULT true NOT NULL,
  auto_renewal boolean DEFAULT false NOT NULL,
  cancellation_reason text,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add check constraints
ALTER TABLE supplier_contracts 
ADD CONSTRAINT supplier_contracts_contract_type_check 
CHECK (contract_type = ANY (ARRAY[
  'tecnologia'::text, 
  'marketing'::text, 
  'operacional'::text, 
  'juridico'::text, 
  'contabil'::text, 
  'consultoria'::text, 
  'infraestrutura'::text, 
  'outros'::text
]));

ALTER TABLE supplier_contracts 
ADD CONSTRAINT supplier_contracts_payment_frequency_check 
CHECK (payment_frequency = ANY (ARRAY[
  'monthly'::text, 
  'quarterly'::text, 
  'semiannual'::text, 
  'annual'::text
]));

ALTER TABLE supplier_contracts 
ADD CONSTRAINT supplier_contracts_monthly_value_positive 
CHECK (monthly_value > 0);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_supplier_contracts_is_active ON supplier_contracts(is_active);
CREATE INDEX IF NOT EXISTS idx_supplier_contracts_contract_type ON supplier_contracts(contract_type);
CREATE INDEX IF NOT EXISTS idx_supplier_contracts_created_at ON supplier_contracts(created_at);
CREATE INDEX IF NOT EXISTS idx_supplier_contracts_contract_start ON supplier_contracts(contract_start);

-- Enable Row Level Security
ALTER TABLE supplier_contracts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin pode gerenciar contratos de fornecedores"
  ON supplier_contracts
  FOR ALL
  TO authenticated
  USING ((jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text)
  WITH CHECK ((jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text);

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

-- Create storage bucket for supplier contract files
INSERT INTO storage.buckets (id, name, public)
VALUES ('supplier-contracts', 'supplier-contracts', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Admin can upload supplier contract files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'supplier-contracts' AND
    (jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text
  );

CREATE POLICY "Admin can view supplier contract files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'supplier-contracts' AND
    (jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text
  );

CREATE POLICY "Public can view supplier contract files"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'supplier-contracts');