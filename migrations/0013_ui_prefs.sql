-- 0013_ui_prefs.sql
--
-- User UI preferences (client-facing toggles)

ALTER TABLE users ADD COLUMN ui_lore_enabled INTEGER NOT NULL DEFAULT 0;

