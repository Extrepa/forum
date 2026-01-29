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
    - Re-introduced `popoverPosition` state.
    - Re-introduced the `useEffect` for `calculatePosition` with new logic to default to "above and right", then "below and right", with clamping.
    - Reverted popover's inline `style` to use `top: popoverPosition.top` and `left: popoverPosition.left`, removing `transform`.
    - Integrated Floating UI for popover positioning, replacing custom logic with `useFloating`, `offset`, `flip`, and `shift` middleware. The popover's `position` style has been changed from `fixed` to `absolute`.
    - Imported `autoUpdate` from `@floating-ui/react`.
    - Configured `useFloating` to use `whileElementsMounted: autoUpdate`.
    - Reverted the popover's `position` style from `absolute` back to `fixed`.
    - Added `strategy: 'fixed'` to `useFloating` hook for correct fixed positioning calculations.
    - Imported `createPortal` from `react-dom`.
    - Removed the redundant `handleClickOutside` `useEffect`.
    - Wrapped the popover `div` with `createPortal(..., document.body)`.
    - Re-introduced a responsive `maxWidth: 'calc(100vw - 32px)'` to the popover's inline styles.
    - Imported `crossAxis` from `@floating-ui/react`.
    - Added `viewportWidth` state and a `useEffect` to track window resizing.
    - Dynamically set `placement` and `middleware` in `useFloating` based on `viewportWidth`, including `crossAxis(0)` for horizontal centering on small screens and `padding: 16` for `shift`.
    - Removed manual `handleClickOutside` `useEffect` and integrated `useClickOutside` from Floating UI for robust click-outside-to-close functionality.
    - Removed incorrect `crossAxis` import and `crossAxis(0)` middleware usage from Floating UI configuration.
    - Removed incorrect `useClickOutside` import and its usage. Reverted to manual `useEffect` for click-outside-to-close.
    - Re-inserted the `useEffect` for fetching user data with `console.log` and `console.error` statements.
    - Updated `useFloating` middleware to use `autoPlacement` with `crossAxis: true` and `padding: 16` for improved responsive positioning on small viewports.
    - Further refined `useFloating` middleware: Added `alignment: 'center'` to `autoPlacement` for small viewports and `crossAxis: true` to `shift` to explicitly enforce horizontal centering.
    - Fixed `ReferenceError: autoPlacement is not defined` by adding `autoPlacement` to the import statement.
    - Adjusted Floating UI middleware to conditionally use `autoPlacement` with `allowedPlacements: ['bottom', 'top']` and `shift` with `crossAxis: true` for mobile (`viewportWidth <= 640`), and `flip()` for desktop, to address positioning and sizing regressions.
    - Completely rewrote `src/components/UserPopover.js` to remove all Floating UI dependencies, re-implement custom positioning logic (favoring "above and right" for desktop, and centered bottom/top for mobile), and re-implement manual `mousedown` event listener for click-outside-to-close.
    - Modified `UserPopover.js` to conditionally set `width: '100%'` (for mobile) with `minWidth: '120px'` and `maxWidth: 'calc(100vw - 32px)'`, and applied `word-break: break-word` to text elements, and `maxWidth: '100%'` to internal content to ensure proper wrapping and width constraints.
    - Removed the `useEffect` block for click-outside-to-close from `src/components/UserPopover.js` as it is not needed for a hover-triggered popover.
    - Added `console.log('UserPopover: UserInfo for color debug:', userInfo)` before username rendering to debug color issue.
    - **Modified `UserPopover.js` to refine mobile width control by setting `width: 'fit-content'`, `minWidth: '120px'`, and `maxWidth: 'calc(100vw - 32px)'` (without `!important`). Also made the username `color` conditional on `userInfo` being available, falling back to `var(--muted)`.**
- Modified `src/components/Username.js`:
    - Reverted `display: 'inline-flex'` back to `display: 'inline-block'` to avoid potential interference with positioning.
    - Updated `src/components/Username.js` to use `onMouseEnter` and `onMouseLeave` for triggering the popover, with a `hoverTimeout` to manage the close delay.
- Modified `src/app/globals.css`:
    - Updated the `@media (max-width: 640px)` block to include more specific and aggressive width constraints for `.notifications-popover-errl` (e.g., `width: fit-content !important`, `min-width: min(120px, calc(100vw - 32px)) !important`) to force a compact width on mobile.

## Follow-up Notes (2026-01-29)

### Notes
- Scoped mobile notifications-popover overrides so they no longer affect the username hover popover; added `.user-popover` to keep the popover from inheriting mobile full-width `.card` rules.
  - Files: `src/app/globals.css`, `src/components/UserPopover.js`
- Added touch toggle behavior (tap to open/close), restored click-outside close for the popover, and removed popover debug logs.
  - Files: `src/components/Username.js`, `src/components/UserPopover.js`
- Fixed username color resolution in the popover by normalizing API lookup to `username_norm`.
  - File: `src/app/api/user/[username]/route.js`
- Added `--username-*` CSS variables and switched the popover name to `username username--{index}` for future-proofing.
  - Files: `src/app/globals.css`, `src/components/UserPopover.js`
- Removed only the avatar border inside the popover; kept the popover outline intact.
  - File: `src/components/UserPopover.js`
- Profile role now uses role-based fill/color and label; role colors are centralized as CSS variables.
  - Files: `src/app/profile/[username]/page.js`, `src/app/globals.css`

### Changelog
- Fixed: Username hover popover sizing and mobile overrides no longer force full-width.
- Fixed: Username hover popover now resolves preferred username color reliably.
- Changed: Popover username uses shared `username` class styling (consistent glow + future-proofing).
- Changed: Popover avatar no longer has an outline/border.
- Added: Role-based color fill for profile role label with configurable CSS vars.
