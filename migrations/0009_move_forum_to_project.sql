-- 0009_move_forum_to_project.sql
--
-- Move the most recent forum thread into Projects.
--
-- Implementation detail:
-- - We keep the same ID so existing references remain stable.
-- - We "archive" the original forum thread by locking it and replacing the body with a redirect message,
--   since forum_threads does not support soft-delete and may have replies.

-- Insert the most recent forum thread into projects (if it's not already there)
INSERT INTO projects (
  id,
  author_user_id,
  title,
  description,
  status,
  github_url,
  demo_url,
  image_key,
  created_at,
  updated_at
)
SELECT
  forum_threads.id,
  forum_threads.author_user_id,
  forum_threads.title,
  forum_threads.body,
  'active',
  NULL,
  NULL,
  forum_threads.image_key,
  forum_threads.created_at,
  NULL
FROM forum_threads
WHERE NOT EXISTS (
  SELECT 1 FROM projects WHERE projects.id = forum_threads.id
)
ORDER BY forum_threads.created_at DESC
LIMIT 1;

-- Mark that same thread as "moved" in General by locking it and pointing to Projects
UPDATE forum_threads
SET
  is_locked = 1,
  title = '[Moved to Projects] ' || title,
  body = 'This post was moved to Projects: /projects/' || id,
  updated_at = (CAST(strftime('%s','now') AS INTEGER) * 1000)
WHERE id = (
  SELECT forum_threads.id
  FROM forum_threads
  ORDER BY forum_threads.created_at DESC
  LIMIT 1
);
