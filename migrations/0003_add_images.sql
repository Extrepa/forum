-- 0003_add_images.sql

ALTER TABLE timeline_updates ADD COLUMN image_key TEXT;
ALTER TABLE forum_threads ADD COLUMN image_key TEXT;
ALTER TABLE events ADD COLUMN image_key TEXT;
