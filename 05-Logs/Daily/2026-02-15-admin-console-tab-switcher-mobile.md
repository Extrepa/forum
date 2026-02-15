# 2026-02-15 - Admin Console Mobile Tab Switcher Conversion

## Request
- Replace the Admin Console mobile tab strip with the same switcher pattern used for Edit Profile.
- Reuse the shared tab-switcher component (`ErrlTabSwitcher`) and apply the neon color treatment.
- Keep existing Admin tab behavior unchanged while improving mobile readability/usability.

## Solution Implemented
- Replaced the old custom Admin tab button strip with `ErrlTabSwitcher`.
- Mapped existing admin tab labels to switcher tabs with stable `{ id, label }` objects.
- Added an Admin-specific tab color sequence for the active indicator and tab color styling.
- Preserved existing tab state and content gating (`activeTab === 'Overview'`, etc.) so behavior is unchanged.

## Files Updated
- `src/components/AdminConsole.js`
  - Added `ErrlTabSwitcher` import.
  - Added `ADMIN_TABS` derived from existing `TAB_LIST`.
  - Added `ADMIN_TAB_COLOR_SEQUENCE` for neon tab colors.
  - Replaced `<div className="admin-tabs">...` button strip with `<ErrlTabSwitcher ... />`.
  - Kept `activeTab` + `setActiveTab` flow intact.

- `src/app/globals.css`
  - Removed old `.admin-tabs` container rules used by the previous button strip.
  - Added `.admin-tabs-switcher` spacing rule and tighter `.tabs-pill-inner` horizontal padding for admin usage.
  - Adjusted `.admin-tab` density (`min-height`, padding, line-height, letter-spacing) for better mobile fit.
  - Kept `.admin-tab--active` as weight emphasis, relying on switcher indicator for active framing.

## Double-Check / Verification
- Lint check (targeted):
  - `npx eslint src/components/AdminConsole.js` -> pass

- Production build:
  - `npm run build` -> pass
  - Next.js build completed successfully, including lint/type checks and static page generation.

- Code-level validation:
  - Admin tabs now render through `ErrlTabSwitcher` and still call `setActiveTab`.
  - Existing tab names and route query-tab normalization (`TAB_LOOKUP`) remain unchanged.
  - No content panel conditions were modified.

## Notes
- The repository has other pre-existing uncommitted changes in multiple files. This log documents only the Admin tab-switcher conversion and its related CSS adjustments.
