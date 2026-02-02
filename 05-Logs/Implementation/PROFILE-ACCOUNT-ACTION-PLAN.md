# Profile & Account Page — Action Plan & Verification

**Date:** 2026-01-31  
**Scope:** User-reported issues for profile view, account/edit profile, song player, layout, and buttons.

---

## 1. Issues Checklist (User-Reported)

| # | Issue | Status | Notes |
|---|--------|--------|--------|
| 1 | Play/pause button glitching on profile; no way to pause after play | Done | ProfileSongPlayer: handleToggle + getPaused (SoundCloud), onStateChange (YouTube); PLAY/PAUSE/FINISH bindings |
| 2 | Account page crammed into a box; scroll when not needed; tab buttons messed up | Done | account-edit-card/account-edit-card--tabs-bottom overflow-x hidden; tabs-pill overflow-x auto, max-width 100% |
| 3 | Edit Username / Edit Avatar too large on small viewports, pushing content off | Done | .account-profile-preview .account-edit-profile-btn: max-width 100%, min-width 0, smaller padding/font on mobile |
| 4 | Swap button order: Edit Avatar on top, Edit Username on bottom (desktop + mobile) | Done | JSX order swapped in AccountTabsClient.js; comment updated |

---

## 2. Code Verification

### 2.1 Button order (Edit Avatar / Edit Username)

- **File:** `src/app/account/AccountTabsClient.js`
- **Check:** First button in the actions column is "Edit Avatar", second is "Edit Username".
- **Verified:** Lines 955–971: Edit Avatar button first, Edit Username second. Comment at ~917 updated to "Edit Avatar on top, Edit Username below".

### 2.2 Top Account / Edit profile tab overflow

- **File:** `src/app/globals.css`
- **Check:** `.account-tabs` has max-width 100%, min-width 0, overflow-x hidden; buttons have overflow hidden, text-overflow ellipsis, white-space nowrap.
- **Verified:** Lines 940–951. Narrow breakpoint (≤480px): account-tabs button font-size 12px, padding 6px 8px (lines 2460–2466).

### 2.3 Tab row (Activity, Gallery, Notes, etc.) overflow

- **File:** `src/app/globals.css`
- **Check:** `.account-edit-card` and `.account-edit-card--tabs-bottom` have overflow-x hidden, max-width 100%. `.tabs-pill` has overflow-x auto, max-width 100%, min-width 0.
- **Verified:** account-edit-card 919–927; account-edit-card--tabs-bottom 929–937 (overflow-y visible); tabs-pill 2118–2132.

### 2.4 Edit Username / Edit Avatar button size on mobile

- **File:** `src/app/globals.css`
- **Check:** In @media (max-width: 768px), `.account-profile-preview .account-edit-profile-btn` has min-width 0, max-width 100%, width auto, smaller padding/font.
- **Verified:** Lines 2303–2310 (min-width 0, max-width 100%, width auto, padding 4px 10px, font-size 11px, box-sizing border-box).

### 2.5 ProfileSongPlayer — play/pause behavior

- **File:** `src/components/ProfileSongPlayer.js`
- **Check:** handleToggle uses SoundCloud getPaused for correct toggle; YouTube uses isPlaying + handlePlay/handlePause. PLAY/PAUSE/FINISH (SoundCloud) and onStateChange (YouTube) keep isPlaying in sync.
- **Verified:** handleToggle 144–164; handlePlay 123–132; handlePause 134–142; SoundCloud bindings 66–68; YouTube onStateChange 99–103. Compact embed hidden (1x1, opacity 0, pointer-events none) so bar button remains clickable.

---

## 3. Files Touched (This Pass)

- `src/app/account/AccountTabsClient.js` — Button order (Edit Avatar first, Edit Username second); comment fix.
- `src/app/globals.css` — account-tabs overflow/ellipsis; account-edit-card--tabs-bottom overflow-y visible; account-edit-profile-btn max-width 100% on mobile; narrow breakpoint top tab font-size 12px.
- `05-Logs/Daily/2026-01-31-cursor-notes.md` — Log entry for button order, overflow, button size.
- `05-Logs/Implementation/PROFILE-ACCOUNT-ACTION-PLAN.md` — This document.

---

## 4. Layout containment (verified)

- Account page root: `<section className="card account-card">` — `.account-card` has `min-width: 0`, `width: 100%`, `max-width: 100%`, `overflow-x: hidden` (globals.css ~806).
- Profile edit content wrapper: `<div style={{ minWidth: 0, maxWidth: '100%' }}>` around `.account-edit-card` (AccountTabsClient.js ~914).
- Grid for Account/Edit profile tabs: inline `gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)'`, `width: '100%'`, `minWidth: 0`.

---

## 5. Song Player & Rainbow Borders (2026-02-01)

### 5.1 Autoplay vs pause (no overlap)

- **Problem:** Autoplay timeouts (e.g. 300ms, 800ms) could fire after user pressed pause, causing the track to start again; `setIsPlaying(true)` from a timeout overwrote user state.
- **Fix (ProfileSongPlayer.js):**
  - `userPausedRef`: when user pauses, set to `true`; when user presses play, set to `false`. Autoplay only runs if `!userPausedRef.current`.
  - `autoplayTimeoutsRef`: store timeout IDs; clear on pause and on unmount. Single autoplay delay (400ms SoundCloud, 200ms YouTube) instead of multiple.
  - YouTube `playerVars: { autoplay: 0 }`; start playback only from JS after ready, so we can gate on `userPausedRef`.
  - PLAY event: `if (!userPausedRef.current) setIsPlaying(true)` so late PLAY from widget does not overwrite user pause.
  - handlePause / handleToggle (when pausing): call `clearAutoplayTimeouts()` and set `userPausedRef.current = true`.

### 5.2 Progress bar

- **SoundCloud:** Bind `PLAY_PROGRESS`; use `e.relativePosition` (0–1) for `progress` state; on FINISH set progress to 0.
- **YouTube:** When `isPlaying`, poll every 500ms with `getCurrentTime()` / `getDuration()`; set progress; on state 0 (ended) set progress to 0.
- **UI:** In compact mode only, a thin bar below the control row: `.profile-song-player-progress-wrap` (track) and `.profile-song-player-progress-fill` (width from `progress`). CSS in globals.css.

### 5.3 Artist/song display cleanup

- Bar content is now: `profile-song-player-meta` wrapping `profile-song-player-provider` (small uppercase label, e.g. "SoundCloud") and `profile-song-player-name` (link with humanized song name from URL). Provider and song name are visually separated; song name is the main focus.

### 5.4 Rainbow chasing borders

- **Tab switcher:** `.tabs-pill` already had neonChase `::before` / `::after` in globals.css; no change.
- **Avatar / profile card:** `.profile-card` added to the same neonChase `::before` and `::after` blocks as `.card` and `.tabs-pill`. `.profile-card` given `position: relative` and `isolation: isolate` so the pseudo-elements show. Static color-mode override `[data-ui-color-mode="2"]` also includes `.profile-card::before` / `::after`.

### 5.5 Files touched (this pass)

- `src/components/ProfileSongPlayer.js` — userPausedRef, autoplayTimeoutsRef, single autoplay, PLAY gate, progress state, PLAY_PROGRESS / YouTube poll, progress bar UI, meta/provider/name structure.
- `src/app/globals.css` — profile-song-player-meta, -provider, -name, progress-wrap/track/fill; profile-card position/isolation; profile-card in neonChase and color-mode overrides.

---

## 6. Optional Follow-Up (If Issues Persist)

- If top "Account" / "Edit profile" still truncate on very narrow widths: consider shorter labels (e.g. "Account" / "Profile") or icon-only on smallest breakpoint.
- If tab pill still causes layout issues: confirm no parent between .account-edit-card and .tabs-pill has overflow: visible or min-width that expands; ensure section/account-card has min-width 0.

---

## 7. Follow-Up Additions (2026-02-01)

- **Player consistency across providers:** ProfileSongPlayer now renders embeds consistently for YouTube/SoundCloud/Spotify (iframe embeds + shared sizing), and compact/full styles are honored in profile + edit preview.
- **Public profile placement:** Player sits top-right on desktop without overflow; mobile remains stacked column layout.
- **Edit profile mini-preview:** Compact preview only; no overflow in the mini card.
- **Username hover:** Hover hitbox tightened to the username element to prevent popover triggering from nearby blank space.
- **Notifications popover:** Width clamped to prevent unintended shrinking on mobile/desktop.
