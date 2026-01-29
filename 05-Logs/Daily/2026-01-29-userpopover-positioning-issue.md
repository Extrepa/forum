## UserPopover Positioning Issue - 2026-01-29

**Problem:** The `UserPopover` does not consistently display correctly across all viewport sizes, particularly on smaller viewports where it may appear off-screen or in an incorrect position relative to the clicked username. On larger viewports, it might also show up in an unexpected position.

**Desired Behavior:**
*   The popover should prioritize appearing directly below the clicked username.
*   If there isn't enough vertical space below, it should attempt to appear above the username.
*   If there's still no vertical space, it should attempt to appear to the right of the username.
*   If all else fails, it should appear to the left of the username.
*   Crucially, the popover must *always* remain fully within the viewport boundaries (with a minimum 16px padding from edges), adapting its position even if it's wider or taller than the available space in one dimension.
*   This positioning logic should apply consistently across all viewport sizes (desktop, tablet, mobile).
*   The popover should always appear as the topmost element on the page (current `zIndex: 9999` is in place for this).

**Key File Involved:** `src/components/UserPopover.js`

The `calculatePosition` function within this file has been the focus of recent attempts to resolve this, with the latest change implementing a prioritized placement strategy and clamping. However, based on user feedback and provided screenshots, further refinement of this logic is needed.