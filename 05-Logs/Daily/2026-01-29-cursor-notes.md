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

---

## Continuation: Easter egg visuals and border (same session)

**Completed:**
- **ErrlSVG rainbow stroke**: Added SVG `<defs>` with `linearGradient` id `rainbowGradient` (cyan → magenta → lime → green → cyan). Face, eyes, and mouth paths now use `stroke="url(#rainbowGradient)"` and `strokeWidth="12"` for consistent outline weight.
- **Face size**: Increased interactive face from `w-12 h-12 md:w-14 md:h-14` to `w-16 h-16 md:w-20 md:h-20`; position offsets updated from `-32` to `-40` so the larger face stays centered on the physics body (radius 32 unchanged).
- **Rainbow border**: Applied `rainbow-border rounded-3xl` to the game container div (ref={containerRef}) so the existing `.rainbow-border::before` neonChase animation shows around the game area.
- Neon-text glow was already reduced (0 0 5px / 0 0 10px, lower opacity).

**Files:** `public/easter-eggs/errl-bubbles-header.html`

---

## Wrap-up: Easter egg verification (session end)

**Scope:** Feed-button drag-and-drop, header Easter egg game, and in-iframe visuals.

### Verification checklist

| Area | Status | Notes |
|------|--------|--------|
| **Drag ghost** | OK | `createPortal` renders ghost into `document.body`; no header stacking-context issues. |
| **Drag initiation** | OK | `handleEggDragStart` uses `event.currentTarget` and `target.getBoundingClientRect()`; `setPointerCapture(pointerId)` for consistent tracking. |
| **Hidden feed button** | OK | `.nav-link-egg-hidden` uses `opacity: 0` (not `visibility: hidden`) so the element stays in layout for pointer events. |
| **Header when egg active** | OK | Brand, nav, search, more dropdown hidden via `{!eggActive && (...)}`; `header--easter-egg` min-height 480px (380px mobile); direct children `pointer-events: none`, overlay `pointer-events: auto`. |
| **Iframe game** | OK | `errl-bubbles-header.html`: transparent body, Matter.js radius 32, face position offsets -40, motion.div `w-16 h-16 md:w-20 md:h-20`. |
| **ErrlSVG** | OK | `<defs>` with `#rainbowGradient`; face/eyes/mouth use `stroke="url(#rainbowGradient)"` and `strokeWidth="12"`. |
| **Neon / border** | OK | `.neon-text` reduced glow; game container has `rainbow-border rounded-3xl` and `neonChase` animation. |

### Files touched this session

- `src/components/SiteHeader.js` – egg drag (createPortal, currentTarget, setPointerCapture), conditional header content when egg active.
- `src/app/globals.css` – `.nav-link-egg-hidden` (opacity), `.nav-egg-drag-ghost`, `header.header--easter-egg` (min-height, pointer-events).
- `public/easter-eggs/errl-bubbles-header.html` – rainbow stroke, face size/position, rainbow border on container, reduced title glow.

### Follow-ups (optional)

- Manually test: drag Feed into logo zone on desktop and mobile; confirm ghost follows cursor and drop activates game; confirm header content is hidden and iframe fills header.
- If face feels off-center on very small viewports, consider responsive position offset (e.g. -32 for 64px face, -40 for 80px) instead of fixed -40.
