/*
  # Criar tabela financial_costs

  1. Nova Tabela
    - `financial_costs`
      - `id` (uuid, primary key)
      - `description` (text, not null)
      - `category` (text, not null)
      - `amount` (numeric, not null)
      - `cost_date` (date, not null)
      - `is_recurring` (boolean, default false)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Segurança
    - Enable RLS na tabela `financial_costs`
    - Adicionar política para admin gerenciar custos

  3. Validações
    - Constraint para categorias válidas
    - Constraint para valores positivos

  4. Índices
    - Índice na coluna cost_date
    - Índice na coluna category
    - Índice na coluna is_recurring
*/

-- Criar tabela financial_costs
CREATE TABLE IF NOT EXISTS financial_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  category text NOT NULL,
  amount numeric(10,2) NOT NULL,
  cost_date date NOT NULL,
  is_recurring boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Adicionar constraints
ALTER TABLE financial_costs 
ADD CONSTRAINT financial_costs_category_check 
CHECK (category IN ('operacional', 'marketing', 'tecnologia', 'pessoal', 'infraestrutura', 'outros'));

ALTER TABLE financial_costs 
ADD CONSTRAINT financial_costs_amount_positive 
CHECK (amount > 0);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_financial_costs_cost_date ON financial_costs(cost_date);
CREATE INDEX IF NOT EXISTS idx_financial_costs_category ON financial_costs(category);
CREATE INDEX IF NOT EXISTS idx_financial_costs_is_recurring ON financial_costs(is_recurring);
CREATE INDEX IF NOT EXISTS idx_financial_costs_created_at ON financial_costs(created_at);

-- Habilitar RLS
ALTER TABLE financial_costs ENABLE ROW LEVEL SECURITY;

-- Política para admin gerenciar custos
CREATE POLICY "Admin pode gerenciar custos financeiros"
  ON financial_costs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'pedropardal04@gmail.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'pedropardal04@gmail.com'
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_financial_costs_updated_at
  BEFORE UPDATE ON financial_costs
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();