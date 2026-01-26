-- 0037_reset_all_view_counts.sql
--
-- Reset view counts for all content types to zero

UPDATE dev_logs SET views = 0;
UPDATE music_posts SET views = 0;
UPDATE events SET views = 0;
UPDATE projects SET views = 0;
UPDATE posts SET views = 0;
UPDATE timeline_updates SET views = 0;
UPDATE forum_threads SET views = 0;
