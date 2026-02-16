-- 0077_add_notify_conversation_updates.sql
-- Pref for in-app notifications when someone leaves a DM or a conversation is deleted

ALTER TABLE users ADD COLUMN notify_conversation_updates_enabled INTEGER NOT NULL DEFAULT 1;
