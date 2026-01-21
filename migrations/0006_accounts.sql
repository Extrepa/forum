-- 0006_accounts.sql
--
-- Adds account credentials (email/password) on top of existing session-token auth.
-- This preserves existing users.id values so all author_user_id references remain valid.

ALTER TABLE users ADD COLUMN email TEXT;
ALTER TABLE users ADD COLUMN email_norm TEXT;
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN password_set_at INTEGER;
ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0;

-- Nullable unique: allow multiple NULLs, but enforce uniqueness when present
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_norm
  ON users(email_norm)
  WHERE email_norm IS NOT NULL;

