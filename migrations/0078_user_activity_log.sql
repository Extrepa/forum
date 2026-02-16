-- 0078_user_activity_log.sql
-- Unified log for user activity (posts, replies) so profile recent activity and system logs use the same schema.
CREATE TABLE IF NOT EXISTS user_activity_log (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  target_title TEXT,
  section_key TEXT,
  parent_id TEXT,
  source TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_action_type ON user_activity_log(action_type);
