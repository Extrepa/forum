-- 0079_add_user_names.sql
-- Optional first and last name fields for signup (see /api/auth/signup INSERT).
-- Previously shipped as 0064_add_names.sql (duplicate 0064 prefix with click_events).
-- Production rename: see docs/04-Migrations/MIGRATION_0064_NAMES_TO_0079.md

ALTER TABLE users ADD COLUMN first_name TEXT;
ALTER TABLE users ADD COLUMN last_name TEXT;
