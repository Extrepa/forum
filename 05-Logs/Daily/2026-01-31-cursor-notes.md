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
