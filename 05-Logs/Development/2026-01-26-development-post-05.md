# Errl Portal Forum - Development Update #5

Hey everyone! This update brings **view tracking**, **read status**, **profile features**, and **image uploads in project replies**. Plus a bunch of **stability improvements** and **deferred features** from update #4 that are now complete. Here's what's new since the last update.

## New Features

### View Tracking — System-Wide
- **View counts everywhere**: All content types (devlogs, music, events, projects, posts, announcements, forum threads) now track view counts. Views increment automatically when logged-in users visit a detail page (all content pages require authentication).
- **ViewTracker component**: New client-side component that tracks views without blocking page rendering. Calls `/api/[contentType]/[id]/view` endpoint on page load.
- **View APIs**: New view tracking endpoints for all content types (`/api/devlog/[id]/view`, `/api/music/[id]/view`, `/api/events/[id]/view`, `/api/projects/[id]/view`, `/api/posts/[id]/view`, `/api/timeline/[id]/view`, `/api/forum/[id]/view`). All increment view counts atomically and handle missing columns gracefully.
- **View display**: View counts appear in `PostMetaBar` components across the forum—Feed, detail pages, list pages. Shows alongside replies, likes, and last activity.

### Read Status Tracking
- **Content reads table**: New generic `content_reads` table tracks what users have read. Supports content types (`dev_log`, `music_post`, `event`, `project`, `post`, `timeline_update`). Forum threads use a separate specialized system (see below).
- **Mark as read APIs**: New endpoints for content types (`/api/[contentType]/[id]/mark-read`) that record when a user views content. Called automatically by `ViewTracker` component.
- **Forum thread read tracking**: Forum threads use specialized `forum_thread_reads` table (migration 0024) that tracks `last_read_reply_id`—knows exactly which reply you last read. Lobby page shows unread indicators for threads with new replies since your last visit. Uses `ThreadViewTracker` component and `/api/forum/[id]/mark-read` endpoint.
- **Unread indicators**: Music page shows unread status for posts using `content_reads` table. Lobby page shows unread indicators for forum threads using `forum_thread_reads` table. Other pages can extend this (infrastructure ready).
- **Read tracking on view**: When you visit a detail page (requires login), it's automatically marked as read for your account. No manual "mark as read" button needed—just viewing counts.

### Profile Views
- **Profile view counter**: User profiles now track how many times they've been viewed. Counter increments automatically when someone (other than the profile owner) visits `/profile/[username]`.
- **Profile stats**: Profile pages show comprehensive stats—total posts (forum threads, devlogs, music, projects, announcements, events), total replies/comments across all sections, profile views count, account creation date.
- **Account page integration**: Profile views also appear in the Account page stats section, so you can see your own profile view count.

### User Activity Tracking
- **Last seen timestamp**: Users table now tracks `last_seen` timestamp, updated automatically on every page visit (non-blocking, fire-and-forget). Tracks when users are actively browsing the forum.
- **Home page active users**: Home page shows count of users active in the last 5 minutes (users with `last_seen` within 5 minutes). Displays as "X users active" in the welcome section.
- **Graceful fallback**: Last seen tracking degrades gracefully if the column doesn't exist yet (migration not applied). No errors, just skips tracking.

### Project Replies — Image Uploads
- **Image upload in replies**: Project replies now support image attachments, just like project updates. Optional image field in reply form, validated (≤5MB, image/* MIME type), stored in R2 with `projects` prefix.
- **Image display**: Reply images display inline below the reply body, with proper styling (max-width 100%, rounded corners, auto height). Uses `/api/media/[image_key]` endpoint.
- **Image key column**: New `image_key` column added to `project_replies` table via migration. Existing replies without images work fine (null image_key).

### Forum Threading (Complete)
- **Nested replies**: Forum replies now support one-level threading via `reply_to_id` column. You can reply directly to another reply, creating nested conversations.
- **Threading display**: Forum thread pages display replies with proper nesting—child replies appear indented under their parent. Uses same threading pattern as devlog/projects/events.
- **Reply validation**: Threading enforces one level deep (replies to replies, but not replies to replies to replies). Prevents overly deep nesting.

## Enhancements & Improvements

### View & Read System
- **View count queries**: All detail pages now fetch view counts (`COALESCE(views, 0) AS views`) with graceful fallback if column doesn't exist. View counts default to 0 for new content.
- **View count resets**: Admin migrations available to reset view counts (used for testing/cleanup). Three reset migrations (0036, 0037, 0038) for different scenarios.
- **Read status queries**: Music page and other list pages check `content_reads` table to mark items as read/unread. Graceful fallback if table doesn't exist yet.

### Profile Page
- **Public profiles**: New `/profile/[username]` page for viewing other users' profiles. Shows username, bio, links, creation date, stats, profile views. Redirects to account page if viewing your own profile.
- **Profile stats breakdown**: Stats show counts for each content type separately (forum threads, devlogs, music posts, projects, announcements, events) plus total replies/comments across all sections.
- **Profile view increment**: Profile views increment only when viewed by someone else (not the owner). Prevents self-inflation of view counts.

### Posts Lock & Delete (Complete)
- **Posts lock**: Posts table now has `is_locked` column. Lock API (`/api/posts/[id]/lock`) works for Lore, Memories, Art, Bugs, Rant, Nostalgia, Lore-Memories sections. Locked posts show lock indicator and prevent new comments.
- **Posts soft delete**: Posts table now has `is_deleted` column. Delete API (`/api/posts/[id]/delete`) works for all post sections. Deleted posts are hidden from listings but preserved in database.

### Timeline Lock
- **Announcements lock**: Timeline updates (announcements) now support locking via `is_locked` column. Lock API works for announcements. Matches behavior of other content types.

### API Improvements
- **View endpoints**: All view tracking endpoints use consistent pattern—check auth, increment view count atomically, handle missing columns gracefully, return success.
- **Mark-read endpoints**: All mark-read endpoints use consistent pattern—check auth, upsert `content_reads` record, handle missing table gracefully, return success.
- **Project replies image**: Project replies API (`/api/projects/[id]/replies`) now handles image uploads with same validation as project updates. Stores image_key in database.

### Component Updates
- **ViewTracker component**: New client component that tracks views and marks content as read. Used on detail pages (devlog, music, events, projects, posts, announcements). Non-blocking, fails silently if APIs don't exist yet.
- **ThreadViewTracker component**: Separate component for forum threads that tracks views and marks threads as read using the specialized `forum_thread_reads` table. Used on forum thread detail pages. Handles reply-level read tracking (tracks which reply you last read).
- **PostMetaBar**: Now displays view counts alongside other metadata. Shows views, replies, likes, created date, last activity consistently across all content types.

## Bug Fixes

### Authentication
- **Projects detail page**: Fixed projects detail page to require authentication. Previously allowed guest access; now redirects to home if not logged in, matching all other content pages.
- **Lobby page**: Fixed lobby (forum) page to require authentication. Previously allowed guest access; now redirects to home if not logged in, matching all other content pages.

### View Tracking
- **Missing view columns**: All view tracking gracefully handles missing `views` columns. Uses `COALESCE(views, 0)` in queries, defaults to 0 if column doesn't exist. No crashes if migrations haven't run yet.
- **View count display**: View counts now display correctly on all pages. Previously some pages showed undefined or missing values.

### Read Status
- **Content reads table**: Read status tracking degrades gracefully if `content_reads` table doesn't exist. Music page and other list pages mark all items as read if table is missing.
- **Unread indicators**: Unread status now works correctly on music page. Previously all items showed as read even if not viewed.

### Profile Features
- **Profile view increment**: Profile views now increment correctly when viewing other users' profiles. Previously didn't increment or incremented incorrectly.
- **Profile stats accuracy**: Profile stats now count all content types correctly. Previously some counts were missing or incorrect.

### Project Replies
- **Image upload validation**: Project reply image uploads now validate file size and type correctly. Previously validation might have been inconsistent.
- **Image display**: Reply images now display correctly with proper styling. Previously images might not have rendered or had incorrect sizing.

## Technical Improvements

### Database Migrations
- **0031_add_view_counts.sql**: Adds `views` column to all content tables (dev_logs, music_posts, events, projects, posts, timeline_updates). Includes indexes for performance.
- **0032_add_content_reads.sql**: Creates generic `content_reads` table for tracking read status across all content types. Includes indexes on user_id+content_type and content_type+content_id.
- **0033_add_posts_is_deleted.sql**: Adds `is_deleted` column to posts table (was deferred in update #4). Includes index for filtering.
- **0034_posts_lock.sql**: Adds `is_locked` column to posts table (was deferred in update #4).
- **0035_timeline_lock.sql**: Adds `is_locked` column to timeline_updates table.
- **0036-0038_reset_view_counts.sql**: Admin migrations to reset view counts (for testing/cleanup).
- **0039_add_user_last_seen.sql**: Adds `last_seen` column to users table for activity tracking.
- **0040_project_replies_image_key.sql**: Adds `image_key` column to project_replies table.
- **0041_add_profile_views.sql**: Adds `profile_views` column to users table.

### View Tracking System
- **ViewTracker component**: Client-side component that calls view and mark-read APIs on mount. Uses `useEffect` hook, fails silently if APIs don't exist. Non-blocking for page performance.
- **View APIs**: All view endpoints follow consistent pattern—POST request, check session user, increment view count atomically using SQL `UPDATE ... SET views = views + 1`, handle missing columns gracefully, return JSON success.
- **View count queries**: All detail pages use `COALESCE(views, 0) AS views` in SELECT queries. Ensures view counts always return a number, defaults to 0 if column missing.

### Read Status System
- **Mark-read APIs**: Mark-read endpoints follow consistent pattern—POST request, check session user, upsert read record using `INSERT ... ON CONFLICT DO UPDATE`, handle missing table gracefully, return JSON success. Generic content uses `content_reads` table; forum threads use `forum_thread_reads` table with `last_read_reply_id`.
- **Read status queries**: List pages check read tables to determine unread status. Music page uses `content_reads` table; lobby page uses `forum_thread_reads` table with reply-level tracking. Uses `LEFT JOIN` or separate query to check read state, marks items as unread if not in table.

### Profile System
- **Profile page**: New server component at `/profile/[username]/page.js`. Fetches user by username_norm, increments profile_views if not own profile, calculates stats from all content tables, displays comprehensive profile info.
- **Profile stats calculation**: Stats query all content tables (forum_threads, dev_logs, music_posts, projects, timeline_updates, events) and all reply/comment tables (forum_replies, devlog_comments, music_comments, project_replies, timeline_comments, event_comments, post_comments) to get accurate counts.

### Activity Tracking
- **Last seen updates**: `updateUserLastSeen()` function in `lib/auth.js` updates `last_seen` timestamp. Called from `layout.js` on every page load (non-blocking, fire-and-forget). Handles missing column gracefully.
- **Active users query**: Home page queries users table for `last_seen > (now - 5 minutes)` to count active users. Degrades gracefully if column doesn't exist.

### Project Replies Image Upload
- **Image handling**: Project replies API now handles image uploads same as project updates. Validates file size (≤5MB), MIME type (image/*), checks upload allowlist, stores in R2 bucket with `projects` prefix, saves image_key to database.
- **Image display**: `ProjectRepliesSection` component now displays reply images if `image_key` exists. Uses `<img>` tag with `/api/media/[image_key]` src, proper styling for responsive display.

### Code Quality
- **Consistent patterns**: All new features follow existing code patterns. Proper error handling with try/catch blocks. Rollout-safe features degrade gracefully if migrations haven't been applied yet.
- **No breaking changes**: All improvements are backward compatible. Existing functionality preserved. Missing columns/tables handled gracefully.
- **Build status**: All changes compile successfully with no linter errors.

## Known Issues & If You Run Into Problems

Most things should be working smoothly, but keep these in mind:

### View Tracking
- **View count accuracy**: View counts increment on every page visit by logged-in users, including refreshes. This is intentional (tracks page views, not unique visitors). All content pages require authentication, so only logged-in users can view content.
- **View count resets**: If view counts seem off, admins can run reset migrations (0036-0038) to zero them out. This is mainly for testing/cleanup.

### Read Status
- **Unread indicators**: Music page shows unread status using `content_reads` table. Lobby page shows unread indicators for forum threads using `forum_thread_reads` table (tracks which reply you last read). Other list pages (devlog, events, projects, etc.) don't show unread indicators yet, but the infrastructure is there—just needs UI added.
- **Read tracking**: Read status is tracked per-user. All content pages require authentication, so read tracking works for all logged-in users. Forum threads have specialized reply-level read tracking (knows which reply you last read), while other content types use simpler "viewed/not viewed" tracking.

### Profile Views
- **Profile view accuracy**: Profile views increment on every visit by a different user. Self-views don't count. If you see unexpected counts, it might be from testing or multiple users viewing.
- **Profile stats**: Profile stats count all content, including deleted items (if soft-delete is used). This is intentional—shows total activity, not just visible content.

### Project Replies Images
- **Image upload allowlist**: Project reply image uploads respect `IMAGE_UPLOAD_ALLOWLIST` environment variable. If uploads fail, check that you're in the allowlist (or use `*` for all users).
- **Image size limits**: Images are limited to 5MB. Larger images will be rejected with an error message.

### Activity Tracking
- **Last seen accuracy**: Last seen updates are fire-and-forget (non-blocking). If database is slow, updates might lag slightly. This is intentional to avoid blocking page loads.
- **Active users count**: Active users count shows users active in last 5 minutes. This is a snapshot, not real-time. Count updates on each page load.

### Optional / Deferred
- **Unread indicators on other pages**: Music page has unread indicators, but devlog, events, projects, etc. don't yet. The `content_reads` table supports it—just needs UI added to those pages.
- **View count analytics**: View counts are stored but there's no analytics dashboard yet. Could add charts/graphs showing popular content in the future.

If you hit something not listed here—weird errors, broken view counts, or missing read status—please report it (e.g. in **Bugs** or a dev post). I'll prioritize fixes.

## What's Possible Now

With all these improvements, here's what you can do:

- **Track content popularity** with view counts on all detail pages—see which posts, projects, events, etc. are getting the most attention.
- **Know what you've read** with unread indicators on music page and lobby page (forum threads show which threads have new replies since your last visit).
- **See profile activity** with profile view counts and comprehensive stats showing all your content across the forum.
- **Upload images in project replies** to share screenshots, mockups, or progress photos directly in reply threads.
- **Have nested conversations** in forum threads with one-level threading—reply directly to replies for clearer discussions.
- **See who's active** with the active users count on the home page (users active in last 5 minutes).
- **Lock posts and announcements** to prevent further comments when discussions are complete or resolved.
- **Soft-delete posts** to hide content while preserving it in the database (useful for moderation or accidental posts).

Thanks for testing and for the feedback. If you run into problems or have ideas, say so—we'll keep iterating.

## Future Plans

Here's what's coming next in future updates:

### Profile Avatars
- **Erl SVG avatars**: Users will be able to customize their profile with Erl-themed SVG avatars. Avatars can be created/edited either directly on the forum or through an external avatar generator tool, then uploaded or linked to your profile.
- **Avatar display**: Avatars will appear next to usernames across the forum—posts, replies, comments, profile pages, and user listings. Provides visual identity and personalization beyond just username colors.
- **Avatar storage**: Avatars will be stored in R2 bucket (similar to image uploads) or referenced via URL if created externally. Supports SVG format for crisp display at any size.

### User Roles & Permissions
- **Role system**: Enhanced role system beyond just "admin" and "user". New roles like "moderator", "editor", "contributor", etc. with granular permissions for different actions.
- **Role-based controls**: Roles will control what users can do—post in certain sections, edit/delete content, lock threads, moderate comments, access admin features, etc. Flexible permission system for community management.
- **Role assignment**: Admins will be able to assign roles to users through the admin interface. Roles can be changed over time as community needs evolve.
- **Role display**: User roles will be visible next to usernames (e.g., badges or labels) so community members know who has what permissions.

### Design Customization
- **Theme preferences**: Users will be able to customize the forum's visual design to their preferences. Options to reduce or remove rainbow gradients, choose color schemes, adjust contrast, and more.
- **Theme presets**: Pre-built theme presets (e.g., "Minimal", "High Contrast", "Dark Mode", "Classic Errl") for quick switching. Plus ability to create and save custom themes.
- **Per-user themes**: Each user's theme preference will be stored in their account settings. Themes apply site-wide when logged in, or can be set per-device/browser.
- **Accessibility options**: Design customization will include accessibility-focused options—larger text, reduced motion, higher contrast, simplified layouts—to make the forum usable for everyone.

These features are planned for upcoming development cycles. Priority and timeline will depend on community feedback and usage patterns. If you have ideas or preferences for any of these, share them in the forum!
