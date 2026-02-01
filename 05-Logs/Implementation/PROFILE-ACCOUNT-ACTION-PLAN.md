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

## 5. Optional Follow-Up (If Issues Persist)

- If top "Account" / "Edit profile" still truncate on very narrow widths: consider shorter labels (e.g. "Account" / "Profile") or icon-only on smallest breakpoint.
- If tab pill still causes layout issues: confirm no parent between .account-edit-card and .tabs-pill has overflow: visible or min-width that expands; ensure section/account-card has min-width 0.
