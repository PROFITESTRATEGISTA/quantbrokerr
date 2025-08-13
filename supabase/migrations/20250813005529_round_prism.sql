/*
  # Create lead_interactions table

  1. New Tables
    - `lead_interactions`
      - `id` (uuid, primary key)
      - `lead_email` (text, unique)
      - `lead_source` (text)
      - `status` (text)
      - `interaction_type` (text)
      - `message_sent` (text)
      - `notes` (text)
      - `contacted_at` (timestamp with time zone)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `lead_interactions` table
    - Add policy for admin to manage all interactions
    - Add policy for authenticated users to insert interactions
*/

CREATE TABLE IF NOT EXISTS lead_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_email text UNIQUE NOT NULL,
  lead_source text NOT NULL,
  status text NOT NULL DEFAULT 'sem_contato',
  interaction_type text,
  message_sent text,
  notes text,
  contacted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin pode gerenciar todas as interações"
  ON lead_interactions
  FOR ALL
  TO authenticated
  USING ((jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text)
  WITH CHECK ((jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text);

CREATE POLICY "Usuários autenticados podem inserir interações"
  ON lead_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add constraints
ALTER TABLE lead_interactions 
ADD CONSTRAINT lead_interactions_status_check 
CHECK (status IN ('sem_contato', 'contatado', 'respondeu', 'interessado', 'reuniao_agendada', 'convertido', 'nao_interessado'));

ALTER TABLE lead_interactions 
ADD CONSTRAINT lead_interactions_source_check 
CHECK (lead_source IN ('user', 'waitlist', 'consultation'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lead_interactions_email ON lead_interactions(lead_email);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_status ON lead_interactions(status);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_source ON lead_interactions(lead_source);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_created_at ON lead_interactions(created_at);

-- Create trigger for updated_at
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