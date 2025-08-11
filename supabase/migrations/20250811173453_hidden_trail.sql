/*
  # Sistema de Fila de Espera

  1. Nova Tabela
    - `waitlist_entries`
      - `id` (uuid, primary key)
      - `full_name` (text, not null)
      - `email` (text, not null)
      - `phone` (text, not null)
      - `portfolio_type` (text, not null)
      - `capital_available` (text)
      - `message` (text)
      - `status` (text, default 'pending')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Nova Tabela
    - `portfolio_offers`
      - `id` (uuid, primary key)
      - `portfolio_type` (text, unique)
      - `is_available` (boolean, default false)
      - `stripe_link` (text)
      - `button_text` (text)
      - `updated_at` (timestamp)

  3. Segurança
    - Enable RLS em ambas as tabelas
    - Políticas para admin gerenciar
    - Política para inserção pública na waitlist
*/

-- Criar tabela de fila de espera
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  portfolio_type text NOT NULL CHECK (portfolio_type IN ('bitcoin', 'mini-indice', 'mini-dolar', 'portfolio-completo')),
  capital_available text,
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'converted', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de configuração de ofertas
CREATE TABLE IF NOT EXISTS portfolio_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_type text UNIQUE NOT NULL CHECK (portfolio_type IN ('bitcoin', 'mini-indice', 'mini-dolar', 'portfolio-completo')),
  is_available boolean DEFAULT false,
  stripe_link text,
  button_text text DEFAULT 'Contratar Agora',
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_offers ENABLE ROW LEVEL SECURITY;

-- Políticas para waitlist_entries
CREATE POLICY "Qualquer um pode se inscrever na fila"
  ON waitlist_entries
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admin pode gerenciar fila de espera"
  ON waitlist_entries
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text);

-- Políticas para portfolio_offers
CREATE POLICY "Qualquer um pode ler ofertas"
  ON portfolio_offers
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admin pode gerenciar ofertas"
  ON portfolio_offers
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text);

-- Inserir configurações iniciais das ofertas
INSERT INTO portfolio_offers (portfolio_type, is_available, stripe_link, button_text) VALUES
('bitcoin', false, '', 'Entrar na Fila de Espera'),
('mini-indice', true, 'https://buy.stripe.com/cN217HePO833c6IcNo', 'Contratar Agora'),
('mini-dolar', true, 'https://buy.stripe.com/8wM03DgXW3MNc6I3cf', 'Contratar Agora'),
('portfolio-completo', true, 'https://buy.stripe.com/7sY5kD4Hravx7XYfeK9R60O', 'Contratar Agora')
ON CONFLICT (portfolio_type) DO NOTHING;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_portfolio_type ON waitlist_entries(portfolio_type);
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_status ON waitlist_entries(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_created_at ON waitlist_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_portfolio_offers_portfolio_type ON portfolio_offers(portfolio_type);

-- Trigger para updated_at
CREATE TRIGGER handle_waitlist_entries_updated_at
  BEFORE UPDATE ON waitlist_entries
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_portfolio_offers_updated_at
  BEFORE UPDATE ON portfolio_offers
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();