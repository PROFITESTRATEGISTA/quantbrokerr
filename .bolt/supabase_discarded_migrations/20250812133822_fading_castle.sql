/*
  # Create consultation_forms table

  1. New Tables
    - `consultation_forms`
      - `id` (uuid, primary key)
      - `full_name` (text, required)
      - `email` (text, required)
      - `phone` (text, required)
      - `preferred_time` (text, required)
      - `consultation_type` (text, required, constrained values)
      - `capital_available` (text, optional)
      - `message` (text, optional)
      - `status` (text, default 'pending', constrained values)
      - `created_at` (timestamp with time zone, default now())
      - `updated_at` (timestamp with time zone, default now())

  2. Security
    - Enable RLS on `consultation_forms` table
    - Add policy for admin to manage all consultation forms
    - Add policy for public to insert consultation forms

  3. Indexes
    - Index on status for filtering
    - Index on consultation_type for filtering
    - Index on created_at for ordering

  4. Triggers
    - Auto-update updated_at timestamp on row updates
*/

-- Create consultation_forms table
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
ADD CONSTRAINT consultation_forms_consultation_type_check 
CHECK (consultation_type = ANY (ARRAY['results'::text, 'strategy'::text, 'demo'::text]));

ALTER TABLE consultation_forms 
ADD CONSTRAINT consultation_forms_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'scheduled'::text, 'completed'::text, 'cancelled'::text]));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_consultation_forms_status ON consultation_forms (status);
CREATE INDEX IF NOT EXISTS idx_consultation_forms_consultation_type ON consultation_forms (consultation_type);
CREATE INDEX IF NOT EXISTS idx_consultation_forms_created_at ON consultation_forms (created_at);

-- Enable RLS
ALTER TABLE consultation_forms ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can manage consultation forms"
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

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_consultation_forms_updated_at
  BEFORE UPDATE ON consultation_forms
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();