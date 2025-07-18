/*
  # Criar tabela financial_costs

  1. Nova Tabela
    - `financial_costs`
      - `id` (uuid, primary key)
      - `description` (text, descrição do custo)
      - `category` (text, categoria do custo)
      - `amount` (numeric, valor do custo)
      - `cost_date` (date, data do custo)
      - `is_recurring` (boolean, se é recorrente)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Segurança
    - Habilitar RLS na tabela `financial_costs`
    - Adicionar política para admin gerenciar custos
    - Adicionar constraint para categorias válidas

  3. Triggers
    - Auto-update do campo updated_at
*/

-- Criar tabela financial_costs
CREATE TABLE IF NOT EXISTS financial_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  category text NOT NULL DEFAULT 'operacional',
  amount numeric(10,2) NOT NULL DEFAULT 0,
  cost_date date NOT NULL DEFAULT CURRENT_DATE,
  is_recurring boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Adicionar constraint para categorias válidas
ALTER TABLE financial_costs 
ADD CONSTRAINT financial_costs_category_check 
CHECK (category IN ('operacional', 'marketing', 'tecnologia', 'pessoal', 'infraestrutura', 'outros'));

-- Adicionar constraint para valor positivo
ALTER TABLE financial_costs 
ADD CONSTRAINT financial_costs_amount_check 
CHECK (amount >= 0);

-- Habilitar RLS
ALTER TABLE financial_costs ENABLE ROW LEVEL SECURITY;

-- Política para admin gerenciar custos
CREATE POLICY "Admin pode gerenciar custos financeiros"
  ON financial_costs
  FOR ALL
  TO authenticated
  USING (email() = 'pedropardal04@gmail.com'::text)
  WITH CHECK (email() = 'pedropardal04@gmail.com'::text);

-- Trigger para auto-update do updated_at
CREATE TRIGGER handle_financial_costs_updated_at
  BEFORE UPDATE ON financial_costs
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_financial_costs_cost_date ON financial_costs(cost_date);
CREATE INDEX IF NOT EXISTS idx_financial_costs_category ON financial_costs(category);
CREATE INDEX IF NOT EXISTS idx_financial_costs_is_recurring ON financial_costs(is_recurring);