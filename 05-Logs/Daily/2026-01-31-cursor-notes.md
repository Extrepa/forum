# Cursor notes – 2026-01-31

## Profile Additions Plan implementation

Implemented the profile additions forward plan (single card, layout refactor, Phase 1 account editing).

### Done

1. **Feature flags** – `src/lib/featureFlags.js`: `profile_mood`, `profile_music`, `profile_backgrounds`, `lately_cards`, `gallery`, `notes`, `files` (env-based; mood/music default on).
2. **Profile page layout** – Single card:
   - Header: avatar, username, role, mood or song (compact), optional headline, socials inline.
   - Bio under header.
   - Tab strip (Activity | Lately | Gallery | Notes | Files) and tab content below.
   - Stats moved into Activity tab (Stats block at top of Activity).
   - Desktop: header row (avatar left, meta right); mobile: stacked (768px breakpoint).
3. **CSS** – `globals.css`: `.profile-card`, `.profile-card-header`, `.profile-card-header-meta`, `.profile-card-mood-song`, `.profile-mood-chip`, `.profile-song-compact`, `.profile-tabs-strip` (scroll on mobile), `.profile-tab`, `.profile-stats-block`, `.profile-stats-grid`, media query for mobile stack.
4. **ProfileTabsClient** – Accepts `stats`; renders Stats block at top of Activity tab (join date, threads, replies, visits, time, avatar min). Tab strip uses CSS classes; content has min-height.
5. **Account: profile extras** – Account page and `/api/account/stats` fetch and return `profileMoodText`, `profileMoodEmoji`, `profileSongUrl`, `profileSongProvider`, `profileSongAutoplayEnabled`, `profileHeadline`. `POST /api/account/profile-extras` updates these (sanitize text, allowlist provider soundcloud|spotify|youtube, validate URL).
6. **Account profile tab** – “Mood & Song” section: display when not editing; Edit opens form (mood text, mood emoji, headline, song URL, provider dropdown, autoplay checkbox). Save/Cancel row includes extras; Save POSTs to profile-extras and refreshes stats.

### Files touched

- `src/lib/featureFlags.js` (new)
- `src/app/profile/[username]/page.js` (single card, header, stats passed to tabs, feature-flag gating for mood/song)
- `src/components/ProfileTabsClient.js` (stats prop, Stats block in Activity, CSS classes)
- `src/app/globals.css` (profile-card and profile-tabs styles, mobile breakpoint)
- `src/app/account/page.js` (userInfo query extended, stats include profile extras)
- `src/app/api/account/stats/route.js` (userInfo query extended, response includes profile extras)
- `src/app/api/account/profile-extras/route.js` (new)
- `src/app/account/AccountTabsClient.js` (state and form for mood/song/headline, handleSaveExtras, handleCancelExtras)

### Not done (later phases)

- Phase 2: `user_lately_items` (optional), `user_gallery_images` migration + Gallery tab UI.
- Phase 3: `profile_notes` + Notes tab UI.
- Phase 4: `user_files` (gated) + Files tab.

Migration 0054 already exists; apply in target environments when ready.

---

## Edit profile: single card with inner tabs (2026-01-31)

Refactored the Edit profile section (Account > Edit profile) into a single card with inner tabs so all editing places live in one card.

### Changes

- **Single card** – Replaced the two-column layout (left: form, right: Stats) with one `.account-edit-card` containing a tab strip and tab content.
- **Inner tabs** – Profile | Mood & Song | Socials | Gallery | Notes | Stats. Each tab shows one panel; Save/Cancel is per-tab where applicable.
- **Profile tab** – Avatar + username + color; Edit Avatar / Edit Username; Save/Cancel when editing username.
- **Mood & Song tab** – Display or form for mood, headline, song URL/provider/autoplay; Edit Mood & Song; Save/Cancel when editing extras.
- **Socials tab** – Lately & Socials links (display or form); Edit Socials; Save/Cancel when editing socials.
- **Gallery / Notes tabs** – Placeholder copy (“Coming soon”).
- **Stats tab** – Stats block (portal entry, threads, replies, visits, time, avatar min) + Recent Activity list.
- **CSS** – `.account-edit-card`, `.account-edit-tabs-strip`, `.account-edit-tabs-strip--spread`, `.account-edit-tab`, `.account-edit-tab--active`, `.account-edit-tab-content`, `.account-edit-panel` in `globals.css`; mobile tweaks in `@media (max-width: 640px)`.

### Files touched

- `src/app/account/AccountTabsClient.js` (state `editProfileSubTab`, `EDIT_PROFILE_SUB_TABS`, tab panels; removed two-column layout and duplicate Mood & Song block)
- `src/app/globals.css` (account-edit-card and tab styles, mobile)

### Verification (double-check)

- **Structure** – Edit profile block: outer div → `.account-edit-card` → tab strip (6 buttons) → `.account-edit-tab-content` → six conditional panels. Each panel is a single `.account-edit-panel`; Profile panel has correct nesting (account-edit-panel → avatar grid → AvatarCustomizer conditional → flex column → username grid → Save/Cancel/message). Closing tags: `</div></div></div>)}` then `</section>`; no leftover or dead code.
- **State** – `editProfileSubTab` defaults to `'profile'`; `EDIT_PROFILE_SUB_TABS` has ids `profile`, `mood`, `socials`, `gallery`, `notes`, `stats`. All six used in conditionals. `usernameStatus` shared for Profile and Socials save; message shown only when `editProfileSubTab === 'profile'` or `=== 'socials'` respectively, so no cross-tab message leak.
- **CSS** – Every class used in AccountTabsClient exists in globals.css: `.account-edit-card`, `.account-edit-tabs-strip`, `.account-edit-tabs-strip--spread`, `.account-edit-tab`, `.account-edit-tab--active`, `.account-edit-tab-content`, `.account-edit-panel`. Mobile overrides at 640px: card padding, strip gap/margin, tab flex/min-width, tab padding/font-size/min-height.
- **Handlers** – Profile: `handleSaveUsername`, `handleCancelUsername`. Mood: `handleSaveExtras`, `handleCancelExtras`. Socials: `handleSaveSocials`, `handleCancelSocials`. Edit buttons clear other edit modes (e.g. Edit Username sets `isEditingSocials(false)`, `isEditingExtras(false)`).
- **Stats tab** – Uses `stats` from props/state (refreshed when Edit profile tab is active); `formatDateTime`, `formatDate`, `getSectionLabel` used for activity links; `profile-activity-list` and `profile-activity-item` classes reused from profile page.
- **Follow-up** – Gallery and Notes tabs are placeholders only. When implementing: add upload/editor UI and wire to APIs; consider syncing `editProfileSubTab` with URL (e.g. `?tab=profile&edit=socials`) if deep-linking is needed.

---

## Tabs at bottom, giant pill, Stats vs Activity (2026-01-31)

Per user feedback: tabs at bottom of card, giant pill with sliding indicator, Stats and Activity separate, one row on small viewports, stats layout improved.

### Changes

- **Tab strip at bottom** – Profile (`ProfileTabsClient`) and Edit profile (`AccountTabsClient`): content area first (flex: 1), pill strip last so tabs sit at bottom of card.
- **Giant pill + sliding indicator** – New `.tabs-pill` (rounded container, one row), `.tabs-pill-inner` (flex, nowrap), `.tabs-pill-indicator` (absolute, `transform: translateX(activeIndex * 100%)`, 0.25s transition). Tabs inside pill are transparent; active tab highlighted by moving indicator.
- **Stats vs Activity separate** – Edit profile: added **Activity** tab; **Stats** tab shows only stats block; **Activity** tab shows only recent activity list. Profile page already had separate Stats and Activity tabs.
- **One row on small viewports** – `.tabs-pill-inner` has `flex-wrap: nowrap` and `min-width: min-content`; `.tabs-pill` has `overflow-x: auto` so tabs stay in one row and pill scrolls horizontally on narrow screens. Mobile: tab min-width 64px, smaller padding/font.
- **Stats layout** – `.profile-stats-block--grid` and `.profile-stats-grid`: grid layout `repeat(auto-fill, minmax(160px, 1fr))`, each stat as label + value (`.profile-stat`, `.profile-stat-label`, `.profile-stat-value`). Applied on profile view and Edit profile Stats tab. Mobile: 2 columns.

### Files touched

- `src/components/ProfileTabsClient.js` – Content above, pill at bottom; activeIndex for indicator; stats use profile-stats-block--grid and profile-stats-grid.
- `src/app/account/AccountTabsClient.js` – EDIT_PROFILE_SUB_TABS + Activity; content above, pill at bottom; editProfileSubTabIndex; Stats tab stats-only (grid layout); new Activity tab (recent activity only).
- `src/app/globals.css` – profile-tabs-wrapper flex column; profile-tab-content--above; tabs-pill, tabs-pill-inner, tabs-pill-indicator; profile-tab/account-edit-tab inside pill; profile-stats-block--grid, profile-stats-grid grid, profile-stat label/value; account-edit-card--tabs-bottom; removed old strip-based mobile overrides.

### Verification (double-check)

- **ProfileTabsClient** – Order: `profile-tabs-wrapper` (flex column) → `profile-tab-content profile-tab-content--above` (flex: 1) → content for stats | activity | socials | gallery | notes → closing div → `tabs-pill` (flex: 0) with `tabs-pill-inner`, indicator (`width: 100/tabs.length%`, `transform: translateX(activeIndex*100%)`), then 5 buttons. `activeIndex = tabs.findIndex(t => t.id === activeTab)`; valid range 0–4. Stats tab uses only stats grid; Activity tab uses only activity list. No linter errors.
- **AccountTabsClient** – Order: `account-edit-card--tabs-bottom` (flex column) → `account-edit-tab-content--above` (flex: 1) → 7 panels (profile, mood, socials, gallery, notes, stats, activity) → closing div → `tabs-pill` with indicator (`width: 100/7%`, `transform: translateX(editProfileSubTabIndex*100%)`) and 7 buttons. Stats panel: only `profile-stats-block--grid` + `profile-stats-grid` (no Recent Activity). Activity panel: only recent activity list. `editProfileSubTabIndex = EDIT_PROFILE_SUB_TABS.findIndex(t => t.id === editProfileSubTab)`; valid 0–6. No linter errors.
- **CSS** – `.profile-tabs-wrapper`: display flex, flex-direction column, min-height 120px. `.profile-tab-content--above`: flex 1 1 auto, margin-bottom 12px. `.tabs-pill`: flex 0 0 auto, overflow-x auto, border-radius 999px. `.tabs-pill-inner`: flex, flex-wrap nowrap, position relative, min-width min-content. `.tabs-pill-indicator`: absolute, left 0, transition transform 0.25s. `.profile-stats-grid`: grid, repeat(auto-fill, minmax(160px, 1fr)). Mobile (768px): profile-stats-grid 2 columns; tabs-pill tab min-width 64px, smaller padding/font.
- **Edge case** – If `activeTab`/`editProfileSubTab` ever didn’t match a tab id, `findIndex` would return -1 and the indicator would use `translateX(-100%)`. State is only set from tab buttons so this is theoretical; optional guard: `Math.max(0, findIndex(...))`.
