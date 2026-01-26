# Errl Portal Forum - Development Update #4

Hey everyone! Another round of improvements—this one focuses on **notifications**, **UI/UX cleanup**, and a bunch of **stability fixes**. Most things should be resolved now, but there are a few edge cases to watch for (see below). Here's what's new since the last update.

## New Features

### Notifications — Complete Coverage
- **All comment/reply types now notify**: Post comments (Lore, Memories, Art, Bugs, Rant, Nostalgia, Lore-Memories), project replies, and devlog comments all create notifications. Previously only forum replies, timeline/events/music comments did.
- **Correct labels and links**: Notifications show who did what ("X commented on a dev log", "X replied to a project", "X commented on a post", etc.) and **clicking them takes you to the right page** — no more generic "Notification" with dead links for those types.
- **Individual delete**: Each notification has a small trash icon (bottom right, 10px). Click to delete that one only; no confirmation. **Clear All** now asks for confirmation before wiping everything.
- **Section-aware post links**: Comment notifications for Lore, Memories, Art, Bugs, Rant, Nostalgia, Lore-Memories link to the correct section (e.g. `/lore/123`, `/bugs/456`).
- **Timeline → Announcements**: Comment-on-announcement notifications link to `/announcements/[id]` and say "commented on an announcement."
- **Click to navigate**: Notification popover closes when you click a notification, then navigates. No more silent no-op for previously unhandled types.

### Announcements
- **Image upload**: Admins can attach an image when creating announcements. Optional, validated (size ≤5MB, image/* MIME type), stored in R2 bucket with key prefix `timeline-updates`.
- **Admin-only posting**: Only admins can create announcements. Non-admins see the button disabled and get a clear error if they try to bypass.

### Dual-Page Forms (Lore & Memories, Bugs & Rants, Art & Nostalgia)
- **Post type dropdown**: When posting to a combined page, you pick the type (e.g. Lore vs Memory, Bug vs Rant, Art vs Nostalgia) from a dropdown. Placeholders and labels update dynamically as you switch.
- **Type-specific messaging**: Each post type has Errl-themed placeholders and labels (e.g. Lore: "The story, the legend...", Bug: "Short summary" with "What happened? What did you expect?").
- **Members-only checkbox removed** on those pages (login already required), reducing clutter.

### Feed & Home
- **24 hourly greetings**: Home and Feed each have 24 unique Errl-themed messages (one per hour). Feed messages are feed-specific ("5pm feed transition. Evening activity approaches"); home stays portal/goo themed ("5pm portal transition. Evening approaches").
- **Feed portal message**: The same welcome block as the home page now appears on the Feed, just below the breadcrumbs, with feed-specific hourly greetings.
- **Development latest post**: The latest dev post on the Development page shows **full content** in a scrollable area (max height 400px, themed scrollbar) so you can read it without opening the detail page.

### Username Colors — System-Wide
- **Preferred color everywhere**: Your profile color preference is now used across the forum—home page Explore cards, Feed, devlog, events, projects, announcements, post sections (Lore, Memories, Art, Bugs, Rant, Nostalgia), etc. Change it once in Profile and it sticks everywhere.

## Enhancements & Improvements

### Edit, Delete & Lock
- **Lore, Memories, Lore–Memories**: Edit and delete your own posts (or admins can). Page layout uses `PageTopRow` + edit panel like devlog/events. New `PostEditForm` component with title, body, is_private checkbox, optional image upload.
- **Delete your own replies/comments**: A small trash icon (top-right of each reply/comment) lets authors and admins soft-delete. Available on devlog, lobby, projects, lore, memories, lore-memories, art, bugs, rant, nostalgia, music, events, announcements.
- **Devlog & post delete APIs**: Devlog posts and regular posts (Lore, etc.) can be deleted via new APIs; `DeletePostButton` supports both types.
- **Event edit/delete**: Events now have consistent edit/delete buttons using `EditPostButtonWithPanel` and `DeletePostButton`. Edit panel with pre-filled form values; new `/api/events/[id]` route for editing.

### Feed & List UI
- **PostMetaBar everywhere**: Feed cards use the same meta bar as lobby/devlog—views, replies, likes, created date, **last activity**.
- **Thinner cards**: Feed keeps the compact list style; no extra preview bloat.
- **15 feed items**: Latest feed shows up to 15 items (was 5).
- **Events**: Attendee count and names on feed/events list; "Last activity" moved to bottom-right of event cards. Calendar row layout aligned between Feed and Events listing.
- **Lobby label**: Lobby posts on the feed now show "(Lobby)" like other section types.
- **Spacing consistency**: Consistent 20px gaps between cards, breadcrumbs, and main content; header–main spacing tightened to 18px.

### Account & Profile Page
- **Tab button layout**: Account and Profile tabs now use a CSS Grid layout that keeps them locked to opposite corners (Account top-left, Profile top-right). Both buttons always visible, no cutoff on smaller screens.
- **Centered text**: Tab button text is now properly centered within each button.
- **Color picker refinements**: Color swatches are now fixed-size circles (18px) that don't stretch. Container uses `flex: 0 0 auto` and allows wrapping if needed.
- **Responsive card**: Account card now shrinks dynamically with the viewport, matching the header behavior. Removed unnecessary overflow constraints for better content reflow.

### Mobile Navigation
- **Fixed menu behavior**: Mobile navigation menu now stays open when clicking links. Improved click-outside detection so navigation works smoothly. No more accidental closes when navigating.

### Development Page
- **Scrollable latest post**: Full body in a scrollable container with themed scrollbar (teal/cyan colors, cross-browser support).
- **Edit button position**: Edit post button moved from bottom to top row (same row as breadcrumbs), using `PageTopRow` + `EditPostButtonWithPanel` for consistency with other pages.

### UI Polish
- **Event comment padding**: Added padding-top to event comment section for better spacing.
- **Active status bubble removed**: CSS rules ensure no active status indicators appear next to usernames (feature not fully built yet).

## Bug Fixes

### Critical Fixes
- **Devlog crash after replies**: Devlog detail pages no longer crash after viewing replies. Fixed Next.js 15 `params`/`searchParams` await pattern, serialization fixes (pre-render markdown, coerce BigInt/numeric values), and `validCommentIds` handling for reply tree building.
- **Art page variable order**: Fixed use of `post` variable before it was defined (lock/edited logic). Variables now calculated after post is fetched and confirmed to exist.

### Next.js 15 Compatibility
- **Params/searchParams await**: All `[id]` detail pages (devlog, events, projects, music, lobby, lore, memories, lore-memories, rant, nostalgia, bugs, art, announcements) now `await params` / `await searchParams` where required. Fixes runtime issues on devlog, lobby, events, music, projects.
- **API params consistency**: Events, projects, timeline comment/reply routes use `id` from `await params` consistently. Devlog comments API, delete routes (devlog post, post, comment/reply deletes) all await params correctly.

### Serialization & Data Handling
- **Comment/reply serialization**: Devlog, events, music pre-render markdown and coerce numeric/BigInt values before passing to client components, avoiding serialization errors. Created `safeComments` arrays with full serialization (id, body, author_name, author_color_preference, created_at, reply_to_id) as String/Number.
- **Reply tree validation**: Devlog and lobby use `validCommentIds` Set to ensure only valid parent IDs are used in reply tree building. Orphaned replies (pointing to deleted comments) become top-level.

### Notification Fixes
- **Blank notification labels**: Fixed notifications showing generic "Notification" with no details. All notification types now have proper labels and href links.
- **Dead notification links**: Fixed notifications that did nothing when clicked. All notification types now navigate to the correct page.

## Technical Improvements

### Notification System
- **Notification creation**: Post comments (`/api/posts/[id]/comments`), project replies (`/api/projects/[id]/replies`), and devlog comments (`/api/devlog/[id]/comments`) APIs create notifications (author + participants, excluding self). Wrapped in try/catch so missing `notifications` table doesn't break rollout.
- **Notification display**: `NotificationsMenu` handles all notification types (`reply+forum_thread`, `reply+project`, `comment+timeline_update`, `comment+event`, `comment+project`, `comment+music_post`, `comment+dev_log`, `comment+post` sections). Uses `actor_username` in labels; fallback to "Someone" if missing.

### Delete APIs
- **New routes**: Created delete routes for devlog post (`/api/devlog/[id]/delete`), post (`/api/posts/[id]/delete`), and per-comment/reply soft-delete (devlog: `/api/devlog/[id]/comments/[commentId]/delete`, projects: `/api/projects/[id]/replies/[replyId]/delete`, posts: `/api/posts/[id]/comments/[commentId]/delete`, music: `/api/music/comments/[commentId]/delete`, events: `/api/events/[id]/comments/[commentId]/delete`, timeline: `/api/timeline/[id]/comments/[commentId]/delete`, forum: `/api/forum/[id]/replies/[replyId]/delete`). All check auth and ownership/admin.
- **DeleteCommentButton component**: Shared component used across 13 pages + `ProjectRepliesSection` / `EventCommentsSection`. Single modal for "Clear All" notifications; individual deletes are instant (no confirmation).

### Component Architecture
- **PostEditForm component**: New reusable component for editing posts (Lore, Memories, etc.) with `initialData` prop, title, body, is_private checkbox, optional image upload.
- **Event edit API**: New `/api/events/[id]` route for editing events. Enhanced `PostForm` component to support `initialData` prop for editing.
- **GenericPostForm enhancements**: Added `allowedTypes` prop for dual-page forms, dynamic type-specific configurations (labels, placeholders, button text), real-time UI updates when dropdown selection changes.

### Database & Queries
- **Username color preferences**: All queries that JOIN users now fetch `preferred_username_color_index AS author_color_preference`. Home page, Feed, devlog, events, projects, announcements, post sections all build preferences maps and pass to `assignUniqueColorsForPage()`.
- **Activity data**: Feed queries now include views, reply_count/comment_count, like_count, last_activity_at for all content types (announcements, threads, events, music, projects, posts, devlogs).

### Code Quality
- **Consistent patterns**: All new features follow existing code patterns. Proper error handling with try/catch blocks. Rollout-safe features degrade gracefully if migrations haven't been applied yet.
- **No breaking changes**: All improvements are backward compatible. Existing functionality preserved.
- **Build status**: All changes compile successfully with no linter errors.

## Known Issues & If You Run Into Problems

Most things should be resolved, but keep these in mind:

### Notifications
- **Old "Notification" with no link**: Notifications created *before* the fix (with `target_type === 'post'`) still show "Notification" and don't link. **New** post-comment notifications use section-specific `target_type` (e.g. `'lore'`, `'bugs'`) and work correctly. Nothing you can do for old ones except clear them.
- **IMAGE_UPLOAD_ALLOWLIST**: For announcement image upload, admins must be in the allowlist (or use `*`). If uploads fail, check that config. The `canUploadImages()` function respects `IMAGE_UPLOAD_ALLOWLIST` environment variable.

### Delete & Lock
- **Posts `is_deleted`**: The shared `posts` table might not have `is_deleted` yet (migrations add it for dev_logs, events, projects, etc.). If post delete fails, the API returns `409` "not ready"—you'd need a migration adding `is_deleted` to `posts` if you want soft-delete there.
- **Lock for Lore/Memories etc.**: Lock UI exists on some pages, but a dedicated `is_locked` migration and `/api/posts/[id]/lock` for **posts** (Lore, Memories, Art, Bugs, Rant, Nostalgia) were deferred. Lock works for devlog, events, projects, forum, announcements.

### APIs & Next.js 15
- **API `params`**: Many API routes (~38) still use `params.id` directly. The updated ones (e.g. devlog comments, delete routes, events/projects/timeline comment/reply routes) use `await params`. If you see odd behavior in other APIs (e.g. comments/replies not saving, wrong ids), those routes may need the same `await params` + `id` pattern.

### Optional / Deferred
- **Lore/Memories threading**: Those pages use a flat comment form. Threaded replies like devlog/events are a possible follow-up.
- **Quote button on devlog**: Uses a fallback (no prefilled quote); reply via link still works.

If you hit something not listed here—weird errors, broken links, or missing notifications—please report it (e.g. in **Bugs** or a dev post). I'll prioritize fixes.

## What's Possible Now

With all these improvements, here's what you can do:

- **Rely on notifications** for all sections—comments and replies—and **click through** to the right page.
- **Delete** individual notifications or clear all (with confirmation).
- **Edit/delete** your Lore, Memories, and devlog posts; **delete** your own comments/replies across the forum.
- **Use username colors** that match your profile preference on home, feed, and sections.
- **Browse Feed** with richer meta, last activity, event attendees, and up to 15 items.
- **Read the latest dev post** in full on the Development page without opening it.
- **Post announcements with images** (admins only) and **choose post type** on dual pages (Lore/Memory, Bug/Rant, Art/Nostalgia).
- **Manage your account** with the refined account/profile page (grid tabs, fixed-size color swatches, responsive card).
- **Navigate on mobile** with the fixed mobile menu that stays open when clicking links.
- **Enjoy** more consistent spacing, hourly greetings, and fewer crashes.

Thanks for testing and for the feedback. If you run into problems or have ideas, say so—we'll keep iterating.
