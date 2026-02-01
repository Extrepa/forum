# Profile Song Player, Layout, and Default Tab Fixes (2026-01-31)

Summary of fixes implemented for profile header layout, compact song player, autoplay/pause, and default profile tab behavior.

---

## 1. Profile header layout (username → role → mood → song)

- **File:** `src/app/globals.css`
- **Change:** `.profile-card-mood-song` uses `flex-direction: column`, `align-items: flex-start`, `gap: 6px` so mood and song stack vertically in order.
- **File:** `src/app/profile/[username]/page.js` — header order is already: Username, Role, then `ProfileMoodSongBlock` (mood then song).

---

## 2. Condensed song player (“little play box”)

- **ProfileMoodSongBlock.js:** Passes `compact` to `ProfileSongPlayer` on the public profile.
- **AccountTabsClient.js:** Passes `compact` to `ProfileSongPlayer` in the account mini-preview so edit-profile shows the same compact bar.
- **ProfileSongPlayer.js:** When `compact` is true:
  - Renders only the control bar (play/pause button + provider label + song name).
  - Does not set `width`/`maxWidth` inline so CSS controls size.
  - Embed iframe/YouTube div is kept in DOM but hidden (off-screen, opacity 0) for playback.
- **globals.css:** `.profile-song-player--compact` has `width: auto`, `max-width: 280px`; compact bar has smaller padding, 32px button, 16px icon, 10px label.

---

## 3. Autoplay on profile

- **ProfileMoodSongBlock.js:** Passes `autoPlay` (true) to `ProfileSongPlayer` on the public profile so the song attempts to autoplay on load (subject to browser autoplay policy).

---

## 4. Pause works when autoplay is on

- **ProfileSongPlayer.js (YouTube):** Added `onStateChange` handler so `isPlaying` stays in sync with player state (1 = playing, 2 = paused, 0 = ended). Ensures the pause button and icon match actual state after autoplay.
- **ProfileSongPlayer.js (SoundCloud):** Already bound to PLAY/PAUSE/FINISH; no change.
- **ProfileSongPlayer.js (clickability):** Hidden embed container uses `left: -9999`, `top: 0` so it is off-screen and cannot cover the bar. Wrapper has `position: relative`; bar has `position: relative`, `zIndex: 1`. Iframe has `pointerEvents: 'none'` when compact so clicks always hit the play/pause button.

---

## 5. Mood centered on small viewports

- **globals.css (@media max-width: 768px):**
  - `.profile-card-mood-song`: `align-items: center`, `justify-content: center`.
  - `.profile-card-header-meta`: `align-items: center`, `text-align: center`.
  - `.account-profile-preview .profile-card-header-meta`: `align-items: center`, `text-align: center`.
  - `.account-profile-preview .profile-card-mood-song`: `align-items: center`.

---

## 6. Default profile tab when user has not set one

- **ProfileTabsClient.js:** When `initialTab` is null or not a valid tab ID, `resolvedInitial` is now `null` (was `'stats'`). So if the user has not chosen a default tab, no tab is selected on load.
- **ProfileTabsClient.js:** When `activeTab` is null, `activeIndex` is -1; pill indicator uses `opacity: 0`, `width: 0` when `activeIndex < 0` so no tab appears selected. No tab content is shown until the visitor clicks a tab.
- **Profile page:** Already passes `initialTab={... ? null : profileUser.default_profile_tab || 'stats'}` when `default_profile_tab` is `'none'` or falsy; no change.

---

## Files touched

| File | Changes |
|------|--------|
| `src/components/ProfileMoodSongBlock.js` | `compact`, `autoPlay` passed to ProfileSongPlayer |
| `src/components/ProfileSongPlayer.js` | Compact mode, off-screen embed, bar z-index, YouTube onStateChange, iframe pointer-events |
| `src/app/account/AccountTabsClient.js` | `compact` on ProfileSongPlayer in mini-preview |
| `src/app/globals.css` | profile-card-mood-song column layout; compact player styles; small-viewport centering for mood/meta |
| `src/components/ProfileTabsClient.js` | resolvedInitial = null when no default; activeIndex = -1 when no tab; hide pill when no tab selected |

---

## Verification checklist

- [ ] Public profile: header order is username → role → mood → song; song is compact bar with visible play/pause.
- [ ] Public profile: song attempts autoplay; pause button works and icon matches state.
- [ ] Account edit mini-preview: same compact bar with play/pause; mood/song centered on narrow width.
- [ ] Profile with no default tab set: no tab selected on load; tab strip visible; clicking a tab shows that tab’s content.
