# 2026-01-30 Cursor Notes

## Implementation: Likes, Pins, Admin UI Prep

Completed full plan implementation.

---

## Verification (double-check and test build)

### Fixes applied during verification

1. **Duplicate LikeButton imports** – art, bugs, nostalgia, lore-memories, memories, lore, rant, music had duplicate imports (existing for main post + added for comments). Removed duplicates; single import used for both.

2. **Admin API import paths** – Admin routes use different depths:
   - `posts/route.js`: `../../../../lib/*` (4 levels)
   - `posts/[id]/route.js`: `../../../../../lib/*` (5 levels)
   - `posts/[id]/pin/route.js`: `../../../../../../lib/*` (6 levels)

3. **Unused import** – Removed `useEffect` from LikeButton.js (not used).

### Migration check

- 0051: Adds is_pinned to posts, events, music_posts, projects, dev_logs (forum_threads/timeline_updates already have it).
- 0052: Adds edited_at, updated_by_user_id to all content tables.
- 0053: Adds notify_admin_new_reply_enabled to users.

### Bind order check (comment queries)

- Lobby forum_replies: `(user_id, thread_id, limit, offset)` – correct.
- Announcements timeline_comments: `(user_id, update_id)` – correct.
- Events, projects, devlog, music, post-based: `(user_id, parent_id)` – correct.

### Test build result

- `npm run build` completed successfully (exit 0).

---

## Implementation summary

### Migrations
- 0051_add_pins.sql: is_pinned for posts, events, music_posts, projects, dev_logs
- 0052_add_admin_audit_fields.sql: edited_at, updated_by_user_id for all main content tables
- 0053_add_admin_reply_prefs.sql: notify_admin_new_reply_enabled on users

### Like + Delete on Comments/Replies
- DeleteCommentButton: added `inline` prop (position static when true)
- LikeButton: added `size="sm"` for compact mode
- globals.css: .comment-card, .comment-action-row
- All 13 comment renderers updated with LikeButton + DeleteCommentButton inline
- Comment queries: like_count and liked subqueries
- likes API: 7 new post types, author lookup for notifications

### Pinning
- is_pinned in list queries, ORDER BY is_pinned DESC
- Pin icon in TimelineClient, LoreClient, LoreMemoriesClient, EventsClient, MusicClient, ProjectsClient, DevLogClient, NostalgiaClient, ArtClient, BugsClient, RantClient, MemoriesClient
- Admin pin API: POST /api/admin/posts/[id]/pin

### Admin UI Prep
- GET /api/admin/posts (unified list)
- GET/POST/DELETE /api/admin/posts/[id]
- Forum replies: admin notification when notify_admin_new_reply_enabled
- notify_admin_new_reply_enabled wired in auth.js, me, notification-prefs, ClaimUsernameForm

---

## Deploy Prep

- **Deploy prep doc**: `05-Logs/Daily/2026-01-30-deploy-prep.md`
- **Migrations**: Run `npx wrangler d1 migrations apply errl_forum_db --remote` before deploy (or apply 0051, 0052, 0053 manually)
- **Preview**: `./deploy.sh --preview "Likes on comments, pins everywhere, admin UI prep"`

---

## Missing updates (user report)

- Added attendee count to events page list: "· X attending" next to event date (events/page.js, EventsClient.js)
- Added attendee count next to event date on feed page (feed/page.js)
- See `05-Logs/Daily/2026-01-30-missing-updates-summary.md` for home/feed/thread preview analysis and clarification needed

---

## Home/Feed/Thread updates (user feedback)

1. **Home page section cards** (Lore & Memories, Art & Nostalgia, Bugs & Rant): Added post_comment comparison so "recent" shows newest of post vs comment (e.g., "X commented on Y by Z" when a comment is newer than the post).
2. **PostMetaBar lastActivityBy**: New prop shows "Last activity by [user]: date" when provided. Wired in feed page and ForumClient (General/lobby).
3. **Feed last_activity_author**: All 7 feed content-type queries now include last_activity_author; feed displays "by [user]" for last activity.
4. **Thread previews - scrollable mini previews**: Added `post-body-scrollable` (max-height 400px, overflow-y auto) to list views in: LoreMemoriesClient, LoreClient, MemoriesClient, ArtClient, BugsClient, RantClient, NostalgiaClient, ArtNostalgiaClient, BugsRantClient, TimelineClient, EventsClient, MusicClient, ProjectsClient. DevLogClient already had it.

---

## PostMetaBar condensed layout refinements

### Problem 1: Stats in own row (mobile)
When condensed (no replies), view count was wrapping to its own row instead of staying on the same line as "by username at time".

**Fix:** Added `post-meta-condensed-meta-row` – a dedicated flex row containing "by username at time" (left) and stats (right) in one `justify-content: space-between` flex container.

### Problem 2: Stats bottom-right when title wraps
Initially tried `align-self: flex-end`; that caused stats to wrap to their own row when title was long. Reverted to condensed-meta-row.

### Problem 3: Desktop wrap
On desktop, condensed posts were wrapping when space was available.

**Fix:** CSS `flex-wrap: nowrap` on `.post-meta--condensed .post-meta-row1` for min-width 768px.

### Problem 4: Author next to views instead of title
Desktop condensed layout put "by username at time" next to the views on the right instead of next to the title on the left.

**Fix:** Split layout by viewport:
- **Desktop:** `post-meta-condensed-author-desktop` – author+time inline with title (left), stats on right. Condensed-meta-row hidden.
- **Mobile:** `post-meta-condensed-meta-row` – title on line 1, then author+time (left) and stats (right) on line 2. Condensed-author-desktop hidden.

### Font sizes (final)
- **"by username":** 14px on all posts (condensed and non-condensed).
- **"at time"** (condensed only): 12px.
- **Stats, date, last activity:** 12px.

### Files changed
- `src/components/PostMetaBar.js`: Condensed layout with desktop/mobile variants, font sizes as above.
- `src/app/globals.css`: post-meta-condensed-author-desktop (show on desktop), post-meta-condensed-author-mobile (show on mobile), post-meta-condensed-meta-row (show on mobile, hide on desktop for condensed), flex-wrap: nowrap for condensed on desktop.

---

## Header layout and Easter egg

### Header padding (desktop)
- **Dropdown + Search:** `header-right-controls` gap 8px→12px, added `padding-left: 12px` (later 16px) for space from face/nav.
- **More space overall:** header gap 12px→18px, brand min-height 88px, brand-left gap 4px→8px, header-nav-section gap 8px→12px.

### Mobile/small viewport (max-width 1000px, 640px)
- **Navigation button when not signed in:** Removed `if (navDisabled) return` so the button always opens the menu (needed for Easter egg).
- **Menu stays open when not signed in:** Stopped calling `setMenuOpen(false)` in the navDisabled branch of the useEffect so users can access the Feed link for the Easter egg on mobile.
- **Smaller header:** At 1000px: gap 12px, padding 12px 16px, brand min-height 80px, header-bottom-controls margin-top 6px. At 640px: gap 10px, padding 10px 12px, brand min-height 72px, brand-left gap 4px, padding-right 72px, header-bottom-controls margin-top 6px.

### Easter egg SVG stroke
- **Errl face (Cha face) in errl-bubbles-header.html:** Eyes and mouth had `strokeWidth="12"`, which looked too thick. Reduced to `strokeWidth="4"` to match the face outline (same as ForumLogo).

### Files changed
- `src/components/SiteHeader.js`: Navigation button always opens menu; menu no longer auto-closed when navDisabled.
- `src/app/globals.css`: header/brand spacing, mobile overrides for header size.
- `public/easter-eggs/errl-bubbles-header.html`: region-eyeL, region-eyeR, region-mouth strokeWidth 12→4.

---

## Pin admin controls (fix/pin-admin-controls)

- **Branch:** `fix/pin-admin-controls`
- **PinPostButton:** New component (icon next to visibility icon in breadcrumbs/controls row). Calls `POST /api/admin/posts/[id]/pin` with JSON `{ type }`; maps postType (thread, timeline, post, event, music, project, devlog) to API type.
- **Detail pages:** Added `is_pinned` to main content queries and PinPostButton next to HidePostButton (admin-only) on: lobby, announcements, devlog, events, music, projects, rant, nostalgia, memories, lore, lore-memories, bugs, art.

---

## Development Update #7 (draft)

- **File:** `05-Logs/Development/2026-01-30-development-post-07.md`
- **Scope:** All changes since dev update #6 (2026-01-29): Easter egg (brief, not-signed-in only), pins everywhere, likes on comments/replies, admin pin API, admin new-reply pref, admin audit fields prep, PostMetaBar condensed layout, feed/last-activity/attendee UI, header/nav spacing, full reload after sign-in, sign-in copy.
- **Style:** Matches #5/#6 (New Features, Enhancements, Bug Fixes, Technical, Known Issues).

---

## Homepage Stats: single row on small viewports

- **Goal:** Stats cards (Total Posts, Active Users, Recent Activity) stay in one row on mobile/small viewports instead of wrapping.
- **Changes:**
  - **HomeStats.js:** Grid changed from `repeat(auto-fit, minmax(200px, 1fr))` to fixed 3-column layout via class `home-stats-grid`; cards use `home-stats-card` with `minWidth: 0` so they can shrink. Added classes `home-stats-number`, `home-stats-label`, `home-stats-sublabel`, `home-stats-number-sm`, `home-stats-two-col` for responsive scaling.
  - **globals.css:** `.home-stats-grid` uses `grid-template-columns: repeat(3, minmax(0, 1fr))`; `.home-stats-card { overflow: hidden }`. At `max-width: 640px`, reduced gap, padding, and font sizes for stats numbers/labels so three cards fit in one row.

---

## Session summary (everything we've done)

Consolidated notes for all changes made in this session (post–dev update #7):

### Easter egg (mobile drag)
- **Issue:** Easter egg drag on Feed link didn’t work well on mobile (touch scroll fighting drag).
- **Fix:** `touch-action: none` on armed Feed link in `globals.css`; during drag in `SiteHeader.js`, set `document.body.style.touchAction = 'none'` and restore on pointerup/pointercancel.

### Feed & mobile scaling
- **Issue:** Feed page didn’t shrink correctly on mobile.
- **Fix:** Viewport export in `layout.js` (`width: 'device-width', initialScale: 1, maximumScale: 5`); mobile CSS in `globals.css` for `.forum-title`, `.section-title`, etc. at `max-width: 640px`.

### Profile page: Recent Activity for other users
- **Issue:** Recent Activity showed only on own account page, not on other users’ profile pages.
- **Fix:** Await `params` in `src/app/profile/[username]/page.js` (Next.js 15); added `posts` (Art, Bugs, Rant, Nostalgia, Lore, Memories) and `post_comments` to profile recent-activity queries and counts so activity from those sections appears.

### Buttons stretching on small viewports
- **Issue:** Buttons (e.g. Development section) stretched on mobile/small viewports.
- **Fix:** CSS in `globals.css` for `.page-top-row-right button`, `.page-top-row-right form button`, `.nav-menu-button`: `display: inline-flex`, `width: max-content`, `flex: 0 0 auto` (with `!important` where needed). Adjusted `.page-top-row .breadcrumb-item` min-height to 40px.

### Explore Sections (homepage)
- **Issue:** Section cards needed post count in top-right, clearer activity label, and empty-state copy.
- **Fix:** `HomeSectionCard.js`: post count in card header opposite title; label "Latest drip:"; new `.section-card-empty-cta` with Errl-themed message "The goo is quiet here — head in and post something." when no recent activity. Matching CSS in `globals.css`.

### Section post counts exclude deleted
- **Issue:** Deleted posts were included in section post counts on homepage.
- **Fix:** All relevant `COUNT(*)` queries in `src/app/page.js` (Timeline, Forum, Events, Music, Projects, Shitposts, Art & Nostalgia, Bugs & Rants, Development, Lore & Memories) now include `(is_deleted = 0 OR is_deleted IS NULL)`.

### Homepage Stats: single row on small viewports
- **Issue:** Stats cards wrapped to two rows on mobile.
- **Fix:** Fixed 3-column grid (`repeat(3, minmax(0, 1fr))`), `home-stats-card` with `minWidth: 0` and responsive classes; at `max-width: 640px` reduced gap, padding, and font sizes so all three cards stay in one row.
