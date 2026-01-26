-- 0039_add_user_last_seen.sql
--
-- Add last_seen column to users table to track when users are actively browsing

ALTER TABLE users ADD COLUMN last_seen INTEGER;
