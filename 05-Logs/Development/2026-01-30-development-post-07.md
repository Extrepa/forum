# Errl Portal Forum - Development Update #7

Hey everyone! This update adds **pins everywhere**, **likes on comments and replies**, **admin pin controls**, **admin notification prefs for new forum replies**, and a bunch of **UI polish**—including feed and list layout refinements, event attendee counts on lists, and a small **Easter egg** for when you're not signed in. Here is what has landed since the last update.

## New Features

### Easter Egg (Not Signed In)
- **Easter egg**: An Easter egg is available when you're not signed in. That's all I'm saying.

### Pins Everywhere
- **Pin to top**: Admins can pin posts, events, music posts, projects, devlogs, forum threads, and announcements to the top of their section. Pinned items show a pin icon in list views and stay at the top when sorting by activity.
- **PinPostButton**: New admin-only control on detail pages (next to hide/lock) toggles pin status. Applies to Lore, Memories, Art, Bugs, Rant, Nostalgia, Lore-Memories, Devlog, Music, Projects, Events, Announcements, and Forum threads.
- **List ordering**: All section list and feed queries now order by `is_pinned DESC` then by date/activity so pinned items appear first.

### Likes on Comments and Replies
- **LikeButton on comments**: You can now like individual comments and replies across the forum—timeline (announcements), events, music, projects, devlogs, forum replies, and all post-based sections (Lore, Memories, Art, Bugs, Rant, Nostalgia, Lore-Memories). Like count and "you liked" state display inline; compact `size="sm"` used for comment rows.
- **Likes API**: Supports 7 additional target types: `forum_reply`, `timeline_comment`, `event_comment`, `music_comment`, `project_reply`, `dev_log_comment`, `post_comment`. Like notifications and outbound alerts (email/SMS) apply when authors have like notifications enabled.
- **DeleteCommentButton**: Inline positioning option so comment action rows (reply, like, delete) lay out cleanly on small screens.

### Admin Notification: New Forum Replies
- **Admin preference**: New toggle `notify_admin_new_reply_enabled` lets admins opt in to notifications when someone posts a new forum reply. Wired in Account notification preferences and in the `/api/auth/me` and notification-prefs API.
- **Forum reply flow**: When a new forum reply is created, admins with this pref enabled receive an in-app notification (and optional email/SMS if configured).

### Admin Audit Fields (Prep)
- **edited_at and updated_by_user_id**: All main content tables (forum_threads, timeline_updates, posts, events, music_posts, projects, dev_logs) now have `edited_at` and `updated_by_user_id` columns for future admin audit trails. No UI yet—infrastructure only.

## Enhancements & Improvements

### PostMetaBar & List Layout
- **Condensed layout**: When a card has no replies (condensed), the meta bar now uses a dedicated condensed layout: desktop shows "Title by Author at time" on the left with views/replies/likes on the right in one row; mobile shows title on line 1, then "by Author at time" and stats on line 2 without wrapping stats onto extra lines.
- **Desktop vs mobile**: Separate CSS for condensed desktop (author+time next to title, stats right) and condensed mobile (author+time and stats on same row below title). Prevents "by Author" from sitting next to view count instead of the title.
- **Scrollable body previews**: List views (Lore, Memories, Art, Bugs, Rant, Nostalgia, Lore-Memories, Timeline, Events, Music, Projects, DevLog, and combined section clients) now use a scrollable post body area (`post-body-scrollable`, max-height 400px) so long previews don't blow out the card height.

### Feed & Section Lists
- **Last activity by**: Feed and Forum (lobby) now pass `lastActivityBy` (and color indices) into PostMetaBar so "Last activity by [user]" displays correctly. All feed content-type queries include `last_activity_author`.
- **Home section cards**: Lore & Memories, Art & Nostalgia, Bugs & Rant "recent" lines now consider both post date and latest comment date—so "X commented on Y by Z" appears when a comment is newer than the post.
- **Event attendee count on lists**: Events page list and feed now show "· X attending" next to the event date so you can see attendee count before opening the event.

### Header & Nav
- **Header spacing**: More space between nav, search, and dropdown (gap and padding tweaks). Brand and nav section spacing increased on desktop.
- **Mobile header**: Slightly smaller header at 1000px and 640px breakpoints (reduced gap, padding, brand min-height) for a bit more content space.
- **Nav when not signed in**: The main nav button now opens the menu even when not signed in (so the Easter egg remains accessible on mobile). Menu no longer auto-closes in that state so Feed and other links are usable.

### Auth & Account
- **Full reload after sign-in**: After successful login or signup, the app does a full page reload to the chosen landing page so server auth state (and any server-rendered content) is guaranteed to be up to date.
- **Sign-in copy**: Claim-username/sign-in copy updated to describe Errl as an icon (music, creativity, community) and the forum as an extension of that.

## Bug Fixes

- **Condensed meta layout**: Fixed cases where "by Author" and stats wrapped incorrectly on desktop/mobile or sat on the wrong row.
- **Pin display**: Pinned items now show pin icon consistently in all section clients (Timeline, Events, Music, Projects, DevLog, Lore, Lore-Memories, Memories, Art, Bugs, Rant, Nostalgia, Forum).

## Technical Improvements

### Database Migrations
- **0051_add_pins.sql**: Adds `is_pinned` to `posts`, `events`, `music_posts`, `projects`, `dev_logs` (forum_threads and timeline_updates already had it).
- **0052_add_admin_audit_fields.sql**: Adds `edited_at` and `updated_by_user_id` to all main content tables.
- **0053_add_admin_reply_prefs.sql**: Adds `notify_admin_new_reply_enabled` to `users`.

### API
- **POST /api/admin/posts/[id]/pin**: Toggles `is_pinned` for a given content type (thread, timeline, post, event, music, project, devlog). Admin-only.
- **GET /api/admin/posts**: Unified admin list now includes `is_pinned` in select for all types.
- **Likes API**: Extended to support comment/reply types with correct author lookup for notifications.
- **Forum replies**: On new reply, notifies admins who have `notify_admin_new_reply_enabled` set.

### Components
- **PinPostButton**: New component; calls pin API and refreshes state. Used on all supported detail pages for admins.
- **LikeButton**: Compact `size="sm"` prop for use in comment rows.
- **DeleteCommentButton**: `inline` prop for static positioning in action rows.
- **PostMetaBar**: Condensed layout with desktop/mobile variants; `lastActivityBy` and related props for "Last activity by [user]".

## Known Issues & Notes

- **Easter egg**: Only available when you're not signed in.
- **Admin audit**: `edited_at` / `updated_by_user_id` are in the schema but not yet written by any edit flow; they're there for future admin tooling.

---

## Follow-up (same day, post–dev update #7)

Additional fixes and polish applied after the above:

- **Easter egg (mobile):** `touch-action: none` on armed Feed link and on body during drag so the drag works on touch devices.
- **Feed / mobile:** Viewport meta and mobile CSS so feed and titles scale correctly on small screens.
- **Profile Recent Activity:** Next.js 15 `params` fix and inclusion of posts/post_comments in profile recent-activity so other users’ profiles show their activity from Art, Bugs, Rant, Nostalgia, Lore, Memories.
- **Buttons on small viewports:** CSS so page-top and nav buttons don’t stretch on mobile (inline-flex, max-content, flex-shrink).
- **Explore Sections:** Post count in top-right of section cards, "Latest drip:" label, Errl-themed empty message when no recent activity.
- **Section counts:** Homepage section post counts exclude deleted posts (`is_deleted = 0 OR is_deleted IS NULL` in all relevant COUNT queries).
- **Stats cards:** Homepage Stats (Total Posts, Active Users, Recent Activity) stay in one row on small viewports; responsive scaling so three cards fit and remain readable.
- **Stats on mobile:** On small viewports, the three stats cards are replaced with one compact card showing three stacked rows: "13 posts across all sections", "8 users (1 active)", "1 post, 1 reply in last 24h"—plus up to 3 recent post links. Each row on its own line with light dividers.
- **Recent activity queries:** Section recent-activity queries (Timeline, Shitposts, Art & Nostalgia, Bugs & Rants, Devlog, Lore & Memories) now filter out deleted items to match the counts.
- **Feed mobile stretch:** Feed page no longer stretches on mobile—body/site/main overflow constraints, feed header `minWidth` fix, and list/list-item `min-width: 0` so content stays within viewport.
- **Feed post meta wrapping:** Last activity lines and stats on feed post cards now wrap on mobile instead of overflowing (removed `white-space: nowrap`, added `overflow-wrap`).
- **Event attendee duplicate:** Removed duplicate "X attending" from the event details line on feed; it’s only shown in the bottom row with the attendee list.
- **Worker CPU limit (Error 1102):** If you hit "Worker exceeded resource limits" on the homepage while the site was down—the homepage was doing 28 sequential DB queries and blowing past the Workers Free 10ms CPU cap. Fixed by parallelizing all section fetches into a single `Promise.all`. See `docs/02-Deployment/WORKER_CPU_LIMIT_ERROR_1102.md` for details.

## Recent tweaks (Jan 31, 2026)

- **Edge instrumentation:** Added a lightweight middleware to tag every request with `x-errl-request-id` and an `x-errl-edge` marker, plus an `edgeContext` helper and Cloudflare env typings so future edge features read the headers and metadata in one place. The `/api/status` and `/api/auth/me` routes now log the request ID (and expose it when `?debug=1`) so we can link logs to user-visible requests, and the `docs/Edge-Plan.md` file captures how we want to evolve the edge layer.
- **Home page simplification:** Removed the “Recent Activity” list from HomeStats and the page query since the section cards already show recent content; the “Recent Activity” stat now keeps showing the post/reply counts only.
- **24h activity counts:** Replaced the UNION-based “last 24 hours” counts with individual per-table `COUNT(*)` queries so D1 no longer hits the compound select limit and the stats card reflects run-time activity again.

Thanks for testing and pushing the forum forward. If anything feels off, drop a note in Bugs or a dev post and I will prioritize it.
