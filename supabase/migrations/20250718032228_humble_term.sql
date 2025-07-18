/*
  # Criar tabela de custos financeiros

  1. Nova Tabela
    - `financial_costs`
      - `id` (uuid, primary key)
      - `description` (text, descrição do custo)
      - `category` (text, categoria do custo)
      - `amount` (numeric, valor do custo)
      - `cost_date` (date, data do custo)
      - `is_recurring` (boolean, se é recorrente)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `financial_costs`
    - Adicionar política para admin gerenciar custos
    - Adicionar política para leitura pública (se necessário)
*/

CREATE TABLE IF NOT EXISTS financial_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('operacional', 'marketing', 'tecnologia', 'pessoal', 'infraestrutura', 'outros')),
  amount numeric(10,2) NOT NULL DEFAULT 0,
  cost_date date NOT NULL,
  is_recurring boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE financial_costs ENABLE ROW LEVEL SECURITY;

-- Política para admin gerenciar todos os custos
CREATE POLICY "Admin pode gerenciar custos"
  ON financial_costs
  FOR ALL
  TO authenticated
  USING (email() = 'pedropardal04@gmail.com')
  WITH CHECK (email() = 'pedropardal04@gmail.com');

-- Política para leitura pública (opcional, remova se não necessário)
CREATE POLICY "Permitir leitura pública de custos"
  ON financial_costs
  FOR SELECT
  TO public
  USING (true);

-- Trigger para updated_at
CREATE TRIGGER handle_financial_costs_updated_at
  BEFORE UPDATE ON financial_costs
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();