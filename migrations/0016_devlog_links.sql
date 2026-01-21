-- 0016_devlog_links.sql
--
-- Structured link fields for Development posts.

ALTER TABLE dev_logs ADD COLUMN github_url TEXT;
ALTER TABLE dev_logs ADD COLUMN demo_url TEXT;
-- Extra links (newline separated, each line a URL)
ALTER TABLE dev_logs ADD COLUMN links TEXT;

