/*
  # Create events table for live events management

  1. New Tables
    - `events`
      - `id` (uuid, primary key)
      - `title` (text, event title)
      - `description` (text, event description)
      - `event_date` (timestamp, when the event will happen)
      - `event_type` (text, type of event: live, webinar, presentation)
      - `platform` (text, platform: youtube, zoom, teams, etc)
      - `event_link` (text, link to join the event)
      - `is_active` (boolean, if event is active for invitations)
      - `max_participants` (integer, maximum number of participants)
      - `current_participants` (integer, current registered participants)
      - `invitation_message` (text, custom invitation message)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `events` table
    - Add policy for admin to manage events
    - Add policy for public to read active events

  3. Indexes
    - Index on event_date for performance
    - Index on is_active for filtering
    - Index on event_type for categorization
*/

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL,
  event_type text NOT NULL DEFAULT 'live',
  platform text NOT NULL DEFAULT 'youtube',
  event_link text,
  is_active boolean DEFAULT true,
  max_participants integer DEFAULT 100,
  current_participants integer DEFAULT 0,
  invitation_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Admin can manage all events
CREATE POLICY "Admin pode gerenciar eventos"
  ON events
  FOR ALL
  TO authenticated
  USING ((jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text)
  WITH CHECK ((jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text);

-- Public can read active events
CREATE POLICY "Qualquer um pode ler eventos ativos"
  ON events
  FOR SELECT
  TO public
  USING (is_active = true);

-- Add constraints
ALTER TABLE events ADD CONSTRAINT events_event_type_check 
  CHECK (event_type = ANY (ARRAY['live'::text, 'webinar'::text, 'presentation'::text, 'workshop'::text]));

ALTER TABLE events ADD CONSTRAINT events_platform_check 
  CHECK (platform = ANY (ARRAY['youtube'::text, 'zoom'::text, 'teams'::text, 'meet'::text, 'instagram'::text, 'facebook'::text]));

ALTER TABLE events ADD CONSTRAINT events_max_participants_positive 
  CHECK (max_participants > 0);

ALTER TABLE events ADD CONSTRAINT events_current_participants_positive 
  CHECK (current_participants >= 0);

-- Add indexes
CREATE INDEX idx_events_event_date ON events (event_date);
CREATE INDEX idx_events_is_active ON events (is_active);
CREATE INDEX idx_events_event_type ON events (event_type);
CREATE INDEX idx_events_created_at ON events (created_at);

-- Add trigger for updated_at
CREATE TRIGGER handle_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();