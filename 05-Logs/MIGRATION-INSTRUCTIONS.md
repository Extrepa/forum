# Migration Instructions - View Counts

## Required Migration

**File:** `migrations/0031_add_view_counts.sql`

This migration adds view tracking to all content types.

## Migration Content

```sql
-- 0031_add_view_counts.sql
--
-- Add views tracking to all content types

ALTER TABLE dev_logs ADD COLUMN views INTEGER NOT NULL DEFAULT 0;
ALTER TABLE music_posts ADD COLUMN views INTEGER NOT NULL DEFAULT 0;
ALTER TABLE events ADD COLUMN views INTEGER NOT NULL DEFAULT 0;
ALTER TABLE projects ADD COLUMN views INTEGER NOT NULL DEFAULT 0;
ALTER TABLE posts ADD COLUMN views INTEGER NOT NULL DEFAULT 0;
ALTER TABLE timeline_updates ADD COLUMN views INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_dev_logs_views ON dev_logs(views);
CREATE INDEX IF NOT EXISTS idx_music_posts_views ON music_posts(views);
CREATE INDEX IF NOT EXISTS idx_events_views ON events(views);
CREATE INDEX IF NOT EXISTS idx_projects_views ON projects(views);
CREATE INDEX IF NOT EXISTS idx_posts_views ON posts(views);
CREATE INDEX IF NOT EXISTS idx_timeline_updates_views ON timeline_updates(views);
```

## What This Migration Does

1. **Adds `views` column** to 6 tables:
   - `dev_logs`
   - `music_posts`
   - `events`
   - `projects`
   - `posts`
   - `timeline_updates`

2. **Creates indexes** on the `views` column for performance

3. **Sets default value** to 0 for existing rows

## How to Apply Migration

### Option 1: Using Wrangler CLI (Recommended)

```bash
# Apply migration to your D1 database
npx wrangler d1 execute errl_forum_db --file=./migrations/0031_add_view_counts.sql
```

Or if you need to specify the database ID:
```bash
npx wrangler d1 execute errl_forum_db \
  --database-id=f6acc52e-a23b-4a6c-8b62-c93892e41940 \
  --file=./migrations/0031_add_view_counts.sql
```

### Option 2: Using Cloudflare Dashboard

1. Go to Cloudflare Dashboard
2. Navigate to Workers & Pages > D1
3. Select your database: `errl_forum_db`
4. Go to "Execute SQL" tab
5. Copy and paste the contents of `migrations/0031_add_view_counts.sql`
6. Click "Execute"

### Option 3: Remote Database (Production)

```bash
# For remote/production database
npx wrangler d1 execute errl_forum_db \
  --remote \
  --file=./migrations/0031_add_view_counts.sql
```

## Verify Migration Applied

After running the migration, verify it worked:

```bash
# Check if views column exists
npx wrangler d1 execute errl_forum_db \
  --command="SELECT sql FROM sqlite_master WHERE type='table' AND name='dev_logs';"
```

Or check a specific table:
```bash
npx wrangler d1 execute errl_forum_db \
  --command="PRAGMA table_info(dev_logs);"
```

You should see `views` in the column list.

## Important Notes

### Before Deploying Code
- ✅ **MUST apply migration first** before deploying the new code
- ✅ Migration is safe - uses `IF NOT EXISTS` for indexes
- ✅ Default value of 0 means existing posts start at 0 views
- ✅ No data loss - only adds columns

### Migration Safety
- Uses `IF NOT EXISTS` for indexes (won't fail if already exists)
- Uses `DEFAULT 0` so existing rows get 0 views
- No data deletion or modification
- Can be run multiple times safely (indexes only)

### Related Migrations
- **0023_thread_views.sql** - Already added views to `forum_threads` (lobby)
- **0031_add_view_counts.sql** - Adds views to all other content types

## Troubleshooting

### Error: Column already exists
If you see "duplicate column name: views", the migration was already applied. This is safe to ignore.

### Error: Table doesn't exist
Make sure you're running the migration on the correct database. Check your `wrangler.toml` for the database name.

### Error: Permission denied
Make sure you're authenticated:
```bash
npx wrangler login
```

## Next Steps After Migration

1. ✅ Verify migration applied successfully
2. ✅ Deploy code: `npm run build:cf && npm run deploy`
3. ✅ Test view tracking on a few pages
4. ✅ Verify view counts increment when visiting detail pages
