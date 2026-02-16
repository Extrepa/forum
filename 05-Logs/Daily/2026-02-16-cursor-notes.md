# Daily Log - 2026-02-16 - Cursor Notes

## Feed layout (consolidated – all changes)

Summary of feed layout changes made this session:

### Current structure (after follow-up: three-row, last activity bottom right)

- **Row 1:** Title (left) + stats inline on right (e.g. "21 views · 1 reply · 1 like").
- **Row 2:** "by [user] at [date]" only (non-events). For events: by user + event info + attended, centered.
- **Row 3:** Last activity, right-aligned (bottom right), when present. Same for events and non-events.

### Files changed

**`src/lib/dates.js`**
- Added `formatDateTimeShort(timestamp)` for compact date/time in feed/meta. Uses `toLocaleDateString` + `toLocaleTimeString` (en-US, FORUM_TIME_ZONE). Omits year when same as current year; uses 2-digit year when different. Joins with a single space (e.g. "2/15 9:02 PM") to avoid locale odd characters.

**`src/components/PostMetaBar.js`**
- Row 1: title + `statsInline` (statLines joined with middot).
- Row 2: `byUserAtTime` only. Row 3: last activity, right-aligned, when `hasLastActivity`.
- Uses `formatDateTimeShort` for createdAt and lastActivity.
- `customRowsAfterTitle` prop overrides rows 2 and 3 (used for events).

**`src/app/feed/page.js`**
- Non-events: passes `lastActivity`, etc.; PostMetaBar renders row 2 (by user) and row 3 (last activity right).
- Events: passes `customRowsAfterTitle` with event-row2 (by user + centered event info) and event-row3 (last activity right).
- Completed events (`hasPassed`): "Yesterday 6:00 PM (Event happened) · N attended" (no "Starts"); "N attended" has `title={attendeeNames}` so names show on hover; class `event-attendee-count--hover-only` for cursor.
- Upcoming events: "Starts ... (relative) · N attending: name1, name2".
- All timestamps use `formatDateTimeShort`.
- `item.meta` still rendered for non-events when present.

**`src/app/globals.css`**
- `.list-item h3`: margin 0 to reduce title-to-by spacing.
- `.post-meta-row2`: flex, flex-wrap wrap, gap 4px 10px (no nowrap; allows wrapping).
- `.post-meta-row3`: flex, justify-content flex-end, min-width 0.
- `.event-row2`, `.event-row2-centered`, `.event-row2-middle`, `.event-row3`: event three-row layout.
- `.event-details-inline`: inline-flex for event info; `.event-details-icon` color and spacing.
- `.event-attendee-count--hover-only`: cursor help for completed-event attendee count.
- overflow-wrap and word-break on post-meta-row2, post-meta-row3, event-row2 to prevent overlap.
- At 640px: event-row2 stacks as column, align-items center.

### Double-check (verification)

- **PostMetaBar:** Row 1 = title + statsInline. When `customRowsAfterTitle` is null: row 2 = byUserAtTime only, row 3 = last activity (flex, justify-content flex-end) when `hasLastActivity`. When `customRowsAfterTitle` provided (events): replaces rows 2 and 3 entirely.
- **Non-events:** lastActivity passed; hasLastActivity = lastActivity && replies > 0; row 3 renders with right-aligned "Last activity by X at [time]".
- **Events:** lastActivity=undefined to PostMetaBar; customRowsAfterTitle returns fragment: event-row2 div (byUser + event-row2-middle with eventInfo) and optionally event-row3 div (last activity right) when item.lastActivity && item.replies > 0.
- **Event row 2 content:** hasPassed ? "date time (Event happened) · N attended" : "Starts date time (relative) · N attending: names". Completed: "N attended" has title=names, event-attendee-count--hover-only.
- **formatDateTimeShort:** Used for createdAt, lastActivity in PostMetaBar and feed; formatEventDate/formatEventTime for event dates.
- **CSS:** post-meta-row2 has flex-wrap wrap (no nowrap media query). post-meta-row3 and event-row3 use justify-content flex-end. event-row2-centered uses justify-content center. At max-width 640px, event-row2 becomes flex-direction column, align-items center.
- **Overlap prevention:** overflow-wrap: break-word, word-break: break-word on row2, row3, event-row2.

### Follow-up: three-row layout, last activity bottom right, responsive cleanup

- **Request:** Events stay three rows; event info and attended list centered in row 2; last activity in bottom right for all items; fix overlap when viewport narrows.
- **PostMetaBar:** Reverted to three-row structure. Row 2 = by user only. Row 3 = last activity, right-aligned (justify-content: flex-end). Replaced `row2Suffix` with `customRowsAfterTitle` – when provided, replaces rows 2 and 3 (used for events).
- **Events:** Use `customRowsAfterTitle` with three-row layout: event-row2 (by user + event info centered), event-row3 (last activity right). Event info includes icon, date/time, attended/attending. Row 2 uses `event-row2-centered` and `event-row2-middle` for centered layout.
- **CSS:** Added `.post-meta-row3` with justify-content: flex-end. Added `.event-row2`, `.event-row2-centered`, `.event-row2-middle`, `.event-row3`. Removed the `nowrap` media query that forced row 2 onto one line. Added `overflow-wrap: break-word` and `word-break: break-word` to prevent overlap. At 640px, event-row2 stacks as column with centered content.
- **Responsive:** event-row2 uses flex-wrap; on narrow viewports it becomes flex-direction: column so by user and event info stack without overlapping.

## Profile page: padding between profile card and tab switcher

- **`src/app/globals.css`**: `.profile-tabs-wrapper` `margin-top` changed from `0` to `12px` so the tab switcher (Activity, Gallery, Notes, Socials, Stats) has spacing above it. Media queries still reduce to 8px/4px on smaller viewports.

### Double-check
- **Padding amount:** Stack uses `gap: 10px`; profile-card-bio uses `16px`. Using `12px` for the tab wrapper adds visible breathing room without over-spacing (avoids increasing things too much).
- **Square glow on tab switcher:** The glow around the selected tab (Activity, etc.) can appear rectangular/square rather than smoothly rounded. Likely cause: `.tabs-pill-inner` has `overflow-y: hidden`, which clips the vertical extent of the sliding indicator’s `box-shadow` (`0 0 24px`). The indicator has `border-radius: 999px` but when the glow is clipped by the parent, it shows sharp horizontal cut-offs. Possible fix for later: add vertical padding to `.tabs-pill-inner` to give the glow room, or revisit overflow so the glow isn’t clipped.

## Edit notifications modal: collapsible sections to reduce height

### Request
- Tighten up the Edit notifications modal; many options made it long. Hide some content behind a click to reduce height.

### Implementation (`src/app/account/AccountSettings.js`)

1. **`CollapsibleSection` component**
   - Reusable control: clickable label + chevron (▲/▼). When expanded, renders children. Used for two long blocks.

2. **Forum thread sections (Site notifications)**
   - "Choose which types below" (Lobby + Sections toggles) is now behind a collapsible: "Choose which forum sections..." / "Hide forum sections". Collapsed by default so the modal is shorter; user can expand to pick sections.

3. **Post manipulation & user changes (Admin notifications)**
   - The list of admin event toggles (deleted, edited, hidden, locked, moved, pinned, restored, user deleted, user role changed) is now behind a collapsible: "Post manipulation & user changes..." / "Hide post/user alerts". Collapsed by default.

4. **State**
   - `showForumSections` and `showAdminEvents` (useState, default false) in `NotificationsEditor` control expansion.

### Verification
- No new linter errors. Modal shows fewer lines by default; expanding each section reveals the same toggles as before.

## Account Settings: Custom Neon color picker

### Issue
- Color theme dropdown included "Custom Neon" but there was no UI to choose the neon color, so the option did nothing useful.

### Implementation (`src/app/account/AccountSettings.js`)

1. **Neon color row (only when Color theme = Custom Neon, value 2)**
   - **Color picker:** `<input type="color">`; value is validated hex or fallback `#34e1ff`. On change: update local hex input state, `setUiBorderColor`, and `handleSaveSiteUi({ borderColor })` so choice persists and applies immediately.
   - **Hex text input:** Controlled by `customNeonHexInput` (local state). User can type/paste with or without `#`. On blur: normalize to `#rrggbb`, revert to current saved or `#34e1ff` if invalid; if normalized value differs from saved, call `setUiBorderColor` and `handleSaveSiteUi({ borderColor })`.

2. **State**
   - `customNeonHexInput` keeps the hex field editable without saving on every keystroke. Synced from context via `useEffect` when `uiColorMode` or `uiBorderColor` changes so picker and context stay in sync.

3. **Default when switching to Custom Neon**
   - Color theme dropdown `onChange`: when `mode === 2` and current `uiBorderColor` is missing or not a valid 6-digit hex, set `payload.borderColor = '#34e1ff'` so the first time a user selects Custom Neon they get a default and it is persisted.

4. **Save path**
   - `handleSaveSiteUi(patch)` now supports `patch.borderColor`. Builds `newUi.borderColor` from patch or existing `uiBorderColor`, includes `borderColor` in `uiPrefsDirty` when present, sends `newUi` to `POST /api/auth/ui-prefs`. On success, calls `setUiBorderColor(patch.borderColor)` when provided. API and `UiPrefsProvider` already supported `borderColor` / `ui_border_color`; only the Account Settings UI was missing the controls.

### Double-check (verification)
- `useUiPrefs()` supplies `uiBorderColor` / `setUiBorderColor`; `/api/auth/ui-prefs` accepts `borderColor` and writes `ui_border_color`; `/api/auth/me` returns `uiBorderColor`; layout passes `initialBorderColor` into `UiPrefsProvider`. No API or provider changes required.
- Color picker value is always a valid 6-digit hex (or fallback) so native input never receives invalid value.
- Hex input onBlur normalizes and only saves when normalized !== current, avoiding redundant requests.
- Lint: no new errors in `AccountSettings.js`.

## Account page pop-out modals: mobile glitch fix + same flow as create/edit posts

### Request
- Fix glitchy pop-out modals on the account page on mobile (recursive screenshot / overlapping duplicate modals, Delivery channels / Admin notifications / Edit notifications).
- Copy the look and flow of these modals for creating and editing posts so they match.
- Ensure notification options are clear and support users who want to be reminded about forum activity (forum-wide, delivery channels, etc.).

### Root cause (mobile glitch)
- Account modals use `CreatePostModal` with `className="account-edit-modal"` but did not use the same CSS overrides as `.create-post-modal` / `.edit-post-modal`. So they still had global `.modal-content::before` / `::after` neon pseudo-elements, which on mobile (especially Android Chrome) can cause compositing glitches and a “nested screenshot” effect.
- `backdrop-filter: blur(12px)` on the modal content can trigger similar compositing bugs on some mobile browsers.

### Implementation

1. **`src/components/CreatePostModal.js`**
   - Disable `backdrop-filter` on mobile (`isMobile ? 'none' : 'blur(12px)'`) to avoid recursive viewport capture.
   - Use a more opaque background on mobile for the modal content (`rgba(7, 27, 37, 0.98)`) so the overlay does not show through when blur is off.

2. **`src/app/globals.css`**
   - Applied the same modal treatment to `.account-edit-modal` as for create/edit modals:
     - Single gradient border (no neon pseudo-elements on the modal shell).
     - `.account-edit-modal::before` and `::after` set to `content: none !important; display: none !important`.
     - `.account-edit-modal .card` and `.account-edit-modal .card::before/::after` included in the card-flattening rules so inner notification cards don’t double-render borders.

3. **`src/app/account/AccountSettings.js`**
   - Added a short tip in the Edit notifications sheet: “Enable email and the triggers you want to get reminded about activity across the forum (replies, mentions, likes, etc.). Add a phone number to also get SMS.”

### Flow alignment
- Create/edit post modals and account sheets (contact, password, notifications) already use the same `CreatePostModal` component. The fix was to give account modals the same CSS (no pseudo-elements, same border treatment) so they look and behave the same and no longer glitch on mobile.

### Notifications
- Existing options kept as-is: Site (RSVP, Like, Project update, Mention, Reply, Comment), Delivery (Email, SMS with phone), Admin (new user, new forum threads, new forum replies). Tip copy clarifies how to get maximum reminders. Forum-wide or nomad-specific digest options would require backend/API support and are not in this pass.

### Verification
- `npm run lint` (pass).
- No new linter errors in modified files.

## Section intro: Development "Show hidden" overlapping description on mobile

### Request
- On the Development section, the "Show hidden" button overlapped the descriptive subtitle ("Updates, notes, and in progress."). Nomads wrapped correctly with the longer description.

### Fix
- `src/app/globals.css`: At `max-width: 600px`, stack section-intro so meta (title + desc) is full-width on top and actions are below. Prevents overlap regardless of description length.

## Home Explore Sections: glow, description wrap, empty CTA row, post count

### Request
- Remove pink/hover glow on section cards (hover and click).
- When expanded, show full description wrapped (no truncation).
- On mobile, put "Open section" and "The goo is quiet here..." on the same row (smaller text if needed).
- Condense post count; show (24h) when recent; dot color for recent (last 24h).

### Implementation

1. **`src/app/globals.css`**
   - `.home-section-card::after` and `:hover::after` / `:focus-within::after`: set `opacity: 0` and `box-shadow: none` so section cards have no neon glow.
   - `.home-section-card.is-expanded .home-section-card__headline-description`: `white-space: normal`, `overflow: visible`, `text-overflow: unset` so description wraps when expanded.
   - Empty state: moved CTA into `.home-section-card__details-head.is-empty`; in `@media (max-width: 640px)` same-row layout with smaller font (10px), CTA and "Open section" in one row.
   - `.section-card-recent-badge`: green (#57ffbe) for "(24h)" label.

2. **`src/components/HomeSectionCard.js`**
   - Count: show number only plus ` (24h)` when `hasRecentInLast24h`; `title={countLabel}` for a11y.
   - Empty expanded state: render "The goo is quiet here..." inside `.details-head.is-empty` next to "Open section" (no separate paragraph below).
   - Dot already had `.is-recent` for last-24h; kept as-is.

## Feed page: mobile/narrow viewport layout (PostMetaBar + events)

### Request
- Keep "by username at time" as one block; when the title wraps, put it on the next row (never split mid-line).
- Keep view/reply/like counts on the right; when wrapping, stack them in a column on the right.
- Three-row layout when needed: row 1 = title, row 2 = by user at time, row 3 = last activity (bottom left) + views/replies/likes (right, stacked).
- Event posts: event info centered; attended above last activity (bottom left); view and reply counts stacked in a column on the right.

### Implementation

1. **`src/components/PostMetaBar.js`**
   - Restructured to three explicit rows. Row 1: title only (no inline author) so title wraps cleanly. Row 2: "by username at time" block plus stats column on the right when there is no last activity. Row 3 (when last activity): last activity text on the left, stats as a column (one line per stat, `align-items: flex-end`) on the right.
   - Stats rendered as a column of spans instead of one joined string.
   - Added `hideStats` prop so feed can hide stats in PostMetaBar for events and show them in the event block.
   - Removed condensed desktop/mobile variants and standalone date row; date lives inside "by user at time".

2. **`src/app/feed/page.js`**
   - PostMetaBar for events: `hideStats={true}`.
   - Event block: event info row stays centered. New bottom row: left = attended + last activity (stacked in a column), right = views and replies stacked in a column. Bottom row only renders when there are attendees, last activity, or stats.

3. **`src/app/globals.css`**
   - Replaced old PostMetaBar desktop/mobile media rules (condensed-author, stats-desktop/mobile, date-mobile-only, etc.) with minimal rules: `.post-meta-title-row`, `.post-meta-by-row`, `.post-meta-row3`, `.post-meta-stats-column` for min-width and alignment; smaller font for last-activity on mobile; event-info-row center.

### Follow-up: no extra rows, tighter spacing

- **Stats stay on same row:** Row 2 and row 3 use `flexWrap: 'nowrap'` so the stats column never wraps to an additional row; left side uses `flex: '1 1 auto', minWidth: 0` so it absorbs space and wraps internally. Same for feed event bottom row (`event-bottom-row`): `flexWrap: 'nowrap'` so views/replies stay on the right of the same row as attended/last activity.
- **"By user at time" wrapping:** Removed `white-space: nowrap` from the by-block so it can wrap inside its cell on narrow viewports instead of forcing overflow; stats remain right-aligned on the same row.
- **Tighter vertical gap:** PostMetaBar column gap reduced from 4px to 2px between title row, by-user row, and last-activity row (less space between title/section label and "by username at time").

## Account / Edit Profile: header + remove breadcrumb buttons

### Request
- Add "Edit Profile" header and divider to the Edit Profile tab, mirroring the Account tab's "Account Settings" style.
- Remove "View Public Profile" and "Edit profile" buttons from the breadcrumb row under the header (now available in kebab menu).

### Implementation

1. **`src/app/account/AccountTabsClient.js`**
   - Added "Edit Profile" h2 with `section-title` class and matching hr divider above the Edit profile card content.
   - Styling matches Account tab: `marginBottom: 16px` on header div, `hr` with `marginTop/Bottom: 16px`, `borderTop: 1px solid rgba(255, 255, 255, 0.1)`.

2. **`src/app/account/page.js`**
   - Removed `page-top-row` block that contained the "View Public Profile" link.
   - Removed unused `Link` import.
   - Page now renders stack > AccountTabsClient only.

3. **`src/app/profile/[username]/page.js`**
   - Removed `page-top-row` block that contained the "Edit profile" link (when `isOwnProfile`).
   - Removed unused `Link` import.
   - Page now renders stack > section.card.profile-card directly.

### Verification (double-check)
- **Account page**: No `page-top-row`, no "View Public Profile" link. `Link` import removed; `stack` wraps `AccountTabsClient` directly.
- **Profile page**: No `page-top-row`, no "Edit profile" button. `Link` import removed; `stack` wraps `section.card.profile-card` directly. Profile page itself had no other `Link` usage; child components (e.g. ProfileTabsClient) import their own.
- **AccountTabsClient**: Edit Profile tab content (when `activeTab === 'profile'`) has "Edit Profile" h2 + hr + account-edit-card, matching Account tab structure.
- **page-top-row**: Still used by `PageTopRow.js` and other pages (e.g. projects, forum); only removed from account and profile pages.

## Additional notification types (Edit notifications modal)

### Request
- User expected additional notification types in the Edit notifications modal; only the original set (RSVP, Like, Project update, Mention, Reply, Comment, Delivery, Admin) was visible.

### Implementation

1. **Migration `migrations/0067_add_forum_nomad_notification_prefs.sql`**
   - Added `notify_new_forum_threads_enabled` and `notify_nomad_activity_enabled` (INTEGER NOT NULL DEFAULT 0) to `users`.

2. **API and auth**
   - **`src/app/api/auth/notification-prefs/route.js`**: Accept and persist `newForumThreadsEnabled`, `nomadActivityEnabled`; return them in the JSON response.
   - **`src/lib/auth.js`**: Main and admin SELECTs include the new columns; fallback paths set both to 0 when columns are missing.
   - **`src/app/api/auth/me/route.js`**: Return `notifyNewForumThreadsEnabled`, `notifyNomadActivityEnabled`.
   - **`src/app/api/admin/users/[id]/delete/route.js`**: When anonymizing a user, set both new prefs to 0.

3. **UI `src/app/account/AccountSettings.js`**
   - **notifPrefs**: Added `site.newForumThreads` and `site.nomadActivity` (default false; support snake_case and camelCase from API).
   - **handleSaveNotifs**: Payload includes `newForumThreadsEnabled`, `nomadActivityEnabled`.
   - **NotificationsEditor**: In the Site notifications card, added:
     - **New forum threads** with helper text: "When someone starts a new thread in the forum."
     - **Nomad section activity** with helper text: "When there's new content in the Nomad section."

### Deploy note
- Run migration 0067 before or with deploy; notification-prefs UPDATE and auth SELECTs expect the new columns. Fallback auth path handles missing columns (defaults to 0).

### Follow-up (not in this pass)
- **Sending**: When a new forum thread is created, notify users with `notify_new_forum_threads_enabled = 1` (in addition to existing admin notifications). When nomad-scoped content is created, notify users with `notify_nomad_activity_enabled = 1`. Requires wiring in thread-creation and nomad-post creation APIs plus outbound (email/SMS) if desired.

## New forum threads: per-section / per–thread-type toggles

### Request
- "New forum threads" should have additional toggles for specific thread types, section types, or whatever across the forum.

### Implementation

1. **`migrations/0068_add_notify_new_content_sections.sql`**
   - Added `notify_new_content_sections` TEXT NOT NULL DEFAULT '{}' to `users`. JSON object keyed by section/thread type (e.g. `lobby_general`, `lobby_shitposts`, `art`, `rant`, `lore`, …).

2. **`src/lib/notificationSections.js`**
   - Central list of keys and labels: **Lobby** (General (Lobby), Shitposts), **Sections** (Art, Nostalgia, Bugs, Rant, Lore, Memories, About, Nomads). Helpers: `parseNewContentSectionsJson`, `defaultNewContentSections`, `ALL_NEW_CONTENT_KEYS`.

3. **API and auth**
   - **notification-prefs**: Accepts `newForumThreadSections` (object), sanitizes to allowed keys, saves as JSON. Returns `notifyNewContentSections` in response.
   - **auth.js**: Main and admin SELECTs include `notify_new_content_sections`; fallbacks set to `'{}'` when column missing.
   - **/api/auth/me**: Returns `notifyNewContentSections` (parsed object).
   - **admin user delete**: Sets `notify_new_content_sections = '{}'` when anonymizing.

4. **AccountSettings.js**
   - **notifPrefs**: Added `newForumThreadSections` (parsed from user, merged with default keys).
   - **anySiteNotifsEnabled(prefs)**: Now treats "site notifs on" when either any site toggle is on or (newForumThreads master on and any section toggle on).
   - **handleSaveNotifs**: Payload includes `newForumThreadSections`.
   - **NotificationsEditor**: Under "New forum threads" master toggle, added indented block "Lobby" (General (Lobby), Shitposts) and "Sections" (Art, Nostalgia, Bugs, Rant, Lore, Memories, About, Nomads) with a ToggleLine per key.

### Deploy
- Run migration 0068 with 0067; notification-prefs and auth expect `notify_new_content_sections`. Fallback auth path uses `'{}'` if column missing.

## Admin notifications: post manipulation and user changes

### Request
- Add admin notification options for posts being deleted and other post manipulation (edit, hide, lock, move, pin, restore), plus user-related events (user deleted, user role changed).

### Implementation

1. **Migration `migrations/0069_add_notify_admin_events.sql`**
   - Added `notify_admin_events` TEXT NOT NULL DEFAULT '{}' to `users`. JSON object keyed by event type.

2. **`src/lib/adminNotificationEvents.js`**
   - Event keys and labels: Post/content deleted, edited, hidden, locked, moved, pinned, restored; User deleted; User role changed. Helpers: `parseAdminEventsJson`, `defaultAdminEvents`, `ADMIN_EVENT_KEYS`, `ALL_ADMIN_EVENT_KEYS`.

3. **API and auth**
   - **notification-prefs**: For admins, accepts `adminEvents` (object), sanitizes to allowed keys, saves as JSON in `notify_admin_events`. Non-admins get `notify_admin_events = '{}'`. Response includes `notifyAdminEvents`.
   - **auth.js**: Main and admin SELECTs include `notify_admin_events`; fallbacks set to `'{}'`.
   - **/api/auth/me**: Returns `notifyAdminEvents` (parsed object).
   - **admin user delete**: Sets `notify_admin_events = '{}'` when anonymizing.

4. **AccountSettings.js**
   - **notifPrefs**: Added `adminEvents` (parsed from user, merged with default keys).
   - **handleSaveNotifs**: Payload includes `adminEvents` for admins.
   - **Admin notifications card**: After the existing three toggles (New user signups, New forum threads, New forum replies), added subsection "Post manipulation & user changes" with a ToggleLine per event (post_deleted, content_edited, content_hidden, content_locked, content_moved, content_pinned, content_restored, user_deleted, user_role_changed).

5. **`src/lib/adminNotifications.js`**
   - **notifyAdminsOfEvent({ db, eventType, actorUser, targetType, targetId })**: Loads admins, filters by `notify_admin_events` JSON for the given `eventType`, inserts notifications with type `admin_event`. For use when wiring delete/edit/hide/lock/move/pin/restore/role routes.

6. **`src/components/NotificationsMenu.js`**
   - Added branch for `n.type === 'admin_event'`: resolve href from target_type/target_id, label "Moderation: [content type] updated" or "Moderation activity".

### Follow-up (sending)
- In each relevant route (e.g. post delete, forum delete, edit, hide, lock, move, pin, restore, user delete, user role change), call `notifyAdminsOfEvent({ db, eventType: 'post_deleted' | 'content_edited' | ... })` with the appropriate event type and target. No routes were wired in this pass; prefs and helper are in place.

## Song links & music posts: auto-detect provider from URL

### Request
- Replace separate "URL" + "provider dropdown" with a single URL field that auto-detects provider (YouTube, YouTube Music, SoundCloud, Spotify).
- Optionally improve how music posts display the embed (provider label).

### Implementation

1. **`src/lib/embeds.js`**
   - **`detectProviderFromUrl(url)`**: Returns `'youtube' | 'youtube-music' | 'soundcloud' | 'spotify' | null` from URL host/path (spotify.com, music.youtube.com, youtube.com/youtu.be, soundcloud.com).

2. **Music posts**
   - **MusicPostForm.js**: Single "Song or embed URL" field; type is derived via `detectProviderFromUrl(url)` and shown as "Detected: [Provider]"; hidden `name="type"` for submit. SoundCloud player-style dropdown still shown when SoundCloud is detected.
   - **POST /api/music/posts**: If `type` is missing, set `type = detectProviderFromUrl(url)`; if still missing, return `error=invalid`. Requires only title + url.

3. **Profile song (account)**
   - **AccountTabsClient.js**: Single Song URL field; on change, set `profileSongProvider` to `detectProviderFromUrl(url)`; removed provider dropdown; show "Detected: [Provider]" under the input when URL is present. `getProfileSongProviderLabel` now uses `getSongProviderMeta(value).label` (removed `PROFILE_SONG_PROVIDERS` list).
   - **POST /api/account/profile-extras**: When `songUrl` is set and `songProvider` is empty, set `songProvider = detectProviderFromUrl(songUrl) || 'soundcloud'` (was hardcoded `'soundcloud'`).

4. **Display on music posts**
   - **music/[id]/page.js** and **MusicClient.js**: Show a small muted "PROVIDER" label (e.g. "YouTube", "SoundCloud") above the embed iframe on detail page and feed cards.

5. **`src/lib/songProviders.js`**
   - **getSongProviderMeta**: Prefer direct lookup by raw value so `'youtube-music'` returns "YouTube Music" label instead of being normalized to `'youtube'` for display.

### Follow-up: URL and content-type coverage

6. **`src/lib/embeds.js`** (second pass)
   - **Spotify embed URL**: Fixed to use `/embed/{type}/{id}` (was `/embed/{id}`). **parseSpotifyEmbed(url)** returns `{ type, id }` for: track, album, playlist, artist, episode, show. **spotifyPlayerSrc(embedType, id, autoPlay)** builds correct URL.
   - **Spotify detection**: **detectProviderFromUrl** now recognizes Spotify URLs with `/artist/`, `/episode/`, `/show/` in addition to track/album/playlist (SPOTIFY_EMBED_PATH_PREFIXES).
   - **Spotify embed height by type**: track 152px, episode/show 232px, album/playlist/artist 380px (**spotifyEmbedHeight**).
   - **YouTube video ID**: **parseYouTubeId** now also handles `/live/VIDEO_ID` and `/v/VIDEO_ID`; youtu.be path trimmed and first segment used so IDs with query params still work.

### Verification & coverage checklist

**Files touched (all verified):**

| File | Role |
|------|------|
| `src/lib/embeds.js` | detectProviderFromUrl, parseYouTubeId/PlaylistId, parseSpotifyEmbed, safeEmbedFromUrl, Spotify/SoundCloud helpers; single source of truth for URL → embed. |
| `src/lib/songProviders.js` | getSongProviderMeta (display labels); direct lookup so youtube-music shows "YouTube Music". |
| `src/components/MusicPostForm.js` | Single URL field; type from detectProviderFromUrl; hidden type input; "Detected: [Provider]"; SoundCloud player-style when SoundCloud. |
| `src/app/api/music/posts/route.js` | Infers type from URL when missing; validates with safeEmbedFromUrl. |
| `src/app/api/account/profile-extras/route.js` | Infers songProvider from detectProviderFromUrl(songUrl) when URL set and provider empty. |
| `src/app/account/AccountTabsClient.js` | Single Song URL field; provider set on change via detectProviderFromUrl; "Detected: [Provider]"; no provider dropdown. |
| `src/app/music/page.js` | Feed: builds embed with safeEmbedFromUrl(row.type, row.url, row.embed_style). |
| `src/app/music/MusicClient.js` | Feed cards: provider label above embed via getSongProviderMeta(row.type).label. |
| `src/app/music/[id]/page.js` | Detail: safeEmbedFromUrl(post.type, post.url, post.embed_style); provider label above embed. |
| `src/components/ProfileSongPlayer.js` | safeEmbedFromUrl(provider, songUrl, embedStyle, autoPlay) for profile player. |

**URL / content-type coverage:**

| Provider | Detection (host/path) | Single item | Playlist / album / show | Embed behaviour |
|---------|------------------------|-------------|--------------------------|-----------------|
| **YouTube** | youtu.be, *youtube.com | watch?v=, embed/, shorts/, live/, v/, youtu.be | list= or /playlist/ | video + optional list; playlist-only → videoseries. |
| **YouTube Music** | music.youtube.com | same as YouTube | same | same embed logic as YouTube. |
| **SoundCloud** | *soundcloud.com | any track URL | path contains /sets/ | isSoundCloudPlaylist → height 450 when auto; else compact/artwork by embed_style. |
| **Spotify** | spotify.com + /track/, /album/, /playlist/, /artist/, /episode/, /show/ | track, episode | album, playlist, artist, show | parseSpotifyEmbed → /embed/{type}/{id}; height by type (152 / 232 / 380). |

**Edge cases covered:**

- Music post form: type required only from URL (or hidden input); API infers type if missing.
- Profile song: provider optional in request; API infers from URL when URL present and provider empty.
- Invalid or unsupported URL: detectProviderFromUrl returns null; safeEmbedFromUrl returns null → API returns error (music posts) or no embed (profile).
- Existing posts: stored `type` and `url` unchanged; display uses post.type for label and safeEmbedFromUrl(type, url, embed_style) for iframe.
- Edit music post: edit form still sends type (from existing post); no change required for edit flow.

## Library dropdown: center list item text and increase font size

### Request
- Library dropdown list items (Announcements, Art & Nostalgia, Bugs & Rants, etc.): text was top-left aligned and small. Center the text in each choice box and make the text a bit bigger. Do not change the size of the option boxes.

### Implementation (`src/app/globals.css`)

1. **`.header-library-list a`**
   - Changed `display: block` to `display: flex; align-items: center; justify-content: center` so the label is centered horizontally and vertically inside each row.
   - Kept `width: 100%`, padding (4px 6px), border-radius, and all other properties; box dimensions unchanged.

2. **`.header-library-item-label`**
   - Increased `font-size` from `10.5px` to `12px`.
   - Added `text-align: center` so the label text is centered (and any future wrap would center).

3. **Desktop override `@media (min-width: 901px)`**
   - `.header-library-list a`: removed redundant `font-size: 10.5px`; left only `padding: 5px 7px` so row size is unchanged.

4. **Small-viewport override** (inside existing nav media block)
   - `.header-library-item-label`: updated from `font-size: 11px` to `12px` to match the new base.

### Double-check
- **Centering**: Parent anchor is flex with `align-items: center` and `justify-content: center`; the inner span (label) is block with `text-align: center`. Text is centered in the box.
- **Box size**: No changes to padding, width, height, or grid; only display/alignment and label font-size.
- **No other overrides**: Grep confirmed no other rules for `.header-library-list a` or `.header-library-item-label` that would conflict.
- **Markup**: `SiteHeader.js` unchanged; list items remain `<a><span class="header-library-item-label">{item.label}</span></a>`.

## Account / Edit Profile: title padding, centering, and sub-tab glow

### Request
- Equal padding above and below the "Account Settings" and "Edit Profile" title text on both tabs.
- Center that title text on all viewports.
- Reduce the glow on the yellow sub-tab section titles (Recent activity, Gallery, Notes, etc.) on the Edit Profile tab.

### Implementation

1. **`globals.css`**
   - Added `.account-page-title-wrap`: `padding: 16px 0`, `text-align: center`; child `.section-title` margin set to 0 so padding defines vertical spacing.
   - `.account-edit-panel .section-title`: reduced glow from `0 0 10px rgba(245, 255, 183, 0.6)` to `0 0 6px rgba(245, 255, 183, 0.35)`.

2. **`AccountTabsClient.js`**
   - Account tab: title wrapper uses `className="account-page-title-wrap"`; hr `marginTop` set to 0 so space below title equals wrapper bottom padding (16px).
   - Edit Profile tab: same wrapper class and hr `marginTop: 0`.

### Double-check / verification

- **Scope of centered titles**: Only the two main page headings use `.account-page-title-wrap` (Account Settings at ~1058, Edit Profile at ~1073). All other `section-title` usages in this file (Username, Avatar, Mood & Song, Socials, Gallery, Notes, Stats, Recent activity) are inside content panels and are not wrapped, so they remain left-aligned as before.
- **Equal padding**: Wrapper has `padding: 16px 0`; hr has `marginTop: 0`, so the gap below the title is only the wrapper’s 16px bottom padding. Net: 16px above title, 16px below title.
- **Glow scope**: `.account-edit-panel .section-title` targets only headings inside `.account-edit-panel` (the sub-tab content). The main "Account Settings" and "Edit Profile" h2s are not inside `.account-edit-panel`, so they keep the default teal `.section-title` glow; only the yellow sub-tab titles (Recent activity, Gallery, Notes, etc.) get the reduced glow.
- **Responsive**: Media queries that alter `.section-title` (e.g. font-size at 3115, 8037) do not override padding or text-align; the wrap’s 16px padding and centering apply at all viewports.
- **Files touched**: `src/app/globals.css` (new class + one rule change), `src/app/account/AccountTabsClient.js` (two wrappers, two hr marginTop values). No other components (e.g. ProfileTabsClient, AccountSettings) use the new class.

## Notification wiring verification (new notification changes)

- **Prefs & UI (all users)**: Edit notifications modal has Site (New forum threads, forum sections collapsible, Nomad section activity), Delivery (email/SMS), and for admins Admin (New user/thread/reply + Post manipulation & user changes collapsible). All toggles save via `POST /api/auth/notification-prefs`; payload includes `newForumThreadsEnabled`, `nomadActivityEnabled`, `newForumThreadSections`, `adminEvents`. Auth/me and auth.js return the new columns; migrations 0067, 0068, 0069 add `notify_new_forum_threads_enabled`, `notify_nomad_activity_enabled`, `notify_new_content_sections`, `notify_admin_events`.
- **Display**: NotificationsMenu handles `admin_event` (and other types); notifications GET uses JOIN on actor_user_id (broadcast/test use admin id so rows are returned).
- **Wiring completed**: (1) **Site new forum threads**: `src/lib/siteNotifications.js` added with `notifyUsersOfNewForumThread()` (sectionKey lobby_general/lobby_shitposts) and `notifyUsersOfNewContent()` (section + nomad). Threads route and shitposts route call the former after create; posts route calls the latter so section toggles and nomad activity both fire. (2) **Admin events**: `notifyAdminsOfEvent()` now called from forum delete, posts delete, admin posts DELETE/POST (edit)/pin/restore, admin move, admin users delete/role, and all hide/lock routes (forum, posts, timeline, events, music, projects, devlog). (3) **Menu**: NotificationsMenu labels added for `new_forum_thread` and `new_content` (post section).

## Event comments: nested (threaded) replies

### Issue
- Event reply form showed "Replying to [username]" and submitted a hidden `reply_to_id`, but the API did not read or store it. Replies always appeared as top-level; no visual threading.

### Implementation (file-by-file)

1. **`migrations/0070_event_comments_threading.sql`** (new file)
   - `ALTER TABLE event_comments ADD COLUMN reply_to_id TEXT;`
   - `CREATE INDEX IF NOT EXISTS idx_event_comments_reply_to ON event_comments(reply_to_id);`
   - Pattern matches 0015 (devlog), 0014 (project_replies), 0029 (forum_replies).

2. **`src/app/api/events/[id]/comments/route.js`**
   - **GET**: SELECT now includes `event_comments.reply_to_id` so API consumers get threading data. If migration not applied, this GET will throw (no such column); event detail page does not use this GET (it uses server-side query in page.js).
   - **POST**:
     - Read `reply_to_id`: `formData.get('reply_to_id')`, trimmed; empty string → `null`.
     - **effectiveReplyTo**: If `replyToId` set, load parent with `SELECT id, reply_to_id FROM event_comments WHERE id = ? AND event_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)`. If no row → `effectiveReplyTo = null`. If `parent.reply_to_id` is set (parent is already a child) → `effectiveReplyTo = parent.reply_to_id` (one-level clamp). On any DB error in this block → `effectiveReplyTo = null`.
     - **INSERT**: First try `INSERT ... (id, event_id, author_user_id, body, created_at, reply_to_id) VALUES (..., effectiveReplyTo)`. On failure (e.g. column missing), fallback `INSERT ... (id, event_id, author_user_id, body, created_at)` with no reply_to_id (comment created as top-level).

3. **`src/app/events/[id]/page.js`**
   - **Main comments query** (around line 177): Adds `event_comments.reply_to_id` to the SELECT. Used when `is_deleted` column exists and migration 0070 is applied.
   - **Fallback comments query** (around line 196): Does **not** include `reply_to_id`. Used when first query fails (e.g. older DB without is_deleted). Comments from fallback have no `reply_to_id` so EventCommentsSection treats all as top-level.
   - **commentsWithHtml**: `return { ...c, ... }` preserves `reply_to_id` from `c`; no change needed. EventCommentsSection receives `comments={commentsWithHtml}`.

4. **`src/components/EventCommentsSection.js`**
   - **Data shape**: Expects each comment to have `id`, optional `reply_to_id`, and existing fields (author_name, body, body_html, created_at, etc.).
   - **byParent map**: `validReplyIds = Set(comments.map(c => c.id).filter(Boolean))`. For each comment, `key = (c.reply_to_id && validReplyIds.has(c.reply_to_id)) ? c.reply_to_id : null` so orphaned or invalid `reply_to_id` → top-level.
   - **Render**: Top-level = `byParent.get(null)`; for each top-level comment, children = `byParent.get(c.id)`. Each thread: wrapper `div.stack` with `key={thread-${c.id}}`, then `renderComment(c, { isChild: false })`, then if children exist `<div className="reply-children">` with `renderComment(child, { isChild: true })` for each. Child divs get class `reply-item--child` in addition to `list-item comment-card`.
   - **Form**: Unchanged; already had hidden `name="reply_to_id"` and "Replying to {author_name}" label. No change to ReplyButton, URL `?replyTo=`, or cancel behavior.

### Double-check / verification
- **Migration**: Single new migration file; no other migrations reference event_comments.reply_to_id.
- **API POST**: Parent check uses same event `id` (event_id) so cross-event reply_to_id is impossible; one-level clamp prevents deep threads.
- **API fallback INSERT**: Does not pass effectiveReplyTo; comment is stored without reply_to_id when column missing.
- **Event page**: Only the primary SELECT (with is_deleted filter) includes reply_to_id; fallback SELECT omits it so DBs without the column still load comments.
- **EventCommentsSection**: Orphan handling (validReplyIds) matches ProjectRepliesSection; CSS classes `reply-item--child` and `reply-children` already exist in globals.css and are used by project replies and lobby/devlog.
- **Ordering**: Comments remain ordered by created_at ASC from the query; byParent groups by parent but does not reorder—top-level order is query order; children under a parent are in query order.

### Edge cases
- **Pre-migration DB**: POST fallback creates comment without reply_to_id; event page fallback query returns comments without reply_to_id; UI shows all as top-level. After migration, new replies can be nested.
- **Existing comments**: No backfill; existing rows have no reply_to_id, so they all render as top-level.
- **Deleted parent**: If reply_to_id points to a deleted (or missing) comment, validReplyIds excludes it so that reply is shown as top-level.
- **GET /api/events/[id]/comments**: If migration not applied, GET fails when selecting reply_to_id. Event detail page does not use this endpoint; only server-side query in page.js is used. If any client fetches comments via this GET, run migration before deploy.

### Files touched (summary)
| File | Change |
|------|--------|
| `migrations/0070_event_comments_threading.sql` | New: add reply_to_id + index on event_comments. |
| `src/app/api/events/[id]/comments/route.js` | GET: select reply_to_id. POST: read reply_to_id, validate/clamp parent, INSERT with reply_to_id and fallback INSERT without. |
| `src/app/events/[id]/page.js` | Main comments SELECT: add event_comments.reply_to_id. Fallback SELECT: unchanged (no reply_to_id). |
| `src/components/EventCommentsSection.js` | Build byParent from reply_to_id, render top-level then reply-children with reply-item--child. |
| `05-Logs/Daily/2026-02-16-cursor-notes.md` | This log entry. |

### Deploy
- Run migration **0070** before or with deploy so event_comments has reply_to_id. Then new "Reply" submissions store the parent and display as nested under the correct comment.

## Threading for all post and reply types (audit and implementation)

### Audit summary
| Type | Table | reply_to_id (DB) | API read/save + clamp | UI threading |
|------|--------|------------------|------------------------|--------------|
| Events | event_comments | Yes (0070) | Yes | EventCommentsSection |
| Projects | project_replies | Yes (0014) | Yes | ProjectRepliesSection |
| Forum/Lobby | forum_replies | Yes (0029) | Yes | lobby/[id] inline |
| Devlog | dev_log_comments | Yes (0015) | Yes | devlog/[id] inline |
| Post comments (sections) | post_comments | Yes (0017) | Saved but no clamp; UI flat | **Fixed** |
| Timeline/Announcements | timeline_comments | No | No | **Fixed** |
| Music | music_comments | No | No | **Fixed** |

### Changes made

1. **post_comments (sections: lore, memories, art, bugs, rant, nostalgia, lore-memories, nomads)**
   - **API** `src/app/api/posts/[id]/comments/route.js`: Added one-level clamp (effectiveReplyTo from parent lookup; if parent is already a child, use parent.reply_to_id). INSERT already had reply_to_id; now passes effectiveReplyTo.
   - **Shared component** `src/components/ThreadedCommentsSection.js`: New client component. Takes comments (with reply_to_id), replyLinkPrefix, action, hiddenFields, likePostType, deleteType, parentId, user, isAdmin, commentNotice, usernameColorMap, isLocked, sectionTitle. Builds byParent map, renders top-level then reply-children with reply-item--child; form with reply_to_id and "Replying to X"; listens to replyToChanged and URL replyTo.
   - **Section pages** (lore, memories, art, bugs, rant, nostalgia, lore-memories, nomads) `[id]/page.js`: Comments query now selects `post_comments.reply_to_id`; comments mapped to add body_html and reply_to_id string; inline comment list + CollapsibleCommentForm replaced with ThreadedCommentsSection. Unused imports (ReplyButton, DeleteCommentButton, CollapsibleCommentForm/CommentFormWrapper, formatDateTime) removed.

2. **timeline_comments (announcements)**
   - **Migration** `migrations/0073_timeline_comments_threading.sql`: Added reply_to_id TEXT and index on timeline_comments. (0071 was already used by notification_target_sub_id.)
   - **API** `src/app/api/timeline/[id]/comments/route.js`: GET selects reply_to_id, author_user_id, author_color_preference. POST reads reply_to_id; effectiveReplyTo with parent lookup and one-level clamp; INSERT with reply_to_id, fallback INSERT without.
   - **Page** `src/app/announcements/[id]/page.js`: Comments query with reply_to_id (try/catch fallback query without for rollout); comments mapped to body_html and reply_to_id; comment section replaced with ThreadedCommentsSection (replyLinkPrefix `/announcements/${id}`, action `/api/timeline/${id}/comments`, likePostType timeline_comment, deleteType timeline). Unused imports removed.

3. **music_comments**
   - **Migration** `migrations/0074_music_comments_threading.sql`: Added reply_to_id TEXT and index on music_comments.
   - **API** `src/app/api/music/comments/route.js`: POST reads reply_to_id; effectiveReplyTo with parent lookup and one-level clamp; INSERT with reply_to_id, fallback INSERT without.
   - **Page** `src/app/music/[id]/page.js`: First comments query selects music_comments.reply_to_id (fallback query unchanged for rollout); safeComments map includes reply_to_id, like_count, liked; comment section replaced with ThreadedCommentsSection (hiddenFields post_id, likePostType music_comment, deleteType music). Unused imports removed.

### Double-check / verification (threading)
- **Migrations**: 0070 (event_comments), 0073 (timeline_comments), 0074 (music_comments). No duplicate migration numbers (0071 = notification_target_sub_id, 0072 unused).
- **APIs**: All four comment/reply types that support threading now use effectiveReplyTo: events, posts (post_comments), timeline, music. Parent lookup scoped to same parent (event_id, post_id, update_id, post_id). One-level clamp (if parent.reply_to_id set, use it). Timeline and music have try/catch fallback INSERT without reply_to_id for pre-migration DBs. Post_comments has no fallback INSERT (0017 assumed applied).
- **ThreadedCommentsSection**: Used in 10 places: lore, memories, art, bugs, rant, nostalgia, lore-memories, nomads, announcements, music. byParent key = (reply_to_id && validReplyIds.has(reply_to_id)) ? reply_to_id : null. Renders top then reply-children with reply-item--child. Form has hidden reply_to_id when replyingTo set; replyToChanged and URL replyTo open form and set replyingTo.
- **Section pages**: All 8 post_comments sections select post_comments.reply_to_id and map comments to body_html and reply_to_id. Announcements: try/catch with fallback query without reply_to_id. Music: first query has reply_to_id, fallback (in existing catch) does not; safeComments includes reply_to_id, like_count, liked.
- **No leftover UI**: Grep confirms no section or announcements or music [id] page still uses CollapsibleCommentForm or CommentFormWrapper for the comments block.

### Deploy (threading)
- Run **0073** for timeline_comments and **0074** for music_comments if not already applied. Post_comments already had reply_to_id (0017); no new migration. Section and announcements pages will show flat comments if reply_to_id column is missing (fallback queries); after migrations, new nested replies will display correctly.

## Notification cleanup on undo (like/unlike, delete, un-RSVP, comment/reply delete)

### Goal
- Keep notifications in sync with actions: when an action is undone (unlike, un-RSVP, post/thread/event/… deleted, comment/reply deleted), remove the corresponding notification so there are no broken links.

### Implementation

1. **`src/lib/notificationCleanup.js`** (new)
   - `deleteNotificationsForLike(db, postType, postId, actorUserId)` – remove like notification when user unlikes.
   - `deleteNotificationsForRsvp(db, eventId, actorUserId)` – remove RSVP notification when user un-RSVPs.
   - `deleteNotificationsForTarget(db, targetType, targetId)` – remove all notifications for a content (post, forum_thread, event, music_post, project, timeline_update, dev_log) when that content is soft-deleted.
   - `deleteNotificationsForTargetSubId(db, targetSubId)` – remove notifications for a specific comment/reply when that comment/reply is deleted (uses `target_sub_id`).
   - `insertNotificationWithOptionalSubId(db, row)` – insert notification with optional `target_sub_id`; if column missing, retries without it (rollout-safe).

2. **`migrations/0071_notification_target_sub_id.sql`**
   - `ALTER TABLE notifications ADD COLUMN target_sub_id TEXT;`
   - Index on `target_sub_id` for deletes.

3. **Undo wiring**
   - **Unlike**: `src/app/api/likes/route.js` – in the “existing like” branch, after `DELETE FROM post_likes`, call `deleteNotificationsForLike(db, postType, postId, user.id)`.
   - **Un-RSVP**: `src/app/api/events/[id]/rsvp/route.js` – when removing attendee, call `deleteNotificationsForRsvp(db, id, user.id)`.
   - **Content delete**: Call `deleteNotificationsForTarget(db, type, id)` in: `posts/[id]/delete`, `forum/[id]/delete`, `admin/posts/[id]` DELETE, `music/[id]/delete`, `events/[id]/delete`, `projects/[id]/delete`, `timeline/[id]/delete`, `devlog/[id]/delete`.
   - **Comment/reply delete**: Call `deleteNotificationsForTargetSubId(db, commentId|replyId)` in: `posts/…/comments/[commentId]/delete`, `events/…/comments/[commentId]/delete`, `forum/…/replies/[replyId]/delete`, `music/comments/[commentId]/delete`, `timeline/…/comments/[commentId]/delete`, `projects/…/replies/[replyId]/delete`, `devlog/…/comments/[commentId]/delete`.

4. **Setting `target_sub_id` on create**
   - Comment/reply notification INSERTs now use `insertNotificationWithOptionalSubId` with `target_sub_id: commentId|replyId` in: event comments, post comments, forum replies, timeline comments, music comments, project comments, project replies, devlog comments. This allows precise removal when that comment/reply is later deleted.

### Double-check (verification)

**Undo paths – all wired:**

| Action undone | Cleanup | Where |
|---------------|---------|--------|
| Unlike | `deleteNotificationsForLike(db, postType, postId, user.id)` | `api/likes/route.js` (existing-like branch) |
| Un-RSVP | `deleteNotificationsForRsvp(db, id, user.id)` | `api/events/[id]/rsvp/route.js` (existing-attendee branch) |
| Post deleted | `deleteNotificationsForTarget(db, 'post', id)` | `api/posts/[id]/delete/route.js` |
| Forum thread deleted | `deleteNotificationsForTarget(db, 'forum_thread', id)` | `api/forum/[id]/delete/route.js` |
| Admin soft-delete (any type) | `deleteNotificationsForTarget(db, type, id)` | `api/admin/posts/[id]/route.js` DELETE |
| Music post deleted | `deleteNotificationsForTarget(db, 'music_post', id)` | `api/music/[id]/delete/route.js` |
| Event deleted | `deleteNotificationsForTarget(db, 'event', id)` | `api/events/[id]/delete/route.js` |
| Project deleted | `deleteNotificationsForTarget(db, 'project', id)` | `api/projects/[id]/delete/route.js` |
| Timeline update deleted | `deleteNotificationsForTarget(db, 'timeline_update', id)` | `api/timeline/[id]/delete/route.js` |
| Dev log deleted | `deleteNotificationsForTarget(db, 'dev_log', id)` | `api/devlog/[id]/delete/route.js` |
| Post comment deleted | `deleteNotificationsForTargetSubId(db, commentId)` | `api/posts/[id]/comments/[commentId]/delete/route.js` |
| Event comment deleted | `deleteNotificationsForTargetSubId(db, commentId)` | `api/events/[id]/comments/[commentId]/delete/route.js` |
| Forum reply deleted | `deleteNotificationsForTargetSubId(db, replyId)` | `api/forum/[id]/replies/[replyId]/delete/route.js` |
| Music comment deleted | `deleteNotificationsForTargetSubId(db, commentId)` | `api/music/comments/[commentId]/delete/route.js` |
| Timeline comment deleted | `deleteNotificationsForTargetSubId(db, commentId)` | `api/timeline/[id]/comments/[commentId]/delete/route.js` |
| Project reply deleted | `deleteNotificationsForTargetSubId(db, replyId)` | `api/projects/[id]/replies/[replyId]/delete/route.js` |
| Dev log comment deleted | `deleteNotificationsForTargetSubId(db, commentId)` | `api/devlog/[id]/comments/[commentId]/delete/route.js` |

**Comment/reply creates using `target_sub_id`:** Event comments, post comments, forum replies (user-facing only), timeline comments, music comments, project comments, project replies, devlog comments. Forum **admin_reply** notifications still use a direct 7-column INSERT (no `target_sub_id`); when that reply is deleted, the admin notification remains but the link goes to the thread, which is still valid.

**Notification INSERTs not changed (no undo or already covered):** Likes and RSVP create then cleanup on undo. Site notifications (new thread, new content), admin notifications, signup/welcome, test/broadcast, mentions, project updates, event invites – either no undo in scope or the target is the parent content (deleted via `deleteNotificationsForTarget` when that content is deleted).

**Edge cases / notes:**
- **Mentions:** Created with `target_type`/`target_id` = parent (e.g. event, post). We do not set `target_sub_id` on mention notifications. If the specific comment containing the mention is deleted, the mention notification stays; link still goes to the parent. Optional future: pass optional `target_sub_id` into `createMentionNotifications` and set it so mention can be removed when that comment is deleted.
- **Event invite:** No “revoke invite” flow wired; if one is added later, remove notifications with `type = 'event_invite'` and `target_type = 'event'` and `target_id = eventId` and `user_id = invitedUserId` (or similar).
- **Project comments:** We set `target_sub_id` on project **comment** notifications, but there is no project comment delete route in this codebase (only project **replies** have a delete). So project comment cleanup is future-proofing only until a delete route is added.

### Files touched (summary)

| File | Change |
|------|--------|
| `src/lib/notificationCleanup.js` | New: like/RSVP/target/targetSubId delete helpers + insertNotificationWithOptionalSubId. |
| `migrations/0071_notification_target_sub_id.sql` | New: add target_sub_id column + index. |
| `src/app/api/likes/route.js` | Import cleanup; call deleteNotificationsForLike on unlike. |
| `src/app/api/events/[id]/rsvp/route.js` | Import cleanup; call deleteNotificationsForRsvp on un-RSVP. |
| `src/app/api/posts/[id]/delete/route.js` | Import cleanup; call deleteNotificationsForTarget('post', id). |
| `src/app/api/forum/[id]/delete/route.js` | Import cleanup; call deleteNotificationsForTarget('forum_thread', id). |
| `src/app/api/admin/posts/[id]/route.js` | Import cleanup; call deleteNotificationsForTarget(type, id) on DELETE. |
| `src/app/api/music/[id]/delete/route.js` | Import cleanup; call deleteNotificationsForTarget('music_post', id). |
| `src/app/api/events/[id]/delete/route.js` | Import cleanup; call deleteNotificationsForTarget('event', id). |
| `src/app/api/projects/[id]/delete/route.js` | Import cleanup; call deleteNotificationsForTarget('project', id). |
| `src/app/api/timeline/[id]/delete/route.js` | Import cleanup; call deleteNotificationsForTarget('timeline_update', id). |
| `src/app/api/devlog/[id]/delete/route.js` | Import cleanup; call deleteNotificationsForTarget('dev_log', id). |
| 7× comment/reply delete routes | Import cleanup; call deleteNotificationsForTargetSubId(commentId\|replyId). |
| 8× comment/reply create routes | Use insertNotificationWithOptionalSubId with target_sub_id (event/post/forum/timeline/music/project comments & project+forum replies, devlog comments). |

### Deploy
- Run migration **0071** with deploy so new comment/reply notifications get `target_sub_id` and comment/reply delete can remove them. Without 0071, `deleteNotificationsForTargetSubId` no-ops (column missing), and new notifications are inserted without `target_sub_id` (helper fallback).

### Notes for maintainers
- Adding a new **content type** that can be deleted: in that delete route call `deleteNotificationsForTarget(db, targetType, id)` after soft-delete (use the same `target_type` string as in notification creation).
- Adding a new **comment/reply type** that can be deleted: (1) when creating the notification use `insertNotificationWithOptionalSubId` with `target_sub_id: commentIdOrReplyId`; (2) in the delete route call `deleteNotificationsForTargetSubId(db, commentIdOrReplyId)`.
- If you add **event invite revoke**: delete notifications with `type = 'event_invite'`, `target_type = 'event'`, `target_id = eventId`, and the invited user (e.g. by `user_id` or a new column). Consider adding a small helper in `notificationCleanup.js` if reused.
- If you want **mentions** to disappear when the containing comment is deleted: pass an optional `targetSubId` (comment/reply id) into `createMentionNotifications` and have it insert with `target_sub_id`; then existing comment/reply delete routes will already remove those notifications via `deleteNotificationsForTargetSubId`.

## Edit notifications: dirty state and Save button highlight

### Issue
- In the Edit notifications sheet, making changes did not visually indicate that save was needed; the Save button did not highlight when there were unsaved changes.

### Implementation (`src/app/account/AccountSettings.js`)

1. **Stable dirty comparison**  
   Replaced `notifDirty = JSON.stringify(notifDraft) !== JSON.stringify(notifPrefs)` with a normalized snapshot so key order in nested objects (e.g. `newForumThreadSections`, `adminEvents`) does not affect the result. Added `notifPrefsSnapshot(prefs)` that builds a comparable string from `site`, `newForumThreadSections`, `delivery`, `admin`, and `adminEvents` with sorted keys so draft vs saved prefs are compared consistently.

2. **Pass `dirty` into NotificationsEditor**  
   `EditSheet` already received `dirty={notifDirty}` for close confirmation. Now `NotificationsEditor` also receives `dirty={notifDirty}` so the Save button can reflect unsaved state.

3. **Save button when dirty**  
   - `title={dirty ? 'You have unsaved changes' : undefined}` for accessibility.  
   - When `dirty`, the Save button gets a cyan outline/glow (`boxShadow`, `outline`) and the label switches to "Save preferences (unsaved changes)" so it’s clear that changes need to be saved.

### Verification
- Toggling any notification option (site, delivery, admin, forum sections, admin events) sets `notifDirty` to true and the Save button shows the highlight and updated label. After save, `notifDirty` is false and the button returns to normal.
- `notifPrefsSnapshot` includes all editable fields: `site`, `newForumThreadSections`, `delivery`, `admin`, `adminEvents`, with sorted keys so key order does not affect the comparison.
- `PrimaryButton` in this file merges `props.style` last, so the dirty-state `boxShadow` and `outline` are applied when `dirty` is true.

### Files touched
- `src/app/account/AccountSettings.js`: added `notifPrefsSnapshot()`, `notifDirty` now uses it; `NotificationsEditor` accepts `dirty` and passes it to the Save `PrimaryButton` (title, style, label); `EditSheet` for notifications passes `dirty={notifDirty}` into `NotificationsEditor`.

---

## Session notes (double-check – feed layout)

**Date:** 2026-02-16

**Scope:** Feed layout (three-row, last activity bottom right, responsive). Verification of implementation and log accuracy.

**Actions taken:**
- Removed stale CSS references from the feed section: no `flex-wrap: nowrap` on post-meta-row2; no `row2Suffix` (replaced by `customRowsAfterTitle`).
- Expanded "Double-check (verification)" in the feed layout section with detailed behavior for PostMetaBar, non-events vs events, customRowsAfterTitle, formatDateTimeShort, and overlap prevention.
- Confirmed: non-events use row2 + row3; events use customRowsAfterTitle with event-row2 and event-row3; last activity is right-aligned in row 3.

**Recommended manual checks (when convenient):**
- Feed at narrow width: event-row2 should stack vertically; no overlap between by-user and event info.
- Completed events: "N attended" shows names on hover; no "Starts yesterday" wording.
- Last activity appears bottom-right when replies > 0.
