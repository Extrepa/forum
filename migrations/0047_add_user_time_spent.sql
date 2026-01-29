-- 0047_add_user_time_spent.sql
-- Track time spent on the site while logged in.

ALTER TABLE users ADD COLUMN time_spent_minutes INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN time_tracking_last_seen INTEGER;
