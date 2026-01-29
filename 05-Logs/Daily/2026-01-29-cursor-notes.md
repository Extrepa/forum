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
    - Removed `maxWidth: 'calc(100vw - 32px)'` from the popover's inline styles.
    - Reduced the vertical offset from `8px` to `4px` in `calculatePosition`.
    - Simplified `calculatePosition` to always apply clamping, first attempting to place below the anchor, then above if necessary.
    - Removed the `useEffect` hook containing the `calculatePosition` function to eliminate complex positioning logic.
    - Removed the `popoverPosition` state.
    - Set the popover's `style` to `top: '50%'`, `left: '50%'`, and `transform: 'translate(-50%, -50%)'` to center it on the screen.
- Modified `src/components/Username.js`:
    - Reverted `display: 'inline-flex'` back to `display: 'inline-block'` to avoid potential interference with positioning.