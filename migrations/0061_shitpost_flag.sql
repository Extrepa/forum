-- 0061_shitpost_flag.sql
-- Track whether a forum thread should be treated as a dedicated shitpost entry.
ALTER TABLE forum_threads ADD COLUMN is_shitpost INTEGER DEFAULT 0 NOT NULL;
