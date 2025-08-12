/*
  # Create supplier contracts table

  1. New Tables
    - `supplier_contracts`
      - `id` (uuid, primary key)
      - `supplier_name` (text, required)
      - `supplier_email` (text, required)
      - `supplier_phone` (text, optional)
      - `contract_type` (text, required)
      - `service_description` (text, required)
      - `monthly_value` (numeric, required)
      - `contract_start` (date, required)
      - `contract_end` (date, optional)
      - `payment_frequency` (text, required)
      - `contract_file_url` (text, optional)
      - `is_active` (boolean, default true)
      - `auto_renewal` (boolean, default false)
      - `cancellation_reason` (text, optional)
      - `cancelled_at` (timestamptz, optional)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

  2. Security
    - Enable RLS on `supplier_contracts` table
    - Add policy for admin access only

  3. Indexes
    - Index on supplier_email for faster lookups
    - Index on contract_start for date-based queries
    - Index on is_active for filtering active contracts
*/

-- Create the supplier_contracts table
CREATE TABLE IF NOT EXISTS supplier_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name text NOT NULL,
  supplier_email text NOT NULL,
  supplier_phone text,
  contract_type text NOT NULL,
  service_description text NOT NULL,
  monthly_value numeric(10,2) NOT NULL CHECK (monthly_value > 0),
  contract_start date NOT NULL,
  contract_end date,
  payment_frequency text NOT NULL CHECK (payment_frequency = ANY (ARRAY['monthly'::text, 'quarterly'::text, 'semiannual'::text, 'annual'::text])),
  contract_file_url text,
  is_active boolean NOT NULL DEFAULT true,
  auto_renewal boolean NOT NULL DEFAULT false,
  cancellation_reason text,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE supplier_contracts ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only
CREATE POLICY "Admin can manage supplier contracts"
  ON supplier_contracts
  FOR ALL
  TO authenticated
  USING ((jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text)
  WITH CHECK ((jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_supplier_contracts_supplier_email 
  ON supplier_contracts (supplier_email);

CREATE INDEX IF NOT EXISTS idx_supplier_contracts_contract_start 
  ON supplier_contracts (contract_start);

CREATE INDEX IF NOT EXISTS idx_supplier_contracts_is_active 
  ON supplier_contracts (is_active);

CREATE INDEX IF NOT EXISTS idx_supplier_contracts_created_at 
  ON supplier_contracts (created_at);

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION handle_supplier_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER handle_supplier_contracts_updated_at
  BEFORE UPDATE ON supplier_contracts
  FOR EACH ROW EXECUTE FUNCTION handle_supplier_contracts_updated_at();