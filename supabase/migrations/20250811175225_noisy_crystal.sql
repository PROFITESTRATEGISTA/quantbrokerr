/*
  # Create waitlist entries table

  1. New Tables
    - `waitlist_entries`
      - `id` (uuid, primary key)
      - `full_name` (text) - Customer full name
      - `email` (text) - Customer email
      - `phone` (text) - Customer phone number
      - `portfolio_type` (text) - Which portfolio they want
      - `capital_available` (text) - Available capital amount
      - `message` (text) - Optional message
      - `status` (text) - Entry status (pending, contacted, converted, cancelled)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `waitlist_entries` table
    - Add policy for admin access only
*/

-- Create waitlist_entries table
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  portfolio_type text NOT NULL,
  capital_available text,
  message text,
  status text DEFAULT 'pending' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;

-- Create policies - only admin can access waitlist entries
CREATE POLICY "Admin can manage waitlist entries"
  ON waitlist_entries
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'pedropardal04@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'pedropardal04@gmail.com');

-- Create trigger for updated_at
CREATE TRIGGER update_waitlist_entries_updated_at
  BEFORE UPDATE ON waitlist_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();