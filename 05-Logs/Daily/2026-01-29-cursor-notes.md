# Daily Log - 2026-01-29

## Task: Fix Easter Egg Feed Button Drag Issue

**User Query:** The feed button is not staying attached to the mouse when dragging. "It's still appearing where it's still not starting the drag of the button at the button."

**Investigation:**
- **Issue 1**: The ghost element (`.nav-egg-drag-ghost`) was being rendered inside the `header`. If the header has stacking contexts (via `isolation: isolate` or other properties), fixed positioning could be affected or z-indexed incorrectly against siblings.
- **Issue 2**: The drag geometry (`rect` and offset) calculation relied on `feedLinkRef.current`. Since `NavLinks` is rendered in multiple places (desktop, mobile menu, "more" menu), the ref might point to a hidden or unmounted instance, causing `rect` to be zero or wrong. This would make the ghost jump to the mouse cursor (offset 0) instead of matching the button's position.

**Fixes Applied:**
- **Updated `SiteHeader.js`**:
  - Used `createPortal` to render the ghost element directly into `document.body`. This ensures it lives in the top-level stacking context and is positioned relative to the viewport reliably.
  - Updated `handleEggDragStart` to use `event.currentTarget` instead of `feedLinkRef.current`. This guarantees we calculate geometry based on the *actual element the user touched*, regardless of where the ref is currently pointing.
  - Added `mounted` state check to safely use `createPortal` with SSR.

**New Request:**
- "Make the header back to its normal height" and "shrink the face by almost half".
- **Action**: Modified `public/easter-eggs/errl-bubbles-header.html`.
  - Reduced physics body radius from 60 to 32.
  - Reduced visual face size classes from `w-24 h-24` (96px) to `w-12 h-12` (48px).
  - Updated offset calculations (`x - 32`, `y - 32`) to match the new half-size (center point shift).

**Status:**
- Header height logic was already removed in the previous step.
- Face size in the Easter egg iframe has been halved.
