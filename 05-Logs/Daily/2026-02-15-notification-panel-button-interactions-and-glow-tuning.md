# 2026-02-15 - Notification panel button interactions and glow tuning

## Scope
Adjusted notification panel interaction reliability and button styling in the forum header notifications popover.

## Files changed
- `src/components/NotificationsMenu.js`
- `src/app/globals.css`

## What changed
1. Improved click reliability for notification rows and controls.
- Replaced clickable notification item wrapper from anchor-based structure to a keyboard-accessible div button pattern.
- Removed nested interactive element conflict (`button` inside clickable row) by using a non-anchor row wrapper.
- Kept delete button click isolated with `stopPropagation()` so delete does not trigger row navigation.
- Row navigation now uses `router.push(...)` after read-marking.

2. Unified panel action button visuals.
- Added shared `panelButtonStyle` and applied it to `Messages`, `Clear`, and `Close`.
- Updated `Close` button from unique neon gradient style to match the other panel buttons.

3. Reduced glow intensity in notifications panel controls and shell.
- Refresh button now uses a subtle bordered chip style with no heavy box-shadow glow.
- Reduced glow on "Mark read" and row hover styling.
- Lowered neon outline glow variables for `.notifications-popover-errl` and reduced `::after` glow opacity.

## Verification
- Targeted lint check: `npm run lint -- src/components/NotificationsMenu.js` (pass)
- Full lint check: `npm run lint` (pass)
- Manual code audit verified handlers exist for:
  - `Close` (`onClose?.()`)
  - `Clear` (`handleClearAll` -> `onClearAll`)
  - `Messages` (`router.push('/messages')` with close)
  - `Refresh` (`onRefresh?.()` with loading guard)

## Notes
- Worktree includes unrelated pre-existing modification in `src/components/HomeSectionCard.js`; left untouched.

## Coordination note
- This conversation thread is being used as a documentation/logging thread while implementation may also occur in parallel threads.
- Entries in this file should be treated as the source-of-record for work tracked from this thread.
