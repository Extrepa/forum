-- 0018_event_attendees.sql
--
-- RSVP/attendees feature for events

CREATE TABLE IF NOT EXISTS event_attendees (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(event_id) REFERENCES events(id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_attendees_event
  ON event_attendees(event_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_event_attendees_user
  ON event_attendees(user_id, created_at DESC);
