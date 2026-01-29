# Cursor Notes - 2026-01-28

## Current Task: Avatar Customizer Settings Panel Refinement

### Status Update
- Site-wide avatar integration is complete.
- Branch `feat/avatar-customizer` is active.
- Fixed settings panel "stretching" on mobile by excluding it from global `.card` rules in `globals.css`.
- Switched settings panel to `position: fixed` to allow dragging it anywhere on the page, bypassing container constraints.
- Refactored dragging and positioning logic in `AvatarCustomizer.js` to use viewport coordinates and clamp to viewport edges.
- Build verified (successfully compiled).

### Identified Issues
- **Responsive Sizing [FIXED]**: The settings panel was stretching due to a `.card { width: 100% !important }` rule in `globals.css` on small viewports.
- **Dragging Logic [FIXED]**: Panel now uses `position: fixed`, allowing it to be dragged freely across the entire page while remaining clamped to viewport edges.
- **Context Menu Positioning [FIXED]**: Initial placement now uses viewport coordinates, preventing it from being pushed off-screen.
- **Visual "Squishing" [FIXED]**: Fixed width of 195px is now reliably enforced.
- **UI Refinements [FIXED]**: Compact "X" button and better mobile drag behavior (preventing page scroll).

### Action Plan
1. Refactor `getPanelWidth` and `positionPanelAtPoint` to be more robust.
2. Fix `handlePanelTouchMove` and `handleMouseMove` to ensure smooth dragging relative to the viewport.
3. Optimize the settings panel CSS for tighter mobile layouts.
4. Verify all keyboard shortcuts (Esc, R, +/-, Undo/Redo) work correctly after UI changes.
