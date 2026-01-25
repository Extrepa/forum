-- 0035_timeline_lock.sql
--
-- Add per-update locking to timeline_updates table (defaults unlocked).

ALTER TABLE timeline_updates ADD COLUMN is_locked INTEGER NOT NULL DEFAULT 0;
