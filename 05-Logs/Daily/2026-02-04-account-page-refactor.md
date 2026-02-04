# 2026-02-04 Account Page Refactor

## Summary
- Refactored the "Account" tab in `/account` to use a new summary-first layout.
- Created `src/app/account/AccountSettings.js` which implements the new design:
    - **Account Summary**: Card with read-only info and edit actions (Contact, Password) that open in sheets. Removed redundant edit buttons and "active on device" text.
    - **Notifications**: Card with summary stats and a single "Edit" action that opens a comprehensive preference sheet. Admin alerts are integrated into the main editor if the user is an admin.
    - **Site & UI**: Compact card with settings for Landing Page, Lore Mode, Color Theme, etc. Descriptions are inline with the header.
    - **Danger Zone**: Minimal card containing only the "Sign out" button.
- Added a batch of polish after feedback: the edit sheets now behave like centered modals, the edit buttons share the notification-panel gradients, and the Site & UI dropdowns/checkboxes simply use native browser controls with their own confirmation banner beneath the card.
- Updated `src/app/account/AccountTabsClient.js` to use `AccountSettings` for logged-in users, replacing the monolithic `ClaimUsernameForm` usage in that context. Removed header description text.
- Preserved existing functionality (API endpoints, persistence) while improving the UX to be cleaner and more mobile-friendly.
- **Fixes**:
    - `EditSheet`: Added `flex: 1` and `min-height: 0` to the content container to ensure proper internal scrolling. Reduced desktop `max-height` to `80vh` to prevent cutoff. Restyled the close button to a circular icon.

## Implementation Details
- `AccountSettings.js`:
    - Uses `EditSheet` component (custom implementation similar to `CreatePostModal` but bottom-anchored on mobile).
    - `SettingsCard` and `Row` components for consistent layout.
    - Ported logic from `ClaimUsernameForm.js` for saving email/phone, password, notifications, and UI prefs.
    - Added validation logic for notifications (e.g. "Email must be enabled to receive site alerts").
    - Responsive layout: Stacks on mobile, 2-column grid on desktop (>= 1024px).

## Verification
- Linter checks passed.
- Logic follows the user's detailed spec and subsequent refinements.
