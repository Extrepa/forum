-- 0044_add_project_updates_enabled.sql

-- Add updates_enabled column to projects table
-- This allows project authors to opt-in to the "Project Updates" log feature.
-- Default is 0 (disabled).

ALTER TABLE projects ADD COLUMN updates_enabled INTEGER NOT NULL DEFAULT 0;
