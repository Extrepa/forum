# 2026-01-31 cursor notes

## Edit profile: Activity tab, Stats tab, unified stats labels

- **Activity tab (edit profile):** Restored Activity tab on edit profile. Built `activityItems` from `stats.recentActivity` in `AccountTabsClient` (same shape as public profile: key, type, href, section, title, timeStr) using existing `getSectionLabel` and `formatDateTime`. Extended `getSectionLabel` for art/bugs/rant/nostalgia/lore/memories/post_comment. Activity tab panel renders the same recent-activity list as the public profile (Posted/Replied to + title + section + time).
- **Stats tab (edit profile):** Added Stats tab panel with long labels: Portal entry (date), threads started, replies contributed, total contribution (post contributions), profile visits, minutes spent on the website, minutes editing your avatar. Uses existing `profile-stats-block` / `profile-stats-grid` and `formatDate`/`formatDateTime` for join date.
- **Public profile stats:** Updated `ProfileTabsClient` Stats tab to use the same long labels and added total contribution (threadCount + replyCount). Public profile now shows the same stat copy as edit profile; data still comes from profile page (same DB-backed stats).

Files touched: `src/app/account/AccountTabsClient.js`, `src/components/ProfileTabsClient.js`.

---

## Tabs in alphabetical order

- **Edit profile (AccountTabsClient):** `EDIT_PROFILE_SUB_TABS` reordered alphabetically by label: Activity, Gallery, Guestbook, Mood & Song, Profile, Socials, Stats. Default selected tab remains `profile` (unchanged); only pill order changed.
- **Profile page (ProfileTabsClient):** `PROFILE_TABS` reordered alphabetically by label: Activity, Gallery, Guestbook, Socials, Stats. Default when no `initialTab` remains `stats`; only pill order changed.
- **Verification:** Pill indicator uses `findIndex(t => t.id === activeTab)` / `findIndex(t => t.id === editProfileSubTab)` so the highlight still aligns with the active tab regardless of array order. Tab content is keyed by tab id, not index. No linter errors. `DEFAULT_TAB_OPTIONS` (dropdown for default profile section) left as-is; user asked for "tabs" only.

---

## Profile page mobile (no stretching on small devices)

- **Layout containment:** `.stack` now has `max-width: 100%` and `.stack > *` has `min-width: 0` and `max-width: 100%` so grid children (e.g. profile card) cannot stretch the layout when content is wide. `.profile-card` has `min-width: 0`, `max-width: 100%`, and `overflow-x: hidden`. `.profile-tabs-wrapper` and `.tabs-pill` have `min-width: 0` and `max-width: 100%` so the tab pill scrolls horizontally inside the viewport instead of expanding the page.
- **Tab content:** `.profile-tab-content` and `.profile-tab-content--above` have `min-width: 0`, `max-width: 100%`, and (where needed) `overflow-x: hidden` so tab panels do not force width.
- **Text wrapping:** `.profile-card-header` has `min-width: 0` and `overflow-wrap: break-word`. `.profile-song-link` has `word-break: break-all`. New `.profile-socials-inline` and `.profile-headline` and `.profile-card-bio` use `min-width: 0`, `overflow-wrap: break-word`, and `word-break: break-word` so long URLs and headlines wrap on small screens.
- **Very small viewports (≤480px):** Single-column stats grid, tighter header padding, smaller tab pill text and min-width so the pill fits and scrolls.
- **Profile page / ProfileTabsClient:** Section has inline `minWidth: 0`, `maxWidth: '100%'`, `boxSizing: 'border-box'`. ProfileTabsClient root and tab-content div have inline `minWidth: 0`, `maxWidth: '100%'` for consistency.

Files touched: `src/app/globals.css`, `src/app/profile/[username]/page.js`, `src/components/ProfileTabsClient.js`.

---

## Edit profile layout, color display, Profile tab removal, active tab style, Errl border

- **Mini preview under avatar:** Moved "Mini preview" label + 24px avatar from the controls row into `profile-card-header-avatar`, directly under the 96px avatar. Edit Avatar and Edit Username remain in the meta column (same section as username) in a single row with Color.
- **Edit Avatar / Edit Username in same section:** Kept both buttons in the meta column after mood/socials, in one row with Color. No separate disconnected row.
- **Color when not editing:** When `!isEditingUsername`, show only the chosen color: a single `<span>` (18px circle) with the resolved color from `colorOptions` (or Auto gradient), no border/outline. When editing username, show full row of color swatches with outline on selected; `handleDefaultTabChange` unchanged.
- **Profile tab removed:** Removed `{ id: 'profile', label: 'Profile' }` from `EDIT_PROFILE_SUB_TABS`. Default tab set to `'activity'`. Deleted the entire `editProfileSubTab === 'profile'` panel (dropdown "Default section on your profile"). Removed unused `DEFAULT_TAB_OPTIONS`.
- **Default-tab checkbox per tab:** For Activity, Gallery, Guestbook, Socials, and Stats panels: added a header row with section title on the left and "Set as profile default" checkbox on the right. Checkbox `checked={defaultProfileTab === tabId}`, `onChange={(e) => handleDefaultTabChange(e.target.checked ? tabId : 'none')}`. Mood & Song has no checkbox (no public Mood tab). Only one tab can be default; unchecking sets default to `'none'` (null).
- **Active tab styling (glow + fill + neon purple/pink):** `.tabs-pill .profile-tab--active` and `.tabs-pill .account-edit-tab--active`: `background: rgba(255, 52, 245, 0.2)`, `border: 1px solid rgba(255, 52, 245, 0.8)`, `box-shadow: 0 0 12px rgba(255, 52, 245, 0.5)`. Same for standalone `.profile-tab--active` and `.account-edit-tab--active`. Hover for `.profile-tab` and `.account-edit-tab` updated to purple/pink border for consistency.
- **Errl border:** User meant "Errl border" (not URL). Applied same animated gradient border as `.card` to the tab switcher: added `.tabs-pill::before` and `.tabs-pill::after` to the existing Errl border selectors (neonChase gradient + glow). `.tabs-pill` given `position: relative` and `isolation: isolate`; `.tabs-pill::before` given `animation-duration: 5.5s`. Edit profile card and public profile card already use `.card` (section with `card account-card` / `card profile-card`), so they already have the Errl border; no change. Added `.tabs-pill` to `[data-ui-color-mode="2"]` overrides so static border mode applies to the pill.

Files touched: `src/app/account/AccountTabsClient.js`, `src/app/globals.css`.

---

## Easter egg iframe not loading

- **Iframe src:** SiteHeader now sets easter-egg iframe `src` client-side from `window.location.origin + '/easter-eggs/errl-bubbles-header.html'` so the HTML loads with an absolute same-origin URL (avoids base-path issues in dev/preview). Iframe only renders when `eggIframeSrc` is set (after mount).
- **CSP in HTML:** Added a permissive meta CSP in `public/easter-eggs/errl-bubbles-header.html` so script/style/font sources (esm.sh, unpkg, Tailwind, Google Fonts) are allowed if the host injects a strict CSP.
- **Files:** `src/components/SiteHeader.js`, `public/easter-eggs/errl-bubbles-header.html`.

---

## Easter egg: React 418 hydration + Babel targets.esmodules

- **React 418 (hydration):** Easter-egg overlay now renders only when `mounted && eggActive && eggIframeSrc`, so the overlay is never in the server tree and hydration stays consistent. Added `suppressHydrationWarning` on the overlay div as a safeguard.
- **Babel error (`.targets["esmodules"] must be a boolean`):** Pinned Babel standalone in the easter-egg HTML to `@babel/standalone@7.24.10` so we don't hit Babel 8's stricter targets validation from unpkg latest.
- **Files:** `src/components/SiteHeader.js`, `public/easter-eggs/errl-bubbles-header.html`.

---

## Edit profile plan: top section, socials, stats, guestbook, mood

- **Edit Profile top section:** Removed socials from the preview card (no inline socials in header). Removed separator and "Username:" / "Color:" from main view. Single row after mood/song: Edit Avatar + Edit Username only; when editing username, inline form (input, Save, Cancel, color swatches) appears in same row.
- **Profile card socials:** Public profile card shows socials only when "show on profile card" (featured) is checked. `cardLinks = validLinks.filter(l => l.featured).slice(0, 5)`; block only renders when `cardLinks.length > 0`.
- **Stats:** Added `getRarityColor` to AccountTabsClient and applied to Stats tab values (threadCount, replyCount, total, profileViews, timeSpentMinutes, avatarEditMinutes). Account stats API now includes `postsCount` and `postCommentsCount` (try/catch for missing posts/post_comments tables) so edit and view stats match.
- **Guestbook delete button:** Left column (author + date) has `flex: 1`, `minWidth: 0`; Delete button has `whiteSpace: 'nowrap'` so it does not stretch on small viewports.
- **Mood dropdown:** Replaced Mood text and Mood emoji inputs with a single Mood select. `MOOD_OPTIONS`: 50 entries (1 None + 25 Errl-themed with Errl emojis + 24 general). One pick sets both `profile_mood_text` and `profile_mood_emoji`. Legacy/custom values show as "Custom" option until user picks a new mood.
- **Files:** `src/app/account/AccountTabsClient.js`, `src/app/profile/[username]/page.js`, `src/app/api/account/stats/route.js`.

---

## Edit profile: button layout, Notes rename, delete button, stats match

- **Edit Avatar / Edit Username layout:** Moved buttons into a separate actions column. Structure: `[avatar] [meta + actions]` where meta = username, role, mood/song, headline and actions = Edit Username then Edit Avatar (stacked). Mobile: account preview header stays row (override in globals.css so `.account-profile-preview .profile-card-header.account-profile-preview-header` keeps `flex-direction: row`, `align-items: flex-start`, `text-align: left` on max-width 768px) so buttons stay to the right of avatar/username and align vertically. Desktop: same row layout with Edit Username and Edit Avatar in right column.
- **Guestbook delete button:** Row uses `alignItems: 'center'`; left div `flex: 1`, `minWidth: 0`; Delete button has `width: 'max-content'`, `minWidth: 70`, `whiteSpace: 'nowrap'`, `flexShrink: 0` so it does not stretch and listing stays compact.
- **Rename Guestbook to Notes:** Display label only. Tab id and API remain `guestbook`. In AccountTabsClient and ProfileTabsClient: tab label "Guestbook" -> "Notes"; section titles and copy ("Guestbook tab", "Your guestbook...") -> "Notes tab", "Your notes...".
- **Stats match (profile vs edit):** Initial account page load builds stats in `account/page.js` without postsCount/postCommentsCount; profile page and `/api/account/stats` include them. Added same postsCount and postCommentsCount logic (try/catch for posts/post_comments) to `account/page.js` so threadCount and replyCount match profile page and API on first load.
- **Files:** `src/app/account/AccountTabsClient.js`, `src/app/account/page.js`, `src/app/globals.css`, `src/components/ProfileTabsClient.js`.

---

## Avatar glow and socials icons

- **Avatar circle glow cut off:** Set `.profile-card { overflow: visible }` and `.profile-card-header-avatar { overflow: visible }` in globals.css so the circular drop-shadow/glow around the avatar is not clipped by a square boundary on profile view and account edit preview.
- **Socials tab icons:** Added `platform` to `latelyLinks` in profile `page.js` so each link has a platform key. In ProfileTabsClient: added `SOCIAL_ICONS` map (github, youtube, soundcloud, discord, chatgpt -> `/icons/social/*.png`), import `Image` from next/image; Socials tab now renders each link as a row with a 24px icon (when platform has an icon), then category/label/url. SoundCloud links use orange border/background for consistency with card inline links.
- **Files:** `src/app/globals.css`, `src/app/profile/[username]/page.js`, `src/components/ProfileTabsClient.js`.

---

## Default profile tab not saving / not showing

- **Save behavior:** `handleDefaultTabChange` was optimistically updating local state; on API failure the checkbox stayed checked but the value was never persisted, so a refresh reverted it. Now: no optimistic update; on success we set `defaultProfileTab` and `stats.defaultProfileTab` from the API response; on failure (non-ok or catch) we revert `defaultProfileTab` to the previous value so the checkbox reflects server state.
- **Profile page fallback:** When the main user SELECT on the profile page threw (e.g. missing column), the catch used a fallback query that did not include `default_profile_tab`, so `initialTab` was always null. Fallback query now includes `default_profile_tab` so the default tab is used when the main query fails.
- **Account page fallback:** First fallback SELECT in account/page.js (when the long user-info query fails) now includes `default_profile_tab` so the edit-profile view still gets the saved default when the long query fails.
- **Files:** `src/app/account/AccountTabsClient.js`, `src/app/profile/[username]/page.js`, `src/app/account/page.js`.

---

## Edit buttons, section padding, profile error, Notes layout

- **Edit Username / Edit Avatar same size on desktop:** Added class `account-edit-profile-btn` to both buttons; in globals.css at min-width 769px set `min-width: 130px` so both buttons are the same width.
- **Padding between tab header and content:** Added `.account-edit-panel .section-title { margin-bottom: 4px }`. Reduced header-row and first-paragraph marginBottom in AccountTabsClient for Notes (4px/8px), Gallery (4px/8px), Mood & Song (4px), Socials (4px), Stats (4px), Activity (4px); reduced marginTop on activity list and stats block to 4px. ProfileTabsClient Notes section title marginBottom set to 4px.
- **Profile page not loading (server error):** Fallback user query included `default_profile_tab`; if that column is missing (migration not run), the fallback threw. Wrapped fallback in inner try/catch: first try fallback with `default_profile_tab`, on throw try fallback without it and set `profileUser.default_profile_tab = null` so the page loads.
- **Notes: user/date top-left:** In AccountTabsClient and ProfileTabsClient, guestbook entry layout: author and date are in a single row top-left (flex, gap 6px); entry container uses gap 4px between meta row and message content. Delete button remains on the same row as author/date (right) in AccountTabsClient; ProfileTabsClient has no Delete (view-only).
- **Files:** `src/app/account/AccountTabsClient.js`, `src/app/globals.css`, `src/app/profile/[username]/page.js`, `src/components/ProfileTabsClient.js`.

---

## Padding, stats match, Notes delete button

- **Padding (all tab sections):** Socials header row marginBottom was 8px; set to 4px to match Activity/Stats/Notes. Gallery and Notes first paragraph marginBottom reduced from 8px to 6px for consistency with other tabs. Recent activity already had 4px; other panels use .account-edit-panel .section-title (4px) and 4px on header rows.
- **Stats matching:** Coerced all count values to Number() in profile page, account page, and /api/account/stats so threadCount and replyCount are always numeric (avoids string concatenation if D1 returns string counts). Same formulas and sources in all three; coercion ensures display consistency.
- **Notes delete button:** Placed in top-right of each note card (same row as author/date). Made smaller: fontSize 11px, padding 2px 6px, borderRadius 4px, minWidth 52px; label shortened to "Delete" / "…" when loading so the box stays compact and does not stretch on small viewports.
- **Files:** `src/app/account/AccountTabsClient.js`, `src/app/account/page.js`, `src/app/api/account/stats/route.js`, `src/app/profile/[username]/page.js`.

---

## Double-check: padding, Gallery labels, public profile tabs

- **Public profile tab padding:** ProfileTabsClient section titles for Recent Activity, Socials, and Gallery still had marginBottom: '12px'; only Notes had 4px. Changed all four to marginBottom: '4px' so padding is consistent on public profile (Activity, Socials, Gallery, Notes). Added .profile-tab-content--above .section-title { margin-bottom: 4px } in globals.css as fallback.
- **Gallery labels (edit profile):** "Image" and "Caption (optional)" were still className="muted". Set inline color: '#F5FFB7' (yellow-ish, matches forum role-user / post accent) so they stand out.
- **Verification:** Edit buttons have class account-edit-profile-btn and CSS min-width 130px at 769px+. Avatar glow uses .profile-card and .profile-card-header-avatar overflow: visible. Notes delete button has fontSize 11px, padding 2px 6px, minWidth 52. Stats use Number() in profile, account, API. Default tab save uses non-optimistic update and fallback queries.
