-- 0063_user_soft_delete.sql
-- Add soft-delete fields for user accounts to support admin anonymization.

ALTER TABLE users ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN deleted_at INTEGER;
ALTER TABLE users ADD COLUMN deleted_by_user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users(is_deleted);
