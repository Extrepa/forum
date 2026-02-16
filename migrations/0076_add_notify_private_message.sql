-- 0076_add_notify_private_message.sql
-- User preference to receive email/SMS for private messages.

ALTER TABLE users ADD COLUMN notify_private_message_enabled INTEGER NOT NULL DEFAULT 0;
