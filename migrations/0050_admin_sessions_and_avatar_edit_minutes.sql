ALTER TABLE users ADD COLUMN avatar_edit_minutes INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN avatar_edit_last_seen INTEGER;

CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at INTEGER
);

CREATE INDEX IF NOT EXISTS admin_sessions_user_id_idx ON admin_sessions(user_id);
