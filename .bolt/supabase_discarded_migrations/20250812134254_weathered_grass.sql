/*
  # Create consultation_forms table

  1. New Tables
    - `consultation_forms`
      - `id` (uuid, primary key)
      - `full_name` (text, required)
      - `email` (text, required)
      - `phone` (text, required)
      - `preferred_time` (text, required)
      - `consultation_type` (text, required)
      - `capital_available` (text, optional)
      - `message` (text, optional)
      - `status` (text, default 'pending')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `consultation_forms` table
    - Add policy for admin to manage all consultation forms
    - Add policy for public to insert new forms

  3. Constraints
    - Check constraints for status and consultation_type values
    - Indexes for better performance
    - Trigger to auto-update updated_at field
*/

CREATE TABLE IF NOT EXISTS consultation_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  preferred_time text NOT NULL,
  consultation_type text NOT NULL,
  capital_available text,
  message text,
  status text DEFAULT 'pending' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add constraints
ALTER TABLE consultation_forms 
ADD CONSTRAINT consultation_forms_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'scheduled'::text, 'completed'::text, 'cancelled'::text]));

ALTER TABLE consultation_forms 
ADD CONSTRAINT consultation_forms_consultation_type_check 
CHECK (consultation_type = ANY (ARRAY['results'::text, 'strategy'::text, 'demo'::text]));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_consultation_forms_status ON consultation_forms(status);
CREATE INDEX IF NOT EXISTS idx_consultation_forms_consultation_type ON consultation_forms(consultation_type);
CREATE INDEX IF NOT EXISTS idx_consultation_forms_created_at ON consultation_forms(created_at);

-- Enable RLS
ALTER TABLE consultation_forms ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can manage all consultation forms"
  ON consultation_forms
  FOR ALL
  TO authenticated
  USING ((jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text)
  WITH CHECK ((jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text);

CREATE POLICY "Anyone can insert consultation forms"
  ON consultation_forms
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER handle_consultation_forms_updated_at
  BEFORE UPDATE ON consultation_forms
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();