## Username Popover Positioning Issue

**Problem:** The `UserPopover` component is not positioning correctly, especially on mobile and small viewports, causing it to go off-screen. It should appear near the clicked username.

**Analysis:**
- `UserPopover.js` contains the positioning logic in the `calculatePosition` function within a `useEffect` hook.
- It attempts to place the popover below, above, right, or left of the `anchorRef` (from `Username.js`).
- Clamping logic is present to keep the popover within the viewport, but it seems to be failing or insufficient in certain scenarios.
- `Username.js` passes the `anchorRef` to `UserPopover` correctly and manages the `showPopover` state.

**Next Steps:**
1. Review `calculatePosition` in `UserPopover.js` closely, especially the clamping and priority logic, considering mobile/small viewport specific issues.
2. Consider adding more aggressive clamping or a different positioning strategy for very small viewports.

**Changes made on 2026-01-29:**
- Modified `src/components/UserPopover.js`:
    - Removed explicit `minWidth` and `maxWidth` from the popover's inline styles to allow for more flexible sizing.
    - Updated horizontal and vertical clamping logic in `calculatePosition` to be more robust, ensuring the popover stays within viewport bounds more effectively.
    - Refactored horizontal positioning logic to prioritize centering on smaller screens, followed by clamping, to prevent off-screen display on mobile and narrow viewports.
    - Added a `useEffect` hook to implement click-outside-to-close functionality. The popover now disappears when a user clicks anywhere outside of the popover or its trigger element.
    - Further refined `calculatePosition` to prioritize positioning directly below or above the anchor, horizontally centered, with robust clamping, removing the previous complex horizontal centering attempt.
- Modified `src/components/Username.js`:
    - Changed the outer `span` to `display: 'inline-flex'` to provide more accurate dimensions for the popover's positioning.
- Modified `src/components/UserPopover.js`:
    - Introduced `maxWidth: 'calc(100vw - 32px)'` to the popover's inline styles to ensure it doesn't overflow on small screens.
    - Simplified vertical positioning in `calculatePosition` to prioritize displaying below the anchor, then above, with no fallback if neither fits perfectly.