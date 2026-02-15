# Daily Log - 2026-02-15 - Library + Notification Popover Positioning

## Objective
- Fix desktop full-viewport popover placement so Library and Notifications open near their triggers.
- Simplify panel positioning behavior across desktop and mobile to one consistent anchor-and-clamp approach.
- Add desktop hover-open behavior for the Library menu while preserving click behavior.

## Changes Implemented
- Added shared positioning utility:
  - `src/lib/anchoredPopover.js`
  - New helper: `getAnchoredPopoverLayout(...)`
  - Behavior:
    - Anchors to trigger rect.
    - Clamps horizontally to viewport with edge padding.
    - Opens below trigger by default, flips above only if required by space.
    - Computes bounded max height to keep panel inside viewport.

- Updated Library menu behavior in header:
  - `src/components/SiteHeader.js`
  - Replaced ad-hoc library position math with `getAnchoredPopoverLayout(...)`.
  - Added desktop-only hover support (`(hover: hover) and (pointer: fine)`):
    - Hover on Library button opens menu.
    - Hover on menu keeps it open.
    - Leaving button/menu closes with short delay (140ms) to avoid flicker between trigger and panel.
  - Preserved click-to-open/click-to-close behavior.

- Updated Notifications panel anchoring:
  - `src/components/SiteHeader.js`
  - Added dedicated trigger ref on notifications button (`notifyAnchorRef`) and passed it into `NotificationsMenu`.
  - Outside click detection now checks the actual notifications button ref.
  - This resolves drift from anchoring to the broader wrapper element.

- Updated Notifications panel position logic:
  - `src/components/NotificationsMenu.js`
  - Replaced local right-align clamp implementation with `getAnchoredPopoverLayout(...)` using `align: 'end'`.
  - Removed legacy `anchor` prop usage; now relies on shared anchored logic.
  - Kept fixed/fallback style defaults for safe initial render before first position update.

## Verification Performed
- `npm run lint` -> pass.
- `npm run build` -> pass.
- Manual code-level checks completed for:
  - trigger refs and click-outside handling
  - hover timers cleanup
  - viewport clamp behavior and top/height calculations
  - no regressions in menu open/close state wiring

## Notes
- Workspace has many unrelated modified files from parallel ongoing work; this task intentionally only changed:
  - `src/lib/anchoredPopover.js` (new)
  - `src/components/SiteHeader.js`
  - `src/components/NotificationsMenu.js`
- Existing unrelated logic in `NotificationsMenu` (admin/broadcast labeling paths) was left untouched.

## Follow-up Simplification Pass (User Feedback)
- Feedback:
  - Current behavior still felt over-engineered and not aligned with expected "normal dropdown under the trigger" behavior.
  - Reference behavior confirmed from three-dot menu.
- Simplification applied:
  - Removed custom viewport position math for Library and Notifications.
  - Reworked both as straightforward anchored popouts in header containers:
    - Library: absolute menu under `.header-library`
    - Notifications: absolute menu under `.header-avatar`
  - Kept click-to-toggle behavior.
  - Kept desktop hover-open for Library (open on enter, close on leave).
  - Updated outside-click checks to use container refs directly (no global popover query dependency).
- CSS correction found during recheck:
  - Base `.header-library-menu` still had a leftover `transform: none`, which canceled center alignment.
  - Removed that override so centered dropdown anchor works as intended on desktop.
- Verification after simplification:
  - `npm run lint` -> pass
  - `npm run build` -> pass
