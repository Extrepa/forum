# Profile Song Player & Layout — Verification and Notes (2026-02-01)

Double-check of all profile song player, edit-profile layout, and default-tab fixes. References: `2026-01-31-profile-song-and-default-tab-fixes.md`, `2026-02-01-profile-final-fixes.md`.

---

## Verification (code present)

| Item | Location | Status |
|------|----------|--------|
| **ProfileSongPlayer: SoundCloud getPaused()** | `handleToggle` uses `soundcloudWidget.getPaused(cb)` and calls play/pause from actual state | OK |
| **ProfileSongPlayer: white icon, preserveAspectRatio** | Button `color: '#ffffff'`; SVGs have `preserveAspectRatio="xMidYMid meet"`, `display: block`, `flexShrink: 0` | OK |
| **ProfileSongPlayer: hidden embed** | Compact embed container: `left: 0`, `top: 0`, `1x1`, `opacity: 0`, `zIndex: 0`; iframe `pointerEvents: 'none'` when compact | OK |
| **ProfileSongPlayer: autoplay + state sync** | SoundCloud: `setTimeout(() => setIsPlaying(true), 500)` after autoplay; PLAY/PAUSE/FINISH bound. YouTube: onStateChange(1/2/0) | OK |
| **ProfileMoodSongBlock** | Passes `compact` and `autoPlay` to ProfileSongPlayer on public profile | OK |
| **AccountTabsClient** | Passes `compact` and `autoPlay={false}` to ProfileSongPlayer in mini-preview | OK |
| **ProfileTabsClient: no default tab** | `resolvedInitial = null` when initialTab invalid; `activeIndex = -1` when activeTab null; `noTabSelected` adds `profile-tabs-wrapper--no-selection` and `profile-tab-content--no-selection` | OK |
| **globals: compact bar** | `.profile-song-player--compact` max-width 280px, min-width min-content; bar min-width 140px; label white-space nowrap; button 32px, SVG 18px, preserveAspectRatio | OK |
| **globals: no-tab padding** | `.profile-tabs-wrapper--no-selection` min-height 0, margin-top 12px; `.profile-tab-content--no-selection` min-height 0, flex 0 0 auto | OK |
| **globals: account preview** | overflow visible on preview/meta/mood-song/player; username white-space nowrap; 768px: meta min-width 180px, bar flex-wrap nowrap, stacking column; edit buttons smaller | OK |

---

## Files touched (summary)

| File | Changes |
|------|--------|
| `src/components/ProfileSongPlayer.js` | getPaused() for SoundCloud; white icon; preserveAspectRatio on SVGs; hidden embed left:0 top:0; e.stopPropagation in handleToggle; autoplay delay + setIsPlaying(500ms) |
| `src/components/ProfileMoodSongBlock.js` | compact, autoPlay passed to ProfileSongPlayer |
| `src/components/ProfileTabsClient.js` | resolvedInitial = null; activeIndex = -1 when no tab; noTabSelected classes for wrapper and content |
| `src/app/account/AccountTabsClient.js` | compact, autoPlay={false} for mini-preview; removed inline minWidth on actions div |
| `src/app/globals.css` | profile-card-mood-song column; compact player (bar 140px min, label nowrap, SVG 18px); no-selection padding; account preview overflow visible, username nowrap, 768px stacking + meta 180px; account-edit-profile-btn smaller at 768px; desktop-only min-width 130px for actions |

---

## Verification checklist (manual)

- [ ] **Public profile:** Header order username → role → mood → song; compact bar shows play/pause (white icon), SOUNDCLOUD, song name; icon not distorted.
- [ ] **Public profile:** Song autoplays when enabled; pause works; icon switches play ↔ pause correctly.
- [ ] **Edit profile:** Compact bar visible with play/pause; no autoplay; username one line; no “CLOUD” truncation; no letter-per-line username.
- [ ] **Edit profile ≤768px:** Avatar → meta (centered) → actions row (Edit Username, Edit Avatar smaller); no clipping of button or label.
- [ ] **No default tab:** No tab selected on load; minimal padding above tab strip; clicking a tab shows content.

---

## Notes

- **Autoplay:** Only on public profile (ProfileMoodSongBlock passes `autoPlay`). Edit-profile mini-preview uses `autoPlay={false}`.
- **Pause:** SoundCloud uses widget `getPaused()` on click so pause works even if React state was wrong.
- **Hidden embed:** Kept at `left: 0`, `top: 0` (1x1, opacity 0) so the widget can load/play; bar has z-index 1 so button stays clickable.
- **Player consistency (late):** YouTube uses iframe embed path (like SoundCloud/Spotify) and compact/full sizing rules are shared.
- **Hover hitbox:** Username hover area is limited to the actual username element; popover no longer triggers far away.
- **Notifications width:** Popover width is clamped to avoid shrinking on mobile while still fitting within viewport.

---

## Mobile overflow (2026-02-01)

- **Issue:** Account/Edit profile top buttons and the Activity/Gallery/Notes/… tab row were causing horizontal overflow on mobile.
- **Fix:** `.account-card`: added `max-width: 100%`, `overflow-x: hidden`. `.account-edit-card` and `.account-edit-card--tabs-bottom`: added `max-width: 100%`, `overflow-x: hidden`, `min-width: 0` so the tab pill scrolls inside the card and does not expand the page.
- **Fix:** `.account-tabs`: added `max-width: 100%`, `min-width: 0`, `overflow-x: hidden`; `.account-tabs button`: `min-width: 0` so the Account/Edit profile buttons can shrink. At 480px: `.account-tabs` gap 8px, `.account-tabs button` padding 6px 8px, font-size 13px.
- **Result:** Card and edit card clip horizontal overflow; the tab pill (Activity, Gallery, …) scrolls horizontally inside the card. Top Account/Edit profile buttons stay within the width on narrow viewports.
