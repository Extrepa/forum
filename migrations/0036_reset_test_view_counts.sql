-- 0036_reset_test_view_counts.sql
--
-- Reset view counts for dev_logs and lore/memories posts
-- (used for testing, so resetting to 0)

UPDATE dev_logs SET views = 0;

UPDATE posts SET views = 0 WHERE type IN ('lore', 'memories');
