/*
  # Criar tabelas para painel financeiro

  1. Novas Tabelas
    - `client_contracts` - Contratos dos clientes
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key para user_profiles)
      - `plan_type` (text) - tipo do plano
      - `billing_period` (text) - mensal/semestral/anual
      - `monthly_value` (decimal) - valor mensal
      - `contract_start` (date) - início do contrato
      - `contract_end` (date) - fim do contrato
      - `is_active` (boolean) - contrato ativo
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `financial_costs` - Custos da empresa
      - `id` (uuid, primary key)
      - `description` (text) - descrição do custo
      - `category` (text) - categoria do custo
      - `amount` (decimal) - valor
      - `cost_date` (date) - data do custo
      - `is_recurring` (boolean) - custo recorrente
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Enable RLS em ambas as tabelas
    - Políticas para admin apenas
*/

-- Tabela de contratos dos clientes
CREATE TABLE IF NOT EXISTS client_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  plan_type text NOT NULL CHECK (plan_type IN ('bitcoin', 'mini-indice', 'mini-dolar', 'portfolio-completo')),
  billing_period text NOT NULL CHECK (billing_period IN ('monthly', 'semiannual', 'annual')),
  monthly_value decimal(10,2) NOT NULL DEFAULT 0,
  contract_start date NOT NULL,
  contract_end date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de custos financeiros
CREATE TABLE IF NOT EXISTS financial_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  category text NOT NULL,
  amount decimal(10,2) NOT NULL DEFAULT 0,
  cost_date date NOT NULL,
  is_recurring boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE client_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_costs ENABLE ROW LEVEL SECURITY;

-- Políticas para admin apenas
CREATE POLICY "Admin pode gerenciar contratos"
  ON client_contracts
  FOR ALL
  TO authenticated
  USING (email() = 'pedropardal04@gmail.com')
  WITH CHECK (email() = 'pedropardal04@gmail.com');

CREATE POLICY "Admin pode gerenciar custos"
  ON financial_costs
  FOR ALL
  TO authenticated
  USING (email() = 'pedropardal04@gmail.com')
  WITH CHECK (email() = 'pedropardal04@gmail.com');

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_client_contracts_user_id ON client_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_client_contracts_active ON client_contracts(is_active);
CREATE INDEX IF NOT EXISTS idx_client_contracts_dates ON client_contracts(contract_start, contract_end);
CREATE INDEX IF NOT EXISTS idx_financial_costs_date ON financial_costs(cost_date);
CREATE INDEX IF NOT EXISTS idx_financial_costs_category ON financial_costs(category);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_client_contracts_updated_at
  BEFORE UPDATE ON client_contracts
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_financial_costs_updated_at
  BEFORE UPDATE ON financial_costs
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();