/*
  # Create consultation_forms table

  1. New Tables
    - `consultation_forms`
      - `id` (uuid, primary key)
      - `full_name` (text, required)
      - `email` (text, required)
      - `phone` (text, required)
      - `preferred_time` (text, required)
      - `consultation_type` (text, default 'results')
      - `capital_available` (text, optional)
      - `message` (text, optional)
      - `status` (text, default 'pending')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `consultation_forms` table
    - Add policy for admin to manage all forms
    - Add policy for public to insert new forms

  3. Performance
    - Add indexes for common queries
    - Add trigger for automatic updated_at
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
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add constraints
ALTER TABLE consultation_forms 
ADD CONSTRAINT consultation_forms_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'contacted'::text, 'scheduled'::text, 'completed'::text, 'cancelled'::text]));

ALTER TABLE consultation_forms 
ADD CONSTRAINT consultation_forms_consultation_type_check 
CHECK (consultation_type = ANY (ARRAY['results'::text, 'strategy'::text, 'demo'::text, 'general'::text]));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_consultation_forms_email ON consultation_forms (email);
CREATE INDEX IF NOT EXISTS idx_consultation_forms_status ON consultation_forms (status);
CREATE INDEX IF NOT EXISTS idx_consultation_forms_consultation_type ON consultation_forms (consultation_type);
CREATE INDEX IF NOT EXISTS idx_consultation_forms_created_at ON consultation_forms (created_at);

-- Enable Row Level Security
ALTER TABLE consultation_forms ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin pode gerenciar formulários de consultoria"
  ON consultation_forms
  FOR ALL
  TO authenticated
  USING ((jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text)
  WITH CHECK ((jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text);

CREATE POLICY "Qualquer um pode inserir formulários de consultoria"
  ON consultation_forms
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION handle_consultation_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_consultation_forms_updated_at
  BEFORE UPDATE ON consultation_forms
  FOR EACH ROW
  EXECUTE FUNCTION handle_consultation_forms_updated_at();