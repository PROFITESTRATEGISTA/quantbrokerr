/*
  # Create portfolio offers table

  1. New Tables
    - `portfolio_offers`
      - `id` (uuid, primary key)
      - `portfolio_type` (text, unique) - Type of portfolio (bitcoin, mini-indice, etc.)
      - `is_available` (boolean) - Whether portfolio is available for purchase or waitlist
      - `stripe_link` (text) - Stripe checkout link
      - `button_text` (text) - Text to display on the button
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `portfolio_offers` table
    - Add policy for public read access
    - Add policy for admin write access

  3. Initial Data
    - Insert default portfolio configurations
*/

-- Create portfolio_offers table
CREATE TABLE IF NOT EXISTS portfolio_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_type text UNIQUE NOT NULL,
  is_available boolean DEFAULT true NOT NULL,
  stripe_link text,
  button_text text NOT NULL DEFAULT 'Contratar Agora',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE portfolio_offers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read portfolio offers"
  ON portfolio_offers
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admin can manage portfolio offers"
  ON portfolio_offers
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'pedropardal04@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'pedropardal04@gmail.com');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_portfolio_offers_updated_at
  BEFORE UPDATE ON portfolio_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default portfolio configurations
INSERT INTO portfolio_offers (portfolio_type, is_available, button_text) VALUES
  ('bitcoin', false, 'Entrar na Fila de Espera'),
  ('mini-indice', true, 'Contratar Agora'),
  ('mini-dolar', true, 'Contratar Agora'),
  ('portfolio-completo', true, 'Contratar Agora')
ON CONFLICT (portfolio_type) DO NOTHING;