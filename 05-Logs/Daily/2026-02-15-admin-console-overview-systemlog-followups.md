# 2026-02-15 - Admin Console Overview/System Log Follow-ups + Action Menu Reachability

## Request
- Rearrange Admin `Overview` lower layout so the two text sections are in one scrollable column and `System log` gets more space.
- Remove duplicated system-log text behavior on `Overview`.
- Improve `System Log` tab readability and add graph labels for active bars on large viewports.
- Remove practical log limit behavior by archiving older logs to downloadable files.
- Add Markdown export from the console.
- Add filtering in system logs by user and by action type.
- Add visible confirmation feedback when admin actions are performed.
- Ensure action menus near the bottom of Posts/Users tables remain fully visible and increase menu size for easier interaction.

## Solution Implemented
- Rebuilt `Overview` lower region into a 2-column layout:
  - Left: single scrollable feed column with `Recent admin actions` and `Latest threads`.
  - Right: widened `System log` panel.
- Added system log de-duplication pass (same `createdAt + source + message` key).
- Added richer log metadata (`actor`, `actionType`) and display metadata in log lines.
- Added system log filtering controls:
  - `User`
  - `Action type`
- Added Markdown export actions:
  - quick export in `Overview`
  - filtered/full export in `System Log`
- Added automatic log archive rollover:
  - live buffer capped for render performance
  - overflow entries moved into archived `.md` files
  - archive download links rendered in `System Log` tab
- Added global admin notice confirmations for actions (success/error), including posts/users/settings/broadcast actions.
- Switched image-upload setting toggle to explicit async save with immediate UI confirmation.
- Improved network traffic chart for large screens by showing active metric names at bottom of bar columns.
- Fixed action-menu clipping on low rows by updating direction logic:
  - now checks available space against viewport + table-wrapper + panel boundaries.
- Increased action-menu usability:
  - larger trigger button
  - wider menu panel
  - larger action hit targets
  - higher z-index
  - visible vertical overflow in table wrapper
- Removed DB row caps for admin action/click history loading:
  - `getRecentAdminActions(db)` now supports no-limit query path.
  - `loadRecentClickEvents(db)` now supports no-limit query path.

## Files Updated
- `src/components/AdminConsole.js`
  - Overview layout restructuring
  - system-log metadata + dedupe + filtering + export + archive rollover
  - global confirmation notice flow
  - settings toggle save flow
  - action menu up-direction boundary logic improvements

- `src/app/globals.css`
  - Overview 2-column + scrollable feed styles
  - system log controls/metadata/archive styles
  - large-viewport bar labels
  - action-menu sizing and accessibility improvements
  - table wrapper overflow visibility for dropdown reachability

- `src/app/admin/page.js`
  - removed fixed row cap for admin actions fetch
  - removed fixed row cap for click events fetch

- `src/lib/audit.js`
  - `getRecentAdminActions` now supports optional no-limit query

## Double-Check / Verification
- `npm run lint` -> pass
- `npm run build` -> pass
- Re-ran `npm run build` after CSS compatibility cleanup (`align-items: flex-end`) -> pass, no autoprefixer warning in this area.

## Notes
- This log documents only the Admin Console follow-up scope in this pass.
- The working tree also contains unrelated pre-existing changes outside this scope.
