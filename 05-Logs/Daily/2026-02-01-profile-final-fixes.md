# Profile Final Refinements & Fixes (2026-02-01)

Final set of refinements addressing play/pause visibility, vertical stacking issues, and layout clipping on the edit-profile screen.

---

## 1. Play/Pause Button Visibility & Interaction

- **Fix:** For SoundCloud, changed `handleToggle` to use the widget's `getPaused()` API. On click, it now queries the real state of the player so `play()` or `pause()` is called correctly, even if React state was out of sync.
- **Fix:** Switched play/pause icon color to white (`#ffffff`) and added a `2px` teal border to the circular button. This ensures the icon stays visible even if the gradient background fails to render.
- **Fix:** Set `pointerEvents: 'none'` on the hidden SoundCloud iframe when in compact mode to ensure it cannot intercept clicks intended for the play button.
- **Fix:** Moved the hidden compact embed from `left: -9999` to `left: 0, top: 0` with `1x1` size and `opacity: 0`. This keeps the widget "visible" to the browser, which helps with initialization and autoplay.
- **Fix (icon distortion):** Added `preserveAspectRatio="xMidYMid meet"` to play/pause SVGs so they scale without stretching or tilting. Compact button SVGs get `min-width`/`min-height: 18px`; base `.profile-song-player-btn svg` uses `object-fit: contain`.
- **Fix (label clipping):** Provider label has `white-space: nowrap` and compact bar has `min-width: 140px` so "SOUNDCLOUD" is not truncated to "CLOUD".

---

## 2. Edit Profile Layout (Mini-Preview)

- **Fix:** Prevented the username from displaying vertically (one letter per line) by adding `white-space: nowrap` and `overflow: hidden` to `.account-profile-preview .profile-card-header-meta .username`.
- **Fix:** Resolved clipping where the play button and "SOUND" were cut off (leaving only "CLOUD"). Added `overflow: visible` to the preview container, meta column, and player bar.
- **Fix:** In the `768px` media query, gave the meta column a `min-width: 180px` and set the song bar to `flex-wrap: nowrap`. This ensures the column is wide enough to show the button and provider label without squashing the left side.
- **Fix:** Stacking order at `768px` is now avatar (top/center) → meta/song (middle/center) → actions row (bottom/center) so nothing is squeezed horizontally.

---

## 3. Tab Padding

- **Fix:** Reduced vertical gap when no tab is selected. When `activeTab` is null, the wrapper and content divs now have `min-height: 0`, `margin: 0`, and `flex: none`. This removes the empty space that previously sat above the tab row.

---

## 4. Player Consistency + Hover/Notifications (2026-02-01 late)

- **Profile player consistency:** Unified embed rendering for YouTube/SoundCloud/Spotify with compact/full styles, consistent sizing, and iframe embeds for YouTube so the player renders uniformly across providers.
- **Public profile layout:** Player stays top-right on desktop without overflowing the header card; mobile layout remains stacked/centered.
- **Edit profile mini-preview:** Player remains compact (visual readiness only) and no longer overflows the mini preview card.
- **Username hover hitbox:** Hover target tightened so the popover only triggers when hovering the username, not nearby empty space.
- **Notifications panel width:** Popover width stabilized to avoid shrinking; aligns to the header trigger without overflow.

---

## Files Updated

| File | Key Changes |
|------|-------------|
| `src/components/ProfileSongPlayer.js` | `getPaused()` sync, white icons, off-screen hidden embed, `stopPropagation`. |
| `src/app/globals.css` | `overflow: visible` for preview, `180px` min-width for meta, vertical stacking at 768px, no-tab-selection padding. |
| `src/components/ProfileTabsClient.js` | Added classes for `no-selection` state to tighten padding. |
| `src/app/account/AccountTabsClient.js` | Dispatched `autoPlay={false}` for the mini-preview. |

---

## Verification Status

- [x] Play/Pause icons are white and clearly visible.
- [x] Pause works reliably (tested via SoundCloud API sync).
- [x] Username stays horizontal on all viewport sizes.
- [x] Song bar does not clip the play button or "SOUNDCLOUD" text.
- [x] No excessive empty space when viewing a profile with no default tab.
