# Errl Portal Forum - Development Update #12

Hey everyone. This update covers work shipped **after Development Update #11** (mid-February through March 2026). It builds on the messaging, threading, and notifications release with **@-mentions in compose**, **feed and meta bar refinements**, **admin tools to recover soft-deleted accounts and posts**, more reliable **scroll and layout** behavior, and fixes for **deletes, errors, and like counts** on detail pages.

## New Features

### @-mentions in compose
- **MentionableTextarea** is now shared across posts, thread edits, section comments and replies, direct messages, music/project/devlog forms, and other compose surfaces—type **`@`** to mention people where the form supports it.
- **`formatting.js`** keeps markdown-style controls and the textarea in sync for these controlled fields.

### Admin: recover soft-deleted users and content
- **Restore accounts**: Admins can bring back **soft-deleted users** from the admin console. Restored accounts can sign in again (usernames may still reflect anonymization from the delete flow until the member updates their profile, depending on how you issued the delete).
- **Restore posts**: Admins can recover **soft-deleted content** (forum threads, announcements, section posts, events, music, projects, devlogs) from dedicated lists in the console, alongside existing post restore flows.
- **POST `/api/admin/users/[id]/restore`**: Clears `is_deleted` / `deleted_at` / `deleted_by_user_id` for a user; writes audit and can notify other admins who opt in.
- **Admin notifications**: New admin event option **“User restored”** (`user_restored`) in line with other moderation alerts, so you can choose to be notified when someone is restored.

## Enhancements & Improvements

### Feed, PostMetaBar, and section lists
- **Feed** and **PostMetaBar** got another layout pass (spacing, alignment, how stats and bylines stack at different widths).
- **Section clients** and **Devlog** pages were aligned with the same globals and card patterns as the rest of the site.

### Account and admin console
- Incremental **Account tabs** and **AdminConsole** polish after Update #11, including clearer handling of deleted vs active rows and recovery sections.

### Home and cards
- **HomeSectionCard** and related homepage presentation tweaks alongside the feed work.

### Scroll and overflow (reliability)
- **Scroll ownership** was simplified: main layout favors **`overflow: visible`** so the page scrolls as one surface; nested scroll is reserved for modals, popovers, and similar UI.
- **Post body previews** no longer use the same **max-height** clamp as before, so long previews expand with the page instead of fighting the window scroll.
- **Section cards** that wrap a **`.list`** use a tighter rule (`.card:has(> .list)`) so list scrolling stays predictable.
- **Ghost buttons**: **Overflow / word-break** adjustments so labels behave on narrow widths.

### Embeds (polish)
- **Spotify / embed** boxes on detail views received minor **CSS** tweaks for more consistent height.

### Admin stats (when soft-delete is enabled)
- User totals and **active user** counts in the admin dashboard **exclude soft-deleted accounts** when the `is_deleted` column exists, so numbers match who can actually use the site.

## Bug Fixes

### Deletes and error feedback
- **Delete from detail**: **`DeletePostButton`** sends credentials reliably and **shows API errors** when a delete fails instead of failing silently.
- **Admin user delete**: The console surfaces **real API error text** when account deletion fails (for example missing migration **`0063_user_soft_delete.sql`**).
- **Admin user delete (compatibility)**: The anonymizing **UPDATE** no longer touches optional **`notify_*` / avatar columns** that might not exist on older schemas—reducing spurious failures on partial migrates.
- **Forum, timeline, and devlog delete APIs**: Safer **try/catch** around DB updates with **409 JSON** when the database rejects the operation.

### Likes on detail pages
- **Music, events, and devlog** detail pages use **real `like_count` queries** in fallbacks instead of **0**, so totals stay correct after navigation and refresh.

## Technical Improvements

### API and components (summary)
- **`POST /api/admin/users/[id]/restore`**, **`AdminConsole.js`**, **`admin/page.js`** (load deleted users/posts), **`adminNotificationEvents.js`**, and **`DeletePostButton`** / delete routes carry most of the behavioral changes.
- Ongoing iteration on **Messages** compose and **`/api/messages`** after Update #11.

### Migrations
- **No new migrations** in this window: rely on the same set as Update #11 (through **0078** / `user_activity_log`). Ensure **`0063_user_soft_delete.sql`** is applied wherever admins use account delete/restore.

## Known Issues & Notes

- This release is mostly **polish and reliability** on top of #11; worth smoke-testing **long threads**, **modals/menus**, and **mobile scroll** after deploy.
- If deletes fail with **409** or a DB message, note **content type, URL, and whether migrations are current** in a bug report.

---

Thanks for reading—and for the reports that drive these fixes. If something still feels off, include the **page and viewport width** so we can reproduce it quickly.
