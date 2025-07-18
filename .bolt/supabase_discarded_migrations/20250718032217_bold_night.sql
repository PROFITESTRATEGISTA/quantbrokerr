/*
  # Criar tabela de contratos de clientes

  1. Nova Tabela
    - `client_contracts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key para user_profiles)
      - `plan_type` (text, tipo do plano)
      - `billing_period` (text, modalidade de cobrança)
      - `monthly_value` (numeric, valor mensal)
      - `contract_start` (date, início do contrato)
      - `contract_end` (date, fim do contrato)
      - `is_active` (boolean, status do contrato)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `client_contracts`
    - Adicionar política para admin gerenciar contratos
    - Adicionar política para leitura pública (se necessário)

  3. Relacionamentos
    - Foreign key para `user_profiles(id)`
*/

CREATE TABLE IF NOT EXISTS client_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('bitcoin', 'mini-indice', 'mini-dolar', 'portfolio-completo')),
  billing_period text NOT NULL CHECK (billing_period IN ('monthly', 'semiannual', 'annual')),
  monthly_value numeric(10,2) NOT NULL DEFAULT 0,
  contract_start date NOT NULL,
  contract_end date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Adicionar foreign key para user_profiles
ALTER TABLE client_contracts 
ADD CONSTRAINT fk_client_contracts_user_id 
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Habilitar RLS
ALTER TABLE client_contracts ENABLE ROW LEVEL SECURITY;

-- Política para admin gerenciar todos os contratos
CREATE POLICY "Admin pode gerenciar contratos"
  ON client_contracts
  FOR ALL
  TO authenticated
  USING (email() = 'pedropardal04@gmail.com')
  WITH CHECK (email() = 'pedropardal04@gmail.com');

-- Política para leitura pública (opcional, remova se não necessário)
CREATE POLICY "Permitir leitura pública de contratos"
  ON client_contracts
  FOR SELECT
  TO public
  USING (true);

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
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();