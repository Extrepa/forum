# Deploy Prep: Likes, Pins, Admin UI (2026-01-30)

## Overview

This branch adds: Like buttons on comments/replies, pinning across sections, admin audit fields, admin reply notifications, and admin posts API. **3 new migrations (0051, 0052, 0053) must be applied to remote D1 before deploy preview.**

**Status**: Migrations applied to **local** D1 successfully. Remote requires `npx wrangler login` + run from your terminal.

---

## Quick Start

```bash
# 1. Apply migrations to remote D1 (from your terminal, with wrangler auth)
npx wrangler d1 migrations apply errl_forum_db --remote

# 2. Deploy preview
./deploy.sh --preview "Likes on comments, pins everywhere, admin UI prep"
```

---

## Step 1: Apply Migrations (REQUIRED)

Run these **before** deploy preview. Migrations apply to the same D1 database used by preview and production.

### Migrations to apply (in order)

| # | File | Purpose |
|---|------|---------|
| 0051 | `migrations/0051_add_pins.sql` | Adds `is_pinned` to posts, events, music_posts, projects, dev_logs |
| 0052 | `migrations/0052_add_admin_audit_fields.sql` | Adds `edited_at`, `updated_by_user_id` to all content tables |
| 0053 | `migrations/0053_add_admin_reply_prefs.sql` | Adds `notify_admin_new_reply_enabled` to users |

### Option A: Apply all pending migrations (recommended)

```bash
npx wrangler d1 migrations apply errl_forum_db --remote
```

This applies any migrations not yet in `d1_migrations`.

### Option B: Apply each migration manually

```bash
# 0051
npx wrangler d1 execute errl_forum_db --remote --file=./migrations/0051_add_pins.sql

# 0052
npx wrangler d1 execute errl_forum_db --remote --file=./migrations/0052_add_admin_audit_fields.sql

# 0053
npx wrangler d1 execute errl_forum_db --remote --file=./migrations/0053_add_admin_reply_prefs.sql
```

### Troubleshooting

- **"duplicate column name"**: Migration already applied. Safe to ignore.
- **"not authorized" / code 7403**: Run `npx wrangler login` and run migrations from your own terminal (Cloudflare auth required for remote).
- **Local testing**: `npx wrangler d1 migrations apply errl_forum_db --local` — already run; local D1 has all migrations.

---

## Step 2: Deploy Preview

Once migrations are applied:

```bash
./deploy.sh --preview "Likes on comments, pins everywhere, admin UI prep"
```

This will:

1. Verify build passes
2. Commit and push changes
3. Build Cloudflare worker (`npm run build:cf`)
4. Deploy to preview: `https://errl-portal-forum-preview.extrepatho.workers.dev`

---

## Step 3: Post-Deploy Verification

- [ ] **Likes on comments**: Lobby, announcements, events, projects, devlog, music, art/bugs/rant/lore/memories/nostalgia — each comment shows Like + Delete
- [ ] **Pinning**: Pinned items appear first on list pages (announcements, events, music, projects, devlog, lore, etc.); pin icon shown
- [ ] **Admin**: Account > Admin Notifications — "New forum replies" checkbox appears for admins
- [ ] **Existing**: Delete, reply, like-on-posts unchanged

---

## Rollout Safety

- **Queries**: Use `COALESCE(is_pinned, 0)` so missing column won’t crash
- **Auth**: Fallbacks handle missing `notify_admin_new_reply_enabled`
- **Likes API**: New comment types added; existing types unchanged

---

## Files Changed (Summary)

| Category | Count |
|----------|-------|
| Migrations | 3 |
| Components | 4 (DeleteCommentButton, LikeButton, globals.css, + comment renderers) |
| Pages (comment + list) | ~25 |
| API routes | 5 (likes, admin/posts, admin/posts/[id], admin/posts/[id]/pin, forum replies) |
| Auth/prefs | 4 |
