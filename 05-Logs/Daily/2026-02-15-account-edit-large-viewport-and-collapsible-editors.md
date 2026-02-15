# 2026-02-15 - Account Edit Large Viewport + Collapsible Username/Avatar Editors

## Objective
- Use more available horizontal space on larger account page viewports.
- Reduce unnecessary whitespace in Edit Profile Username/Avatar subtabs.
- Change Username and Avatar editing to summary-first cards with explicit `Edit` expansion.
- Avoid large-viewport avatar GIF/editor stutter by deferring heavy customizer render until requested.

## Files Updated
- `src/app/account/AccountTabsClient.js`
- `src/app/globals.css`

## Implementation
- Desktop account container width:
  - Updated `.account-card` desktop max width from `800px` to `min(1280px, calc(100vw - 96px))`.
- Username subtab:
  - Reworked to show a compact summary block (current username, selected color label/swatch, role visibility status).
  - Added `Edit username` button to expand/collapse inline editing controls.
  - Save flow now collapses back to summary after successful update.
- Avatar subtab:
  - Reworked to show compact preview block (main avatar preview + mini preview).
  - Added `Edit avatar` button to expand/collapse editor on demand.
  - `AvatarCustomizer` now renders only while expanded, reducing immediate heavy render work on large viewports.
  - Added UX note: editing is smoothest on medium-sized windows while still supported on large screens.
- Whitespace reduction:
  - Stopped rendering generic tab-content wrapper for `username` and `avatar` subtabs.
  - Updated `.account-edit-card--tabs-bottom .account-edit-tab-content--above` min height from `80px` to `0`.

## Double-Check / Validation
- Reviewed JSX/state flow in `AccountTabsClient`:
  - Expansion toggles (`toggleUsernameEditor`, `toggleAvatarEditor`) wired and scoped to matching subtabs.
  - Avatar unsaved-change confirm still enforced when closing expanded editor or changing subtabs.
- Verified presence of new behavior selectors/strings:
  - `Edit username`, `Edit avatar`, performance note copy.
  - Conditional wrapper exclusion for username/avatar tab content.
  - Desktop width and min-height CSS updates.
- Ran full lint check:
  - `npm run lint` -> pass.

## Notes
- Workspace contains unrelated modified/untracked files from parallel workstreams; this update remained scoped to the two files listed above.
