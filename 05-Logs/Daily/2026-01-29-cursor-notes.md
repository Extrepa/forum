# Daily Log - 2026-01-29

## Task: Fix Easter Egg Feed Button Drag Issue

**User Query:** The feed button is not staying attached to the mouse when dragging.

**Investigation:**
- Located `src/components/SiteHeader.js` as the main component managing the drag state (`eggDragging`, `dragPoint`).
- Identified `src/app/globals.css` containing `.nav-egg-drag-ghost` and `.nav-link-egg-hidden`.
- **Root Cause Analysis**:
  1. `.nav-link-egg-hidden` used `visibility: hidden`. When the drag started, the element became invisible, causing it to stop receiving/emitting pointer events (or bubbling them), which broke the drag interaction immediately or intermittently.
  2. Dragging lacked `setPointerCapture`, making it vulnerable to the pointer leaving the window or entering iframes (which swallow events).

**Fixes Applied:**
- **CSS**: Changed `.nav-link-egg-hidden` to use `opacity: 0` instead of `visibility: hidden`. This keeps the element interactive and part of the layout while still hiding it visually.
- **JS**: Added `event.target.setPointerCapture(event.pointerId)` in `handleEggDragStart` in `SiteHeader.js` to robustly track the pointer during the drag operation.

**Status:**
- Fixes implemented.
