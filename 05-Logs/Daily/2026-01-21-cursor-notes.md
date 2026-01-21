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

### Verification (post-push)
- **Git**: working tree clean; `main` is up to date with `origin/main`.
- **Build**: `npm run build` succeeds (includes new routes like `/admin/moderation`, `/timeline/[id]`, `/events/[id]`).
- **Text pack fit**:
  - `src/app/page.js` still uses text pack strings + time-based greeting, and now safely filters moved items when the migration is present.
  - Timeline/Events list pages now link titles to their new detail pages (`/timeline/[id]`, `/events/[id]`).
  - Copy consistency pass: aligned create CTA + modal titles + submit labels in Timeline/Events/Music/Projects (and Dev Log create button now matches its modal title).

### Errl Forum Text Pack (verification)
- **Build**: `npm run build` succeeded (needed running outside sandbox due to EPERM kill in sandboxed build).
- **Hardcoded copy sweep**:
  - No remaining `No posts yet` / `No threads yet` / `placeholder="Search..."` / old header subtitle.
  - Remaining `Create Post` strings are only in Dev Log form UI:
    - `src/components/DevLogForm.js` (submit button + placeholders)
  - Note: Dev Log wasn’t part of the text pack scope; can optionally wire it to `src/lib/forum-texts/` later for consistency.
- **Lore toggle**: `NEXT_PUBLIC_ERRL_USE_LORE=true` switches header/footer/actions + easter eggs via `getForumStrings()` / `getEasterEgg()`.
- **Docs**: full pack copied into `docs/forum-texts/` (README + guides + library + json/ts examples).
- **Lints**: `next lint` prompts interactive migration in this Next.js version; build pipeline still completed successfully.

### Errl naming + URL restructure (Feed/Lobby/Announcements)
- **New routes**:
  - `/feed` (cross-section activity stream)
  - `/announcements` + `/announcements/[id]` (official posts; uses existing Timeline APIs)
  - `/lobby` + `/lobby/[id]` (replaces `/forum`; uses existing Forum APIs)
- **Redirects**:
  - `/timeline` → `/feed`
  - `/timeline/[id]` → `/announcements/[id]`
  - `/forum` → `/lobby`
  - `/forum/[id]` → `/lobby/[id]`
- **Internal links updated**:
  - Nav links + home tiles + “Latest” deep-links
  - Search results URLs
  - Notifications menu + outbound reply links
  - Admin move tool now accepts both old and new paths (forum/lobby, timeline/announcements)
- **Move system canonical URLs**:
  - Updated destination mapping for `forum_thread` → `/lobby/[id]` and `timeline_update` → `/announcements/[id]` in detail pages + admin move endpoint.
- **Feed aggregation**:
  - `/feed` merges recent Announcements, Lobby threads, Events, Music, and Projects into one chronological list.
  - Uses a rollout-safe query pattern: try `moved_to_id IS NULL`, fall back if the column isn’t migrated yet.

### Lore intensity toggle (account setting)
- **Migration**: `migrations/0013_ui_prefs.sql`
  - Adds `users.ui_lore_enabled` (default 0).
- **API**:
  - `POST /api/auth/ui-prefs` saves `ui_lore_enabled` (returns 409 with a clear error if migration isn’t applied yet).
  - `GET /api/auth/me` now returns `uiLoreEnabled`.
- **Client plumbing**:
  - Added `src/components/UiPrefsProvider.js` and wrapped app layout with it.
  - Client components now read lore mode from the provider (Nav/Search + section clients), reducing env-only mismatches.
  - `ClaimUsernameForm` gained a “Lore mode” toggle under signed-in account settings.
  - `NEXT_PUBLIC_ERRL_USE_LORE=true` still acts as a global “forced on” override (UI disables the toggle when forced).

### Verification (URL restructure + lore toggle)
- **Build**: `npm run build` succeeded (needed running outside sandbox due to EPERM kill in sandboxed build).
- **Redirect logic** (code-level check):
  - Old routes are redirect-only, new routes have full pages (`/feed`, `/announcements*`, `/lobby*`).
- **Watch-outs**:
  - Until `0013_ui_prefs.sql` is applied, lore preference stays effectively off (and saving the toggle returns a friendly 409).
  - Old links should still work via redirects, but any hardcoded external links should be updated to the new canonical routes.

### Portal polish: header + replies + copy
- **Header/back button**:
  - Removed the Back button entirely (breadcrumbs are the navigation).
  - Introduced `src/components/SiteHeader.js` so the header can react to the current path.
  - On **mobile detail pages**, header becomes **condensed** and nav collapses into a **Menu** button (popover).
  - Reduced extra vertical spacing on detail pages (`header.header--detail + main` margin tightened).
- **Copy**:
  - Replaced `"New Drip"` with `"New Post"` in `src/lib/forum-texts/strings.js`.
- **Projects replies (forum-style)**:
  - Migration: `migrations/0014_project_replies.sql` adds `project_replies` with `reply_to_id` for one-level threading.
  - API: `POST /api/projects/[id]/replies`.
  - UI: `src/app/projects/[id]/page.js` now shows **Replies** (nested one level) with a Reply link that pre-fills a quote and sets `reply_to_id`.
- **Dev Log replies (threaded)**:
  - Migration: `migrations/0015_devlog_threaded_replies.sql` adds `reply_to_id` to `dev_log_comments`.
  - API: `POST /api/devlog/[id]/comments` now accepts `reply_to_id` and enforces one-level threading.
  - UI: `src/app/devlog/[id]/page.js` now shows **Replies** with one-level nesting + quote-prefill Reply links.
  - Updated “db unavailable” messaging on `/devlog` + `/devlog/[id]` to explicitly mention applying migrations (`0010_devlog.sql`, `0011_devlog_lock.sql`).

### Verification (portal polish)
- **Build**: `npm run build` succeeded (needed running outside sandbox due to EPERM kill in sandboxed build).

### Double-check notes (portal polish)
- **Header density**:
  - Mobile detail pages now avoid rendering the full 2-column nav grid; the Menu popover keeps the header short so content is immediately visible.
  - Breadcrumbs remain the primary “where am I” UI; removing Back button reduces header noise.
- **Padding sanity**:
  - Removed accidental double-styling on reply items (they now render as `list-item` only, with child indentation via `.reply-children`).
- **Rollout safety**:
  - Dev Log reply posting now fails gracefully with `error=notready` if the threaded-replies migration hasn’t been applied yet.
  - Dev Log “db unavailable” text now explicitly lists required migrations including `0015_devlog_threaded_replies.sql`.
- **Copy**:
  - Confirmed no remaining UI strings for “New Drip”, “Bubble Back”, or “Drip Approved”.

### Quick fix: notifications popover squishing
- On small viewports, the global mobile rule `button { width: 100% }` caused header popover buttons (Notifications) to compress/squish inside a flex row.
- Changed the rule to `main button { width: 100% }` so content buttons stay full-width on mobile, but header/popover buttons keep natural sizing.

### Account via Errl SVG (Notifications) + dedicated page
- Added `/account` page (`src/app/account/page.js`) to host the full account/settings UI (reuses `ClaimUsernameForm`).
- Notifications popover now includes an **Account** button that routes to `/account` and closes the popover (`src/components/NotificationsMenu.js`).
- Removed the large header Account button from `SiteHeader` (header is simpler; Search remains).
- “Complete setup” banner now routes to `/account` instead of opening a popover (`src/components/HeaderSetupBanner.js`).
- **Build**: `npm run build` succeeded (outside sandbox due to EPERM kill in sandbox build).

### Polish pass v2 (UI density + Development + Music preview + Projects + Account)
- **Threads**:
  - Replaced the big lock button row with an icon button in the top-right of the thread card (`src/app/lobby/[id]/page.js` + `.icon-button` in `src/app/globals.css`).
  - Tightened replies spacing (`.replies-list` grid) to remove extra bottom padding/air.
- **Development** (label-only rename of `/devlog`):
  - Updated nav + headings + breadcrumbs from “Dev Log” to “Development”.
  - Added wide modal support to `CreatePostModal` and used it for “New Development Post”.
  - Added structured link fields for Development posts:
    - New migration: `migrations/0016_devlog_links.sql` (`github_url`, `demo_url`, `links`).
    - Updated DevLog create/edit APIs to accept/store these fields with rollout-safe fallback.
    - Updated DevLog detail page to render link buttons.
- **Music**:
  - “Post to Music Feed” modal now includes a live embed preview (YouTube/SoundCloud) + optional image preview (`src/components/MusicPostForm.js`).
  - Slightly tightened embed/rating spacing in `src/app/globals.css`.
- **Projects**:
  - Updated Projects description to match “creative ideas to build/make with friends” (`src/lib/forum-texts/strings.js`).
  - De-emphasized GitHub/Demo fields behind a “Links (optional)” disclosure in `ProjectForm`.
  - Projects list now counts **replies** (project_replies) and labels “replies” instead of “comments”, with fallback when migrations aren’t applied.
  - Project detail page detects if replies table isn’t migrated yet and shows a clear message instead of a broken form.
- **Account**:
  - `/account` is more compact: removed redundant outer card; `ClaimUsernameForm` signed-in view is now two-column on desktop.

### Production DB migrations checklist (Cloudflare D1)
DB: `errl_forum_db` (see `wrangler.toml`)

Preferred (apply all pending migrations in order):
- `npx wrangler d1 migrations apply errl_forum_db --remote`

If you want explicit per-file commands (run in this order):
- `npx wrangler d1 execute errl_forum_db --remote --file=migrations/0010_devlog.sql`
- `npx wrangler d1 execute errl_forum_db --remote --file=migrations/0011_devlog_lock.sql`
- `npx wrangler d1 execute errl_forum_db --remote --file=migrations/0013_ui_prefs.sql`
- `npx wrangler d1 execute errl_forum_db --remote --file=migrations/0014_project_replies.sql`
- `npx wrangler d1 execute errl_forum_db --remote --file=migrations/0015_devlog_threaded_replies.sql`
- `npx wrangler d1 execute errl_forum_db --remote --file=migrations/0016_devlog_links.sql`

### Double-check notes (polish pass v2)
- **Threads**: lock icon is now a non-emoji SVG and the replies grid no longer has duplicated CSS rules.
- **Development label**: confirmed no remaining “Dev Log” UI labels except internal filenames/identifiers; updated the admin moderation dropdown + Development form placeholder for consistency.
- **Music preview**: preview uses the same `safeEmbedFromUrl()` shape as the feed, so aspect classes stay consistent (`.embed-frame.16\\:9` and `.embed-frame.soundcloud`).
- **Projects replies**:
  - List page now expects `reply_count` (with fallback) and the client label is “replies”.
  - Detail page won’t render a broken reply form if `project_replies` isn’t migrated yet; it shows a muted “not enabled” note instead.
- **Build**: `npm run build` passes.
- **Lint**: `npm run lint` currently prompts interactively because Next.js is deprecating `next lint`; this needs a separate migration to ESLint CLI if you want CI-friendly linting.

