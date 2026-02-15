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

## Additional Follow-up (System Log Controls In-Card)
- Moved system-log filtering and export controls inside the `system.log` card so controls no longer consume separate space outside the log card.
- Applied this pattern to both:
  - `Overview` system log panel
  - `System Log` tab log panel
- Added in-card clear actions:
  - `Clear visible` (filtered set)
  - `Clear all loaded` (System Log tab)
- Moved archive download list inside the same system-log card/container.
- Updated system-log control styling for in-card layout and responsive stacking.

### Files
- `src/components/AdminConsole.js`
- `src/app/globals.css`

### Verification
- `npm run lint` -> pass

## Additional Follow-up (Overview List-Level Scrolling)
- Updated Overview left column so the column itself does not scroll.
- Added per-panel scroll regions for:
  - `Recent admin actions`
  - `Latest threads`
- Removed short slicing on `Latest threads` so it can grow and rely on its own internal scroll area.

### Files
- `src/components/AdminConsole.js`
- `src/app/globals.css`

### Verification
- `npm run lint` -> pass

## Additional Follow-up (Settings Tab Rearrangement)
- Reworked Settings tab layout to reduce empty space and oversized full-width controls.
- Converted settings controls into compact side-action rows:
  - `Image uploads` row with right-aligned compact action button
  - `Navigation tip broadcast` row with right-aligned compact action button
- Replaced modal-first broadcast flow with inline expandable composer section in Settings:
  - `Compose` / `Collapse` toggle
  - inline message textarea + character count
  - inline send/cancel actions
- Removed `More moderation tools` button from Settings tab.
- Added direct Mission Control header action for moderation toolkit (`/admin/moderation`) so moderation access remains one click from the top card area.

### Files
- `src/components/AdminConsole.js`
- `src/app/globals.css`

### Verification
- `npm run lint` -> pass

## Additional Follow-up (Network Activity vs Operational Totals)
- Split previous mixed `Network traffic` block into two clearer sections:
  - `Network activity` chart + legend now includes only windowed activity metrics:
    - Active (24h), Posts (24h), Comments (24h), Active (7d), Posts (7d), Comments (7d)
  - `Operational totals` now displays non-traffic/state totals in a separate compact grid:
    - Hidden posts, Locked posts, Pinned posts, Flagged, Open reports, Audit rows
- Updated chart column rendering to dynamically match series length (6 bars) instead of fixed 12 columns.

### Files
- `src/components/AdminConsole.js`
- `src/app/globals.css`

### Verification
- `npm run lint` -> pass

## Final Recheck (Complete)

### Date
- 2026-02-15

### Verification Commands
- `npm run lint` -> pass
- `npm run build` -> pass

### Final Audit Checklist
- Overview layout and scrolling:
  - Left overview column is static.
  - `Recent admin actions` and `Latest threads` each scroll independently.
- System log controls and actions:
  - Filters, export actions, and clear actions are inside `system.log` card(s).
  - Overview and System Log tab both use in-card controls.
  - Archive download links render inside the same system-log card.
- Log retention/export:
  - Live buffer + archive rollover behavior active.
  - Markdown export available for filtered/full.
  - DB-side load paths support no-limit fetch for `admin_actions` and `click_events`.
- Action menu usability:
  - Bottom-row menus choose upward opening when boundary space is insufficient.
  - Menu trigger and list hit targets are enlarged.
- Settings UI:
  - Compact row layout with side action buttons.
  - Inline expandable broadcast composer (no separate modal flow).
  - Removed Settings-tab moderation link.
  - Added Mission Control header moderation action button.
- Activity visualization:
  - Activity chart now only includes time-window metrics.
  - Non-traffic totals moved to separate `Operational totals` grid.

### Notes
- Existing unrelated modified files in the working tree were left untouched.
