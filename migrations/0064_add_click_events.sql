-- 0064_add_click_events.sql
--
-- Track click interactions across the forum so admins can audit activity in System Log.

CREATE TABLE IF NOT EXISTS click_events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  username TEXT,
  path TEXT NOT NULL,
  href TEXT,
  tag_name TEXT,
  target_label TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_click_events_created_at
  ON click_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_click_events_user_id
  ON click_events(user_id);
