# Database Schema (D1 / SQLite)

This schema supports:
- claimed usernames (no login required)
- announcements + comments
- forum threads + replies
- events list
- likes + reports

## Tables

### users
- `id` TEXT PRIMARY KEY (uuid)
- `username` TEXT NOT NULL
- `username_norm` TEXT UNIQUE NOT NULL
- `session_token` TEXT UNIQUE NOT NULL
- `role` TEXT NOT NULL DEFAULT 'user'
- `created_at` INTEGER NOT NULL  -- unix ms

### timeline_updates
- `id` TEXT PRIMARY KEY
- `author_user_id` TEXT NOT NULL REFERENCES users(id)
- `title` TEXT
- `body` TEXT NOT NULL
- `created_at` INTEGER NOT NULL
- `updated_at` INTEGER
- `is_pinned` INTEGER NOT NULL DEFAULT 0

### timeline_comments
- `id` TEXT PRIMARY KEY
- `update_id` TEXT NOT NULL REFERENCES timeline_updates(id)
- `author_user_id` TEXT NOT NULL REFERENCES users(id)
- `body` TEXT NOT NULL
- `created_at` INTEGER NOT NULL
- `updated_at` INTEGER
- `is_deleted` INTEGER NOT NULL DEFAULT 0

### forum_threads
- `id` TEXT PRIMARY KEY
- `author_user_id` TEXT NOT NULL REFERENCES users(id)
- `title` TEXT NOT NULL
- `body` TEXT NOT NULL
- `created_at` INTEGER NOT NULL
- `updated_at` INTEGER
- `is_locked` INTEGER NOT NULL DEFAULT 0
- `is_pinned` INTEGER NOT NULL DEFAULT 0

### forum_replies
- `id` TEXT PRIMARY KEY
- `thread_id` TEXT NOT NULL REFERENCES forum_threads(id)
- `author_user_id` TEXT NOT NULL REFERENCES users(id)
- `body` TEXT NOT NULL
- `created_at` INTEGER NOT NULL
- `updated_at` INTEGER
- `is_deleted` INTEGER NOT NULL DEFAULT 0

### events
- `id` TEXT PRIMARY KEY
- `author_user_id` TEXT NOT NULL REFERENCES users(id)
- `title` TEXT NOT NULL
- `details` TEXT
- `starts_at` INTEGER NOT NULL
- `created_at` INTEGER NOT NULL

### likes
- `id` TEXT PRIMARY KEY
- `user_id` TEXT NOT NULL REFERENCES users(id)
- `target_type` TEXT NOT NULL -- ('timeline_update'|'timeline_comment'|'thread'|'reply')
- `target_id` TEXT NOT NULL
- `created_at` INTEGER NOT NULL
- UNIQUE(user_id, target_type, target_id)

### reports
- `id` TEXT PRIMARY KEY
- `user_id` TEXT NOT NULL REFERENCES users(id)
- `target_type` TEXT NOT NULL
- `target_id` TEXT NOT NULL
- `reason` TEXT
- `created_at` INTEGER NOT NULL
- `status` TEXT NOT NULL DEFAULT 'open' -- ('open'|'resolved'|'dismissed')

## Indexes (Recommended)
- forum_threads: index on created_at
- forum_replies: index on thread_id, created_at
- timeline_updates: index on created_at
- timeline_comments: index on update_id, created_at
- events: index on starts_at
- reports: index on status, created_at

## Migration Strategy
Use `/migrations` folder with numbered SQL files:
- `0001_init.sql` (tables)
- `0002_indexes.sql` (indexes)

Apply:
- `npx wrangler d1 migrations apply errl_forum_db --local`
- `npx wrangler d1 migrations apply errl_forum_db`
