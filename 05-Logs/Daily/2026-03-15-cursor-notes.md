# 2026-03-15 Cursor notes

## Spotify music player box height

- **Issue**: Music post Spotify embed container was taller than the player (152px box with ~80px compact track), leaving empty space below the player.
- **Changes**:
  - `src/lib/embeds.js`: `spotifyEmbedHeight('track')` reduced from 152 to 80 so the box matches the compact track player. Affects all consumers (music post detail, listing, ProfileSongPlayer, MusicPostForm preview).
  - `src/app/globals.css`: Added `.embed-frame.spotify { min-height: 80px; min-width: 0; }` so height can be overridden in one place for future options (e.g. list vs detail, or new Spotify types). Mobile block keeps same min-height.
- **Result**: Single source of truth in embeds.js; CSS provides fallback and future override point for any forum surface that shows music posts.

## Double-check and deploy

- **Verified**: `embeds.js` track height 80; `.embed-frame.spotify` in globals.css (base + mobile min-height); no other call sites use hardcoded 152.
- **Commit**: On branch `fix/spotify-embed-box-height` (direct commit to main not allowed): `fix: Spotify music player box height (track 80px, CSS fallback)`.
- **Push**: Branch pushed to origin.
- **Deploy**: `npm run deploy` — deployed to forum.errl.wtf (Version ID: 595562a2-403c-4b54-9737-bf2aaf0ff49c). To merge into main, open a PR from `fix/spotify-embed-box-height`.
