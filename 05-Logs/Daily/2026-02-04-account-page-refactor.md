# 2026-02-04 Account Page Refactor

## Summary
- Refactored the "Account" tab in `/account` to use a new summary-first layout.
- Created `src/app/account/AccountSettings.js` which implements the new design:
    - **Account Summary**: Card with read-only info and edit actions (Contact, Password) that open in sheets.
    - **Notifications**: Card with summary stats and an "Edit" action that opens a comprehensive preference sheet with validation logic (email required for site notifs, phone required for SMS).
    - **Site & UI**: Compact card with settings for Landing Page, Lore Mode, Color Theme, etc.
    - **Danger Zone**: Separate card for Sign Out.
- Updated `src/app/account/AccountTabsClient.js` to use `AccountSettings` for logged-in users, replacing the monolithic `ClaimUsernameForm` usage in that context.
- Preserved existing functionality (API endpoints, persistence) while improving the UX to be cleaner and more mobile-friendly.

## Implementation Details
- `AccountSettings.js`:
    - Uses `EditSheet` component (custom implementation similar to `CreatePostModal` but bottom-anchored on mobile).
    - `SettingsCard` and `Row` components for consistent layout.
    - Ported logic from `ClaimUsernameForm.js` for saving email/phone, password, notifications, and UI prefs.
    - Added validation logic for notifications (e.g. "Email must be enabled to receive site alerts").
    - Responsive layout: Stacks on mobile, 2-column grid on desktop (>= 1024px).

## Verification
- Linter checks passed.
- Logic follows the user's detailed spec.
