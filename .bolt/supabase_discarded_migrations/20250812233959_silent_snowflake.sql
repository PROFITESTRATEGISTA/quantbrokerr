/*
  # Sistema de Status de Leads

  1. Nova Tabela
    - `lead_interactions`
      - `id` (uuid, primary key)
      - `lead_email` (text, referência ao lead)
      - `lead_source` (text, fonte do lead)
      - `status` (text, status atual)
      - `interaction_type` (text, tipo de atendimento)
      - `message_sent` (text, mensagem enviada)
      - `notes` (text, observações)
      - `contacted_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Enable RLS na tabela `lead_interactions`
    - Política para admin gerenciar interações
    - Índices para performance

  3. Constraints
    - Status válidos
    - Tipos de interação válidos
*/

-- Criar tabela de interações com leads
CREATE TABLE IF NOT EXISTS lead_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_email text NOT NULL,
  lead_source text NOT NULL CHECK (lead_source IN ('user', 'waitlist', 'consultation')),
  status text NOT NULL DEFAULT 'sem_contato' CHECK (status IN (
    'sem_contato',
    'contatado', 
    'respondeu',
    'interessado',
    'reuniao_agendada',
    'convertido',
    'nao_interessado'
  )),
  interaction_type text CHECK (interaction_type IN (
    'boas_vindas',
    'follow_up',
    'apresentacao',
    'convite_reuniao',
    'mostrar_resultados',
    'personalizada'
  )),
  message_sent text,
  notes text,
  contacted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;

-- Política para admin gerenciar interações
CREATE POLICY "Admin pode gerenciar interações de leads"
  ON lead_interactions
  FOR ALL
  TO authenticated
  USING ((jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text)
  WITH CHECK ((jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_lead_interactions_email ON lead_interactions (lead_email);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_status ON lead_interactions (status);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_source ON lead_interactions (lead_source);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_contacted_at ON lead_interactions (contacted_at);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_created_at ON lead_interactions (created_at);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION handle_lead_interactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_lead_interactions_updated_at
  BEFORE UPDATE ON lead_interactions
  FOR EACH ROW
  EXECUTE FUNCTION handle_lead_interactions_updated_at();