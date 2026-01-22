# Migration Fixes - Columns Already Exist

## Issue
Several migrations are failing because the columns/tables already exist in the database. This happens when migrations were applied manually or the schema was created differently.

## Solution

Mark the failed migrations as applied in the `d1_migrations` table, then continue.

### Step 1: Mark Failed Migrations as Applied

Run these commands to mark migrations 0019 and 0020 as applied:

```bash
# Mark 0019 as applied (default_landing_page column already exists)
npx wrangler d1 execute errl_forum_db --remote --command "INSERT OR IGNORE INTO d1_migrations (name, applied_at) VALUES ('0019_user_landing_preference.sql', strftime('%s', 'now'))"

# Mark 0020 as applied (embed_style column already exists)
npx wrangler d1 execute errl_forum_db --remote --command "INSERT OR IGNORE INTO d1_migrations (name, applied_at) VALUES ('0020_music_embed_style.sql', strftime('%s', 'now'))"
```

### Step 2: Continue with Remaining Migrations

After marking the failed migrations as applied, run:

```bash
npx wrangler d1 migrations apply errl_forum_db --remote
```

This should now apply:
- ✅ 0019_user_landing_preference.sql (marked as applied)
- ✅ 0020_music_embed_style.sql (marked as applied)
- 0021_post_likes.sql
- 0022_notification_seen.sql
- 0023_thread_views.sql
- 0024_thread_read_tracking.sql
- 0025_thread_announcements.sql

### If 0022 Also Fails

If migration 0022 fails with "duplicate column name: seen_at", mark it as applied:

```bash
npx wrangler d1 execute errl_forum_db --remote --command "INSERT OR IGNORE INTO d1_migrations (name, applied_at) VALUES ('0022_notification_seen.sql', strftime('%s', 'now'))"
```

Then run `npx wrangler d1 migrations apply errl_forum_db --remote` again.

## Notes

- Migration 0021 uses `CREATE TABLE IF NOT EXISTS`, so it should be safe even if the table exists.
- Your new migrations (0023, 0024, 0025) should apply without issues.
- After all migrations are applied, you can deploy.
