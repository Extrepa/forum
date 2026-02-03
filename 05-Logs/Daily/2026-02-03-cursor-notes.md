# 2026-02-03 Cursor Notes

## Fixes

- **Profile Display Issues:**
  - **Problem:** Custom mood and song were not showing on public profiles ("broken a while ago").
  - **Cause:** The `SELECT` query for profile extras (mood, song, headline) was coupled with newer columns (`default_profile_tab`, `profile_cover_mode`). If the database schema was missing these newer columns (e.g. pending migration), the entire query failed, and the fallback logic didn't attempt to fetch *just* the mood/song data.
  - **Fix:** Added granular fallback queries in both `src/app/profile/[username]/page.js` and `src/lib/stats.js`. Now, if the broad query fails, it attempts to fetch only the mood/song/headline columns.
  - **Additional Fix:** Updated `src/components/ProfileMoodSongBlock.js` to explicitly allow `youtube-music` as a valid provider for the player. Previously it was missing from the render condition, causing YouTube Music links to show as compact links instead of the player.
  - **Build Fix:** Corrected a syntax error (missing closing brace) introduced in `src/app/profile/[username]/page.js` during the fallback logic implementation. Verified with `npm run build`.

## Verified Files
- `src/app/profile/[username]/page.js`
- `src/lib/stats.js`
- `src/components/ProfileMoodSongBlock.js`
- `src/app/api/account/stats/route.js` (uses updated lib)
- `src/components/ProfileSongPlayer.js` (verified support for youtube-music)
