-- 0068_add_notify_new_content_sections.sql
-- Granular "new forum threads" / new content: which thread types and sections to notify on.
-- JSON object: { "lobby_general": true, "lobby_shitposts": false, "art": true, ... }

ALTER TABLE users ADD COLUMN notify_new_content_sections TEXT NOT NULL DEFAULT '{}';
