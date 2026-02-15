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

## Follow-up Fix: Header Clipping + Notifications Runtime Error
- Reported issues:
  - Library dropdown appeared constrained/clipped by header instead of rendering clearly below.
  - Clicking notifications triggered client-side application error.
- Root causes:
  - Header center container still clipped overflow in this layout path.
  - `NotificationsMenu` still invoked `onClose(...)` internally, but `onClose` had been removed from component props during simplification, causing runtime ReferenceError.
- Fixes:
  - `src/app/globals.css`
    - `.header-center` -> `overflow: visible` to allow dropdown rendering below header.
  - `src/components/NotificationsMenu.js`
    - Restored `onClose` in function props.
  - `src/components/SiteHeader.js`
    - Continues passing `onClose` behavior through notifications usage paths.
- Final verification:
  - `npm run lint` -> pass
  - `npm run build` -> pass
  - Re-ran lint/build again after user confirmation request -> pass/pass.

## Follow-up Fix: Library Dropdown on Small Viewports + Scrollbar Overlap
- Reported issues:
  - Library dropdown was not reliably visible on mobile/smaller viewports.
  - Hovering library items appeared to change row width.
  - Scrollbar could overlap list content.
- Root causes:
  - Small-breakpoint `.header-nav` rules used scroll/hidden overflow behavior that could clip absolutely positioned dropdown content.
  - Library menu width was content-driven, so visual width could feel inconsistent as row states changed.
  - Library list reserved almost no right gutter for the scrollbar track/thumb.
- Fixes:
  - `src/app/globals.css`
    - `.header-nav` under small-breakpoint blocks now uses `overflow: visible` so the anchored library menu can render outside the nav row.
    - `.header-library-menu` now uses a stable responsive width (`min(236px, 86vw)`) rather than `max-content`.
    - `.header-library-list` now reserves scrollbar space via:
      - `padding-right: 8px`
      - `box-sizing: border-box`
      - `scrollbar-gutter: stable`
    - `.header-library-list a` now fills row width consistently (`width: 100%`, `box-sizing: border-box`).
    - `.header-library-item-label` now truncates safely (`display: block`, `overflow: hidden`, `text-overflow: ellipsis`).
- Re-verification:
  - `npm run lint` -> pass
  - `npm run build` -> pass

## Follow-up Interaction Tuning: Hover Forgiveness + Click-to-Pin Library Menu
- UX request:
  - Make hover interaction more forgiving when moving between the trigger and dropdown.
  - Keep library menu open when explicitly opened by click until outside click or menu action.
- Implementation:
  - `src/components/SiteHeader.js`
    - Added `libraryPinnedOpen` state to distinguish click-opened (pinned) vs hover-opened behavior.
    - Added delayed hover-close timer (`220ms`) on library `onMouseLeave`.
    - Hover-enter now clears pending close timers so crossing gaps does not immediately collapse the menu.
    - Click behavior updated:
      - Click opens and pins the menu.
      - If already pinned/open, click toggles it closed.
    - Outside click, `Escape`, route changes, and menu item selection now close and unpin menu state.
- Verification:
  - `npm run lint` -> pass

## Follow-up Polish: Library Dropdown Border Consistency
- Request:
  - Match the Library dropdown border treatment to the other header dropdown menus.
- Change applied:
  - `src/app/globals.css`
    - Updated `.header-library-menu` to include the same outer outline layer used by `.header-menu`:
      - `outline: 1px solid rgba(255, 52, 245, 0.24);`
      - `outline-offset: -1px;`
- Re-check performed:
  - Verified `.header-library-menu` now has both base border and outline.
  - Verified `.header-menu` still uses the same outline values.
  - `npm run lint` -> pass
