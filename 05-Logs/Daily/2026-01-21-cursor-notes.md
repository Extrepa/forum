## 2026-01-21 Cursor Notes

### Work summary
- Made Projects public for signed-in users (create), and owner-only for edits/updates.
- Added migration to move the latest forum thread into Projects and "archive" the original thread.
- Added new admin-only section: Dev Log (DB + API + pages + nav).

### Key changes
- **Projects permissions**
  - Create project: any authenticated user with password set.
  - Edit project / add updates: only the project author.
  - Files:
    - `src/app/api/projects/route.js`
    - `src/app/api/projects/[id]/route.js`
    - `src/app/api/projects/[id]/updates/route.js`
    - `src/app/projects/page.js`
    - `src/app/projects/ProjectsClient.js`
    - `src/app/projects/[id]/page.js`

- **Move latest forum post to Projects**
  - Migration: `migrations/0009_move_forum_to_project.sql`
  - Inserts most recent `forum_threads` row into `projects` (status='active'), then locks + rewrites the forum thread to point at `/projects/<id>`.

- **Dev Log (admin-only)**
  - Migration: `migrations/0010_devlog.sql`
  - API:
    - `src/app/api/devlog/route.js`
    - `src/app/api/devlog/[id]/route.js`
    - `src/app/api/devlog/[id]/comments/route.js`
  - Pages:
    - `src/app/devlog/page.js`
    - `src/app/devlog/DevLogClient.js`
    - `src/app/devlog/[id]/page.js`
  - Component:
    - `src/components/DevLogForm.js`
  - Nav:
    - `src/components/NavLinks.js` now accepts `isAdmin` to conditionally show Dev Log
    - `src/app/layout.js` now computes `isAdmin` server-side and passes it down

### Follow-up: Dev Log signed-in visibility + locking
- **Visibility**:
  - Dev Log is now **not public** but **readable by signed-in users**.
  - Only admins can create/edit Dev Log posts.
  - Signed-in users can comment for feedback (same posting password rules apply).
- **Per-post lock**:
  - Added `dev_logs.is_locked` (default 0/unlocked) via `migrations/0011_devlog_lock.sql`.
  - Admins can lock/unlock comments per post (new endpoint `POST /api/devlog/[id]/lock`).
  - When locked, comment form is hidden and API rejects new comments with `error=locked`.
- **Navigation**:
  - Dev Log link is shown only when signed in (not public), via `NavLinks` + `layout` passing `isSignedIn`.

### Follow-up: Forum thread locking enforced + toggle
- **Enforcement**:
  - Reply posting now checks `forum_threads.is_locked` and rejects new replies when locked (`error=locked`).
  - Thread page hides reply form when locked and shows a notice.
- **Toggle**:
  - Added `POST /api/forum/[id]/lock` for thread author (or admin) to lock/unlock replies.

### Follow-up: Dev Log prod safety + move-to-project tool + nav cleanup
- **Dev Log server error mitigation**:
  - Dev Log pages now fall back gracefully if the `dev_logs` table or `is_locked` column is not yet available (during rollout / migrations not applied).
  - Instead of a crash, the UI shows: \"Dev Log is not available yet (database updates still applying)\".
  - Note: Dev Log features still require applying migrations `0010_devlog.sql` and `0011_devlog_lock.sql` to the D1 database.
- **Move forum thread to Projects (per-thread, admin-only)**:
  - Added `POST /api/forum/[id]/move-to-project` to copy a specific forum thread into `projects` and then lock/replace the original thread content with a link to `/projects/<id>`.
  - Added a \"Move to Projects\" button on the thread page for admins.
  - This avoids relying on \"most recent thread\" migrations when a specific post needs moving.
- **Navigation**:
  - Removed \"Home\" from top nav to reduce header crowding (breadcrumbs already provide Home on inner pages).

### Admin moderation move system (move anywhere, migrate discussion, auto-redirect)
- **DB migration**: `migrations/0012_move_system.sql`
  - Adds `content_moves` canonical mapping table.
  - Adds `moved_to_*` markers to all top-level tables (forum_threads, projects, music_posts, timeline_updates, events, dev_logs).
  - Adds `event_comments` so Events can support discussion like other sections.
- **New detail pages** (so redirects work everywhere):
  - `src/app/timeline/[id]/page.js` + `src/app/api/timeline/[id]/comments/route.js`
  - `src/app/events/[id]/page.js` + `src/app/api/events/[id]/comments/route.js`
  - Timeline/Events list pages now link to these detail pages.
- **Admin API**:
  - `POST /api/admin/move` creates a destination record, migrates discussion when possible, marks the source as moved, and redirects to the destination.
- **Admin UI**:
  - `/admin/moderation` provides a centralized admin-only move tool (source URL + destination type + required fields).
- **Filtering + search**:
  - List pages, home tiles, and search now filter `moved_to_id IS NULL` so moved items disappear from the source section.
  - Search result URLs for announcements/events now deep-link to `/timeline/[id]` and `/events/[id]`.
- **Cleanup**:
  - Removed the ad-hoc public move-to-project UI/route in favor of centralized admin moderation.

### Redirect coverage (double-check)
- Timeline and Events detail pages already redirect when `moved_to_id` is set:
  - `src/app/timeline/[id]/page.js`
  - `src/app/events/[id]/page.js`
- Added the same redirect behavior to core detail pages (with rollout-safe fallbacks if columns aren’t migrated yet):
  - `src/app/forum/[id]/page.js`
  - `src/app/projects/[id]/page.js`
  - `src/app/music/[id]/page.js`
  - `src/app/devlog/[id]/page.js`

### Rollout safety (double-check)
- List/search/home queries that reference `moved_to_id` now use a **try-with-filter, fallback-without-filter** pattern so the site won’t crash if D1 migrations haven’t been applied yet.
- Once `migrations/0012_move_system.sql` is applied, moved content is hidden from source lists and old URLs redirect cleanly.

### Admin move endpoint guard (double-check)
- `POST /api/admin/move` now checks that `content_moves` exists and returns a clear JSON error (`move_system_not_migrated`) if the DB migration hasn’t been applied yet.
- `POST /api/admin/reset-users` now clears new tables (`content_moves`, `dev_logs`, `dev_log_comments`, `event_comments`) so test resets remain complete.
- `POST /api/admin/reset-users` is now tolerant of missing tables during rollout (it ignores delete errors if a table does not exist yet).

### Errl Forum Text Pack (microcopy integration)
- Reviewed current UI copy locations (header, home tiles, forum header, search, post forms).
- Next: introduce `src/lib/forum-texts/` and replace hardcoded copy with shared strings + optional time-based variants.

### Errl Forum Text Pack (verification)
- **Build**: `npm run build` succeeded (needed running outside sandbox due to EPERM kill in sandboxed build).
- **Hardcoded copy sweep**:
  - No remaining `No posts yet` / `No threads yet` / `placeholder="Search..."` / old header subtitle.
  - Remaining `Create Post` strings are only in Dev Log UI:
    - `src/app/devlog/DevLogClient.js` (admin create button)
    - `src/components/DevLogForm.js` (submit button + placeholders)
  - Note: Dev Log wasn’t part of the text pack scope; can optionally wire it to `src/lib/forum-texts/` later for consistency.
- **Lore toggle**: `NEXT_PUBLIC_ERRL_USE_LORE=true` switches header/footer/actions + easter eggs via `getForumStrings()` / `getEasterEgg()`.
- **Docs**: full pack copied into `docs/forum-texts/` (README + guides + library + json/ts examples).
- **Lints**: `next lint` prompts interactive migration in this Next.js version; build pipeline still completed successfully.

