-- 0011_devlog_lock.sql
--
-- Add per-post locking to Dev Log (defaults unlocked).

ALTER TABLE dev_logs ADD COLUMN is_locked INTEGER NOT NULL DEFAULT 0;

