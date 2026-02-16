# Daily Log - 2026-02-16 - Post Action Menu Portal + Z-Index Visibility Fix

## Request
- Move the Edit Post tool panel out of breadcrumb-area constraints.
- Ensure the panel appears on all viewport sizes.
- Ensure it layers above other UI (z-index) and does not disappear.

## Files Updated
- `src/components/PostActionMenu.js`
- `src/app/globals.css`

## Implementation
- Updated `PostActionMenu` to render the popover through a portal (`document.body`) instead of inside the breadcrumb row container.
- Kept anchor-based positioning and improved viewport clamping:
  - desktop/tablet: prefers left of trigger and falls back to right when needed,
  - mobile (`<=640px`): prefers below trigger and clamps to viewport edges.
- Raised popover stack level to ensure top-layer rendering:
  - inline popover style `zIndex: 4000`,
  - CSS fallback `.post-action-menu__popover { z-index: 4000; }`.
- Added small-screen resilience so controls remain visible:
  - `.post-action-menu__popover` now allows wrapping on mobile (`white-space: normal; flex-wrap: wrap;`).

## Verification
- `npm run lint` -> pass.
- `npm run build` -> pass.
- Usage sweep confirms `PostActionMenu` is shared across all detail pages, so fix applies consistently across:
  - announcements, events, lobby/forum thread detail, projects, devlog, music, art/memories/lore/nostalgia/nomads/rant/bugs detail views.

## Double-check Notes
- The change is centralized in `PostActionMenu`, minimizing per-page drift.
- Rendering through `document.body` removes local stacking/overflow clipping from breadcrumb/page-top-row wrappers.
- No API/data-layer changes; behavior change is isolated to client-side control panel layering/positioning.
