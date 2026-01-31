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
