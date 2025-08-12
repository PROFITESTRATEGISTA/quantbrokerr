/*
  # Create consultation_forms table

  1. New Tables
    - `consultation_forms`
      - `id` (uuid, primary key)
      - `full_name` (text, required) - Nome completo do cliente
      - `email` (text, required) - Email do cliente
      - `phone` (text, required) - Telefone do cliente
      - `preferred_time` (text, required) - Horário preferido para consultoria
      - `consultation_type` (text, required) - Tipo de consultoria solicitada
      - `capital_available` (text, optional) - Capital disponível para investimento
      - `message` (text, optional) - Mensagem adicional do cliente
      - `status` (text, default 'pending') - Status do agendamento
      - `created_at` (timestamp) - Data de criação
      - `updated_at` (timestamp) - Data de atualização

  2. Security
    - Enable RLS on `consultation_forms` table
    - Add policy for public to insert consultation forms
    - Add policy for admin to manage all consultation forms

  3. Triggers
    - Add trigger to automatically update `updated_at` field
*/

-- Create consultation_forms table
CREATE TABLE IF NOT EXISTS consultation_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  preferred_time text NOT NULL,
  consultation_type text NOT NULL DEFAULT 'results',
  capital_available text,
  message text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraints
ALTER TABLE consultation_forms 
ADD CONSTRAINT consultation_forms_status_check 
CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled'));

ALTER TABLE consultation_forms 
ADD CONSTRAINT consultation_forms_consultation_type_check 
CHECK (consultation_type IN ('results', 'strategy', 'demo'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_consultation_forms_status ON consultation_forms(status);
CREATE INDEX IF NOT EXISTS idx_consultation_forms_consultation_type ON consultation_forms(consultation_type);
CREATE INDEX IF NOT EXISTS idx_consultation_forms_created_at ON consultation_forms(created_at);

-- Enable Row Level Security
ALTER TABLE consultation_forms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Qualquer um pode inserir formulários de consultoria"
  ON consultation_forms
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admin pode gerenciar todos os formulários de consultoria"
  ON consultation_forms
  FOR ALL
  TO authenticated
  USING ((jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text)
  WITH CHECK ((jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text);

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER handle_consultation_forms_updated_at
  BEFORE UPDATE ON consultation_forms
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();