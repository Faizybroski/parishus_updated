-- Event RSVP plans (ticket tiers) for paid events
CREATE TABLE IF NOT EXISTS event_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  capacity INTEGER,              -- NULL = unlimited
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store which plan the attendee chose + a snapshot so future plan edits
-- don't retroactively change what a user paid for.
ALTER TABLE rsvps
  ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES event_plans(id),
  ADD COLUMN IF NOT EXISTS plan_snapshot JSONB;

-- Row-level security
ALTER TABLE event_plans ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated) can read active plans
CREATE POLICY "Public read active event_plans"
  ON event_plans FOR SELECT
  USING (is_active = TRUE);

-- Authenticated users can insert plans for events they created
-- (profile.id == events.creator_id)
CREATE POLICY "Creator can insert event_plans"
  ON event_plans FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_plans.event_id
        AND events.creator_id = (
          SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    )
  );

CREATE POLICY "Creator can update event_plans"
  ON event_plans FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_plans.event_id
        AND events.creator_id = (
          SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    )
  );

CREATE POLICY "Creator can delete event_plans"
  ON event_plans FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_plans.event_id
        AND events.creator_id = (
          SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    )
  );
