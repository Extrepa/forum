# 2026-02-03 Cursor Notes

## Fixes

- **Profile Display Issues:**
  - **Problem:** Custom mood and song were not showing on public profiles ("broken a while ago").
  - **Cause:** The `SELECT` query for profile extras (mood, song, headline) was coupled with newer columns (`default_profile_tab`, `profile_cover_mode`). If the database schema was missing these newer columns (e.g. pending migration), the entire query failed, and the fallback logic didn't attempt to fetch *just* the mood/song data.
  - **Fix:** Added granular fallback queries in both `src/app/profile/[username]/page.js` and `src/lib/stats.js`. Now, if the broad query fails, it attempts to fetch only the mood/song/headline columns.
  - **Additional Fix:** Updated `src/components/ProfileMoodSongBlock.js` to explicitly allow `youtube-music` as a valid provider for the player. Previously it was missing from the render condition, causing YouTube Music links to show as compact links instead of the player.
  - **Build Fix:** Corrected a syntax error (missing closing brace) introduced in `src/app/profile/[username]/page.js` during the fallback logic implementation. Verified with `npm run build`.

- **Profile Spacing Fix (Mobile):**
  - **Problem:** Large gap between profile song player and bottom tab bar on mobile (smallest viewport).
  - **Fix:** In `src/app/globals.css` (mobile media query):
    - Added `.profile-song-player .embed-frame { margin: 0; }` to remove the default 10px vertical margin from the player embed.
    - Reduced `.profile-tabs-wrapper` margin-top from 8px to 4px.
    - Set `.profile-tabs-wrapper--no-selection { margin-top: 0px !important; }` within `@media (max-width: 480px)` to eliminate extra spacing when no tab is selected.
    - Adjusted `.profile-tab-content--above` margin-bottom to 6px for consistent spacing between content and tabs.

- **Profile Avatar Alignment Fix (Edit Profile, Mobile):**
  - **Problem:** Avatar was off-center on the edit profile page in small viewports.
  - **Fix:** In `src/app/globals.css` (within `@media (max-width: 640px)`):
    - Modified `.account-profile-preview` to have `padding: 0px 0px;`, `width: 100%;`, and `margin: 0 auto;` to ensure it takes the full width and is horizontally centered.
    - Modified `.account-profile-preview-avatar-container` to center the avatar horizontally using `margin: 0 auto;`, `display: flex;`, `justify-content: center;`, and `align-items: center;`.

## Verified Files
- `src/app/profile/[username]/page.js`
- `src/lib/stats.js`
- `src/components/ProfileMoodSongBlock.js`
- `src/app/api/account/stats/route.js` (uses updated lib)
- `src/components/ProfileSongPlayer.js` (verified support for youtube-music)
- `src/app/globals.css` (mobile spacing and avatar alignment fixes)
