/*
  # Create lead_interactions table

  1. New Tables
    - `lead_interactions`
      - `id` (uuid, primary key)
      - `lead_email` (text, unique, not null)
      - `lead_source` (text)
      - `status` (text, default 'sem_contato')
      - `interaction_type` (text)
      - `message_sent` (text)
      - `notes` (text)
      - `contacted_at` (timestamp with time zone)
      - `created_at` (timestamp with time zone, default now())
      - `updated_at` (timestamp with time zone, default now())

  2. Security
    - Enable RLS on `lead_interactions` table
    - Add policy for admin to manage all interactions
    - Add policy for authenticated users to read interactions
*/

CREATE TABLE IF NOT EXISTS lead_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_email text UNIQUE NOT NULL,
  lead_source text,
  status text DEFAULT 'sem_contato',
  interaction_type text,
  message_sent text,
  notes text,
  contacted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;

-- Admin can manage all interactions
CREATE POLICY "Admin pode gerenciar interações de leads"
  ON lead_interactions
  FOR ALL
  TO authenticated
  USING ((jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text)
  WITH CHECK ((jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text);

-- Authenticated users can read interactions
CREATE POLICY "Usuários autenticados podem ler interações"
  ON lead_interactions
  FOR SELECT
  TO authenticated
  USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead_email ON lead_interactions(lead_email);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_status ON lead_interactions(status);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_created_at ON lead_interactions(created_at);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_lead_interactions_updated_at
  BEFORE UPDATE ON lead_interactions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();