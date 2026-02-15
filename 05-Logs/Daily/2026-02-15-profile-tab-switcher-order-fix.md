# 2026-02-15 - Profile Tab Switcher Order Fix

## Objective
- Ensure the profile tab switcher appears above tab content (matching expected profile layout behavior).

## Files Updated
- `src/components/ProfileTabsClient.js`
- `src/app/globals.css`

## Implementation
- Moved `ErrlTabSwitcher` in `ProfileTabsClient` to render before `.profile-tab-content`.
- Updated profile tab content spacing rules from bottom-offset to top-offset so spacing remains correct with the new order:
  - `.profile-tab-content--above`: `margin-bottom` -> `margin-top`
  - `.profile-tab-content--above.profile-tab-content--no-selection`: keep zero offset
  - Updated responsive overrides that previously set `margin-bottom`.

## Double-Check / Validation
- Confirmed public profile render order now places switcher above content.
- Confirmed edit profile sub-tab switcher already renders above its content and required no JSX reorder.
- Ran full lint check:
  - `npm run lint` -> pass.

## Notes
- Workspace contains other unrelated modified/untracked files from parallel work; this fix remained scoped to the two files listed above.
