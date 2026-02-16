# Daily Log - 2026-02-16 - Cursor Notes

## Feed: stats column aligned to same rows as left (two-column layout)

- **Issue:** The stats column on the right was not aligned to the same rows as the left (title, by user, last activity), creating unnecessary height.
- **Desired layout:** Two columns, same rows. Left = title, by user at time, last activity. Right = stats still a vertical column; row 2 right = first stat (same row as "by user"); row 3 right = remaining stats stacked (same row as "Last activity").
- **`src/components/PostMetaBar.js`:** Stats stay a column. When there is last activity: row 2 right = first stat only; row 3 right = remaining stats as a column. When no last activity: row 2 right = full stats column. Row 3 uses `alignItems: 'flex-start'`.
- **`src/app/feed/page.js`:** Event bottom-row keeps stats as a column on the right of that row.

### Double-check (feed stats layout)

- **PostMetaBar logic:** `statLines` = views, replies, likes (zeros filtered out). `firstStat` = `statLines[0]`, `restStats` = `statLines.slice(1)`. When `!hasLastActivity`: row 2 right = full stats column (all lines). When `hasLastActivity`: row 2 right = first stat only; row 3 right = `restStats` as column (only rendered if `restStats.length > 0`). Row 2 uses `alignItems: 'center'`; row 3 uses `alignItems: 'flex-start'` so multi-line right column aligns to top.
- **Edge cases:** One stat + last activity: row 2 shows that stat, row 3 shows only "Last activity" (no right content). No stats: neither row 2 nor row 3 right render. No last activity + multiple stats: single row 2 with full stats column on right.
- **Events (feed):** Events use `hideStats` on PostMetaBar. Event block has its own `event-bottom-row`: left = attended + last activity (column), right = `eventStatLines` (views, replies) as column; `flexWrap: 'nowrap'`, stats container `flexDirection: 'column', alignItems: 'flex-end'`. One row, two columns; stats stay a column on the right. No row-splitting for events (only one bottom row).
- **CSS:** `.post-meta-stats-column` in globals has `white-space: nowrap`; inline styles in component set flex layout. No conflict.

### Follow-up: events still messy (stats at bottom)

- **Issue:** Event cards still showed stats (views, replies) only in the event-bottom-row, so they appeared at the very bottom after title, by user, and "Starts..." row, creating unnecessary height and a messy look.
- **Change:** Events now show stats in PostMetaBar like other types: `hideStats={false}` for all items. PostMetaBar row 2 shows "by user at time" | full stats column for events (no last activity in PostMetaBar for events). Removed duplicate stats from the event block: event-bottom-row now only renders when `attendeeCount > 0 || (lastActivity && replies > 0)` and has no right-side stats column (stats live in PostMetaBar row 2). Removed `eventStatLines` from the event block.

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
