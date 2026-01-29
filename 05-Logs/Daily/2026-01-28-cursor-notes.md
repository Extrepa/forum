# Cursor Notes - 2026-01-28

## Current Task: Avatar Customizer Settings Panel Refinement

### Status Update
- Site-wide avatar integration is complete.
- Branch `feat/avatar-customizer` is active.
- Fixed settings panel "stretching" on mobile by excluding it from global `.card` rules in `globals.css`.
- Refactored dragging and positioning logic in `AvatarCustomizer.js` to clamp to viewport width.
- Build verified (successfully compiled).

### Identified Issues
- **Responsive Sizing [FIXED]**: The settings panel was stretching due to a `.card { width: 100% !important }` rule in `globals.css` on small viewports.
- **Dragging Logic [IMPROVED]**: Panel can no longer be dragged off the right edge of the viewport.
- **Context Menu Positioning [IMPROVED]**: Initial placement now respects viewport boundaries.
- **Visual "Squishing" [FIXED]**: Fixed width of 195px is now reliably enforced.

### Action Plan
1. Refactor `getPanelWidth` and `positionPanelAtPoint` to be more robust.
2. Fix `handlePanelTouchMove` and `handleMouseMove` to ensure smooth dragging relative to the viewport.
3. Optimize the settings panel CSS for tighter mobile layouts.
4. Verify all keyboard shortcuts (Esc, R, +/-, Undo/Redo) work correctly after UI changes.
