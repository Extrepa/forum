# Cursor Notes - 2026-01-28

## Task: Avatar Customizer Mobile UX & Settings Panel Refinement

### Status Update
- Core avatar integration is stable and site-wide.
- Branch `feat/avatar-customizer` is ready for test deployment.
- Mobile UX for the settings panel has been significantly improved.
- **Build Verified**: Successfully compiled with `npm run build` after fixing minor ESLint entity escaping issues.
- **Ready for Deployment**: All features and fixes are verified and stable.

### Key Improvements & Fixes

#### 1. Settings Panel Responsiveness & Layout
- **Fixed "Stretching" Bug**: Excluded `.avatar-customizer-panel` from global `.card` rules in `globals.css` that forced 100% width on mobile.
- **Stable Dimensions**: Enforced a strict `195px` width with dynamic height to prevent visual squishing.
- **Header Refinement**: Compacted the panel header and redesigned the "X" button (`22x12px`) to stay within the text height.

#### 2. Advanced Dragging & Positioning
- **Decoupled from Container**: Refactored `positionPanelAtPoint` and `handleMove` to use `position: absolute` with viewport-relative clamping.
- **Freedom of Movement**: The panel can now be dragged anywhere on the visible page, even outside the avatar canvas boundaries, without snapping back.
- **Accurate Placement**: Fixed a bug where the panel appeared at random spots; it now opens precisely at the touch/click location.
- **Scroll Prevention**: Added `touchAction: 'none'` and `e.preventDefault()` to ensure page scrolling is locked while dragging the panel header on mobile.

#### 3. UX & Help System
- **Context Awareness**: Long-press on mobile now correctly triggers the customization panel at the touch point.
- **Clearer Instructions**: Updated the help (`?`) menu and the quick-tip overlay to explicitly separate **Desktop** (Arrows, shortcuts) vs **Mobile** (Long-press, Double-tap) controls.

### Technical Details
- **Clamping Math**: Uses `getBoundingClientRect` of the container vs `window.innerWidth/Height` to calculate local offsets for `absolute` positioning that feels like `fixed`.
- **CSS Hierarchy**: Balanced inline React styles with global CSS overrides for maximum control over mobile behavior.

### Next Steps
- Perform test deployment.
- Monitor user feedback on mobile interaction fluidity.
