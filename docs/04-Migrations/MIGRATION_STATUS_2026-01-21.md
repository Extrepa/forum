# Migration Status - is_deleted Columns
**Date**: 2026-01-21  
**Purpose**: Verify all tables have `is_deleted` columns for soft deletion

## Migration Summary

### New Migration Created
**`0028_soft_delete_all_tables.sql`** - Adds `is_deleted` columns to:
- `events` table
- `music_posts` table
- `projects` table
- `dev_logs` table

### Existing Migrations Status

#### ✅ Tables with `is_deleted` in Initial Creation
- `forum_replies` - Created in `0001_init.sql` (line 54)
- `timeline_comments` - Created in `0001_init.sql` (line 30)

#### ✅ Tables with `is_deleted` in Later Migrations
- `forum_threads` - Added in `0027_forum_threads_soft_delete.sql`
- `event_comments` - Created in `0012_move_system.sql` (line 76)
- `music_comments` - Created in `0004_music.sql` (line 33)
- `project_replies` - Created in `0014_project_replies.sql` (line 11)
- `dev_log_comments` - Created in `0010_devlog.sql` (line 23)
- `project_comments` - Created in `0005_projects.sql` (line 36) [Note: projects use project_replies, not project_comments]
- `shared_posts` - Created in `0017_shared_posts.sql` (line 34)

#### ❌ Tables Missing `is_deleted` (Now Fixed in 0028)
- `events` - **Fixed in 0028**
- `music_posts` - **Fixed in 0028**
- `projects` - **Fixed in 0028**
- `dev_logs` - **Fixed in 0028**

## Code Compatibility

### Three-Level Fallback Pattern
All detail pages now use three-level fallback queries:
1. **Level 1**: Full query with `is_deleted` filter
2. **Level 2**: Simplified query with `is_deleted` filter (fallback for missing tables/columns)
3. **Level 3**: Query without `is_deleted` filter (fallback if column doesn't exist)

This ensures the application works correctly:
- ✅ **Before migration runs**: Code uses Level 3 fallback (no `is_deleted` filter)
- ✅ **After migration runs**: Code uses Level 1 query (with `is_deleted` filter)
- ✅ **During partial rollout**: Code gracefully degrades through fallback levels

## Migration Execution

### To Apply Migration
```bash
npx wrangler d1 migrations apply errl_forum_db --remote
```

### If Migration Fails with "Duplicate Column"
If the migration fails because columns already exist:
1. The application will continue to work (code has fallbacks)
2. Manually mark migration as applied:
   ```sql
   INSERT INTO d1_migrations (name, applied_at)
   VALUES ('0028_soft_delete_all_tables.sql', datetime('now'))
   ON CONFLICT(name) DO NOTHING;
   ```

### Verification
After migration, verify columns exist:
```sql
PRAGMA table_info(events);
PRAGMA table_info(music_posts);
PRAGMA table_info(projects);
PRAGMA table_info(dev_logs);
```

Look for `is_deleted` column in each table's schema.

## Indexes Created

Migration 0028 also creates indexes for query performance:
- `idx_events_is_deleted`
- `idx_music_posts_is_deleted`
- `idx_projects_is_deleted`
- `idx_dev_logs_is_deleted`

These indexes use `IF NOT EXISTS`, so they're safe to run multiple times.

## Complete Table Status

| Table | is_deleted Column | Migration | Status |
|-------|------------------|-----------|--------|
| forum_threads | ✅ Yes | 0027 | Applied |
| forum_replies | ✅ Yes | 0001 | Applied |
| events | ✅ Yes | 0028 | **NEW** |
| event_comments | ✅ Yes | 0012 | Applied |
| music_posts | ✅ Yes | 0028 | **NEW** |
| music_comments | ✅ Yes | 0004 | Applied |
| projects | ✅ Yes | 0028 | **NEW** |
| project_replies | ✅ Yes | 0014 | Applied |
| dev_logs | ✅ Yes | 0028 | **NEW** |
| dev_log_comments | ✅ Yes | 0010 | Applied |

## Notes

- All comment/reply tables already had `is_deleted` columns
- Only main content tables (events, music_posts, projects, dev_logs) were missing them
- Migration 0028 completes the soft delete implementation across all tables
- Application code is fully compatible with or without these columns
