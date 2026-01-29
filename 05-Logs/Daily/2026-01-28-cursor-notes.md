# Cursor Notes - 2026-01-28

## Current Task: Avatar Customizer Settings Panel Refinement

### Status Update
- Site-wide avatar integration is complete.
- Branch `feat/avatar-customizer` is active with several uncommitted refinements.
- Transitioning focus to the "Settings Panel" UX on mobile and smaller viewports.

### Identified Issues
- **Responsive Sizing**: The settings panel (popout) has inconsistent width behavior on small screens.
- **Dragging Logic**: Dragging the panel on mobile/touch is buggy, often resetting or jumping.
- **Context Menu Positioning**: Long-press/Right-click positioning of the panel can push it off-screen or overlap poorly on mobile.
- **Visual "Squishing"**: Need to ensure the panel layout remains usable even when viewport width is limited.

### Action Plan
1. Refactor `getPanelWidth` and `positionPanelAtPoint` to be more robust.
2. Fix `handlePanelTouchMove` and `handleMouseMove` to ensure smooth dragging relative to the viewport.
3. Optimize the settings panel CSS for tighter mobile layouts.
4. Verify all keyboard shortcuts (Esc, R, +/-, Undo/Redo) work correctly after UI changes.
