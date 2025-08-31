/*
  # Create plan configurations table for admin management

  1. New Tables
    - `plan_configurations`
      - `id` (uuid, primary key)
      - `plan_id` (text, unique) - Internal plan identifier
      - `plan_name` (text) - Display name of the plan
      - `description` (text) - Plan description
      - `monthly_price` (numeric) - Monthly price
      - `semiannual_price` (numeric) - Semiannual price
      - `annual_price` (numeric) - Annual price
      - `original_monthly_price` (numeric) - Original monthly price (for strikethrough)
      - `original_semiannual_price` (numeric) - Original semiannual price
      - `original_annual_price` (numeric) - Original annual price
      - `min_capital` (text) - Minimum capital requirement
      - `daily_risk` (text) - Daily risk range
      - `leverage` (text) - Leverage information
      - `risk_control` (text) - Risk control description
      - `features` (jsonb) - Array of plan features
      - `is_recommended` (boolean) - Whether plan is recommended
      - `is_visible` (boolean) - Whether plan is visible on site
      - `is_available` (boolean) - Whether plan is available for purchase
      - `stripe_link_monthly` (text) - Stripe link for monthly billing
      - `stripe_link_semiannual` (text) - Stripe link for semiannual billing
      - `stripe_link_annual` (text) - Stripe link for annual billing
      - `asaas_link_monthly` (text) - Asaas link for monthly billing
      - `asaas_link_semiannual` (text) - Asaas link for semiannual billing
      - `asaas_link_annual` (text) - Asaas link for annual billing
      - `display_order` (integer) - Order for displaying plans
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `plan_configurations` table
    - Add policy for public read access
    - Add policy for admin write access

  3. Initial Data
    - Insert current plan configurations
*/

CREATE TABLE IF NOT EXISTS plan_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id text UNIQUE NOT NULL,
  plan_name text NOT NULL,
  description text NOT NULL,
  monthly_price numeric(10,2) NOT NULL,
  semiannual_price numeric(10,2) NOT NULL,
  annual_price numeric(10,2) NOT NULL,
  original_monthly_price numeric(10,2),
  original_semiannual_price numeric(10,2),
  original_annual_price numeric(10,2),
  min_capital text NOT NULL,
  daily_risk text NOT NULL,
  leverage text NOT NULL,
  risk_control text NOT NULL,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_recommended boolean DEFAULT false,
  is_visible boolean DEFAULT true,
  is_available boolean DEFAULT true,
  stripe_link_monthly text,
  stripe_link_semiannual text,
  stripe_link_annual text,
  asaas_link_monthly text,
  asaas_link_semiannual text,
  asaas_link_annual text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE plan_configurations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read plan configurations"
  ON plan_configurations
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admin can manage plan configurations"
  ON plan_configurations
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text);

-- Create trigger for updated_at
CREATE TRIGGER handle_plan_configurations_updated_at
  BEFORE UPDATE ON plan_configurations
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Insert initial plan configurations
INSERT INTO plan_configurations (
  plan_id, plan_name, description, 
  monthly_price, semiannual_price, annual_price,
  original_monthly_price, original_semiannual_price, original_annual_price,
  min_capital, daily_risk, leverage, risk_control,
  features, is_recommended, is_visible, is_available,
  asaas_link_monthly, asaas_link_semiannual, asaas_link_annual,
  display_order
) VALUES
(
  'bitcoin',
  'Portfólio Bitcoin',
  'Operações com Bitcoin Futuro na B3 via Mosaico BTG',
  300.00, 1440.00, 2160.00,
  429.00, 1800.00, 3600.00,
  'R$ 3.000', 'R$ 400 a R$ 600', 'Até 1x', 'IA no Controle de Risco',
  '["Copy premium com baixo spread", "Portfólio inteligente com saídas e stops dinâmicos", "Operações via MetaTrader 5", "Copy Bitcoin", "Planos semestral e anual apenas no PIX", "DARFs automatizadas GRÁTIS", "Acesso à Plataforma Quant (2000 tokens)", "Pack de Robôs GRÁTIS"]'::jsonb,
  false, true, false,
  null, null, null,
  1
),
(
  'mini-indice',
  'Portfólio Mini Índice',
  'Ideal para operar com risco controlado e consistência',
  400.00, 1920.00, 2880.00,
  571.00, 2400.00, 4800.00,
  'R$ 5.000', 'R$ 400 a R$ 600', 'Até 1x', 'IA no Controle de Risco',
  '["Copy premium com baixo spread", "Portfólio inteligente com saídas e stops dinâmicos", "Operações via MetaTrader 5", "Copy Mini Índice", "Planos semestral e anual apenas no PIX", "DARFs automatizadas GRÁTIS", "Acesso à Plataforma Quant (2000 tokens)", "Pack de Robôs GRÁTIS"]'::jsonb,
  true, true, true,
  'https://www.asaas.com/c/xbfb1ehxgyt90ort', 'https://www.asaas.com/c/gqvtfal7d61hceox', 'https://www.asaas.com/c/k4y1y8nyrszplydc',
  2
),
(
  'mini-dolar',
  'Portfólio Mini Dólar',
  'Projetado para aproveitar movimentos explosivos do dólar',
  550.00, 2640.00, 3960.00,
  786.00, 3300.00, 6600.00,
  'R$ 10.000', 'R$ 400 a R$ 600', 'Até 1x', 'IA no Controle de Risco',
  '["Copy premium com baixo spread", "Portfólio inteligente com saídas e stops dinâmicos", "Operações via MetaTrader 5", "Copy Mini Dólar", "Planos semestral e anual apenas no PIX", "DARFs automatizadas GRÁTIS", "Acesso à Plataforma Quant (2000 tokens)", "Pack de Robôs GRÁTIS"]'::jsonb,
  false, true, true,
  'https://www.asaas.com/c/nkwungjievdsugf8', 'https://www.asaas.com/c/7vjo2ztulu31a1bf', 'https://www.asaas.com/c/7jczq71q2b3jl86n',
  3
),
(
  'portfolio-completo',
  'Portfólio Completo',
  'Acesso a todas as estratégias com gestão diversificada + Bitcoin BÔNUS',
  750.00, 3600.00, 5400.00,
  1071.00, 4500.00, 9000.00,
  'R$ 15.000', 'R$ 400 a R$ 800', 'Até 1x', 'IA no Controle de Risco',
  '["Copy premium com baixo spread", "Portfólio inteligente com saídas e stops dinâmicos", "Operações via MetaTrader 5", "Copy de todas as estratégias + Bitcoin BÔNUS", "Planos semestral e anual apenas no PIX", "DARFs automatizadas GRÁTIS", "Acesso à Plataforma Quant (2000 tokens)", "Pack de Robôs GRÁTIS"]'::jsonb,
  true, true, true,
  'https://www.asaas.com/c/nzm53d1loayb64l4', 'https://www.asaas.com/c/5kbvy19u5ptvagos', 'https://www.asaas.com/c/18tvrzgpgeswrkqc',
  4
)
ON CONFLICT (plan_id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_plan_configurations_plan_id ON plan_configurations(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_configurations_is_visible ON plan_configurations(is_visible);
CREATE INDEX IF NOT EXISTS idx_plan_configurations_is_available ON plan_configurations(is_available);
CREATE INDEX IF NOT EXISTS idx_plan_configurations_display_order ON plan_configurations(display_order);