/*
  # Create events table

  1. New Tables
    - `events`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text, optional)
      - `event_date` (timestamp, required)
      - `event_type` (text, required)
      - `platform` (text, required)
      - `event_link` (text, optional)
      - `is_active` (boolean, default true)
      - `max_participants` (integer, default 100)
      - `current_participants` (integer, default 0)
      - `invitation_message` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `events` table
    - Add policy for public to read active events
    - Add policy for admin to manage all events

  3. Constraints
    - Valid event types: live, webinar, presentation, workshop
    - Valid platforms: youtube, zoom, teams, meet, instagram, facebook
    - Max participants must be positive
    - Current participants cannot exceed max participants
*/

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL,
  event_type text NOT NULL DEFAULT 'live',
  platform text NOT NULL DEFAULT 'youtube',
  event_link text,
  is_active boolean NOT NULL DEFAULT true,
  max_participants integer NOT NULL DEFAULT 100,
  current_participants integer NOT NULL DEFAULT 0,
  invitation_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraints
ALTER TABLE events 
ADD CONSTRAINT events_event_type_check 
CHECK (event_type IN ('live', 'webinar', 'presentation', 'workshop'));

ALTER TABLE events 
ADD CONSTRAINT events_platform_check 
CHECK (platform IN ('youtube', 'zoom', 'teams', 'meet', 'instagram', 'facebook'));

ALTER TABLE events 
ADD CONSTRAINT events_max_participants_positive 
CHECK (max_participants > 0);

ALTER TABLE events 
ADD CONSTRAINT events_current_participants_valid 
CHECK (current_participants >= 0 AND current_participants <= max_participants);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_platform ON events(platform);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read active events"
  ON events
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admin can manage events"
  ON events
  FOR ALL
  TO authenticated
  USING ((jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text)
  WITH CHECK ((jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text);

-- Create updated_at trigger
CREATE TRIGGER handle_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();