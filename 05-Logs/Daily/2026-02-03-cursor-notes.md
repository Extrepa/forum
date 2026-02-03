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

- **Profile Tabs & Song Player Outline Cleanup:**
  - **Problem:** A mix of responsive overrides and repeated neon rules meant the tab pill still gained padding when no tab was active, and the player glow was inconsistent (sometimes hidden under the iframe or showing the wrong hue).
  - **Fix:** Collapsed the `profile-tabs-wrapper.profile-tabs-wrapper--no-selection` and `.profile-tab-content--no-selection` rules across `@media` blocks so the pill stays flush with the card, and removed duplicate CSS that fought the neon outline.
  - **Glow work:** Centralized `.neon-outline-card::before/::after` to use CSS variables and let each `.profile-song-player--[provider]` class override only the gradient/glow colors (`z-index` ensures the outline sits above the iframe).

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
- `src/app/globals.css` (mobile spacing, tab collapse, and neon outline cleanup)

## Outstanding Notes
- Errl tab indicator still needs work: start the outline at whichever tab is hovered first (don’t animate in from the top-left), continue showing the glow on hover even if no tab is selected, and only persist the “active” outline when a tab is actually open; leave regular hover styling for other tabs and ensure the initial hover keeps the outline under that tab.
- Edit profile UX additions: add the “Show role on profile” checkbox beside the username input, add the “Show song provider color glow behind player” checkbox under Mood & Song, adjust the edit profile tab button so it inherits the same styling/hover effects as the View Profile breadcrumb button, and on smaller viewports keep the avatar on the same column as username/role/mood (avatar should live between the name and role when visible, move above username only when absolutely necessary).
- Notifications popover should stay compact on large viewports but stretch to fill the viewport area on small/mobile screens (reset any overflow and ensure height/width respond to viewport so it never overflows).
- Need to remind future work to apply migration 0059 (`npx wrangler d1 execute errl_forum_db --remote --file=./migrations/0059_add_profile_display_settings.sql --env preview` / same without `--env preview` for prod) so `profile_show_role` and `profile_song_provider_glow` columns exist everywhere the APIs rely on them.
