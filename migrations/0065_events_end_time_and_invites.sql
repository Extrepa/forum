-- 0065_events_end_time_and_invites.sql
--
-- Adds optional event end times, attendance reopen override, and invitation tracking.

ALTER TABLE events ADD COLUMN ends_at INTEGER;
ALTER TABLE events ADD COLUMN attendance_reopened INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS event_invites (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  invited_user_id TEXT NOT NULL,
  invited_by_user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(event_id) REFERENCES events(id),
  FOREIGN KEY(invited_user_id) REFERENCES users(id),
  FOREIGN KEY(invited_by_user_id) REFERENCES users(id),
  UNIQUE(event_id, invited_user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_invites_event
  ON event_invites(event_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_event_invites_user
  ON event_invites(invited_user_id, created_at DESC);
