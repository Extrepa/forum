# Plan to Move Forward: User Flows, Signup & UI Refinement

This plan integrates recent work by Codex (Signup form enhancements, Errl message removal) with the broader goals of refining user journeys for New, Returning, and Long-Time members.

## 1. Current State Assessment

*   **Signup Flow:** Significant progress made. `ClaimUsernameForm.js` now includes:
    *   Real-time username availability checks (`/api/auth/username-availability`).
    *   Password confirmation field.
    *   Improved field-level error handling.
*   **Home Page:** Currently, guests see *only* the `ClaimUsernameForm`. Logged-in users see a dashboard of sections.
*   **Feed:** Restricted to logged-in users (redirects to home).
*   **Cleanup:** Legacy "Errl Greetings" have been removed.

## 2. Immediate Action Items

### A. Refine Guest Experience (Priority)
**Goal:** Give new visitors immediate value, not just a login wall.
*   [ ] **Update `src/app/page.js`:**
    *   Instead of *only* showing `ClaimUsernameForm` for guests, allow a "Preview" mode.
    *   Render a simplified, read-only version of the "Explore Sections" or a "Trending" list below the signup form.
    *   Ensure the signup form remains the primary CTA but doesn't block exploration entirely.

### B. Verify & Polish Signup
**Goal:** Ensure the new Codex changes are bug-free and smooth.
*   [ ] **Backend Check:** Verify `src/app/api/auth/username-availability/route.js` exists and handles edge cases (rate limiting, reserved names).
*   [ ] **Form Styling:** Ensure the new "Confirm Password" and error messages match the site's design system (spacing, colors).
*   [ ] **Mobile Responsiveness:** Test the taller form on mobile screens.

### C. Differentiate "Returning" vs. "Long-Time" Users
**Goal:** personalize the dashboard based on user maturity.
*   [ ] **Update `src/app/page.js` (Logged In):**
    *   **Returning (Newer):** Keep the "Explore Sections" grid as the focus to encourage discovery.
    *   **Long-Time:** Consider adding a "Quick Jump" row for their most frequently visited sections (e.g., if they only check `Music` and `Projects`).
    *   **Greeting:** Re-introduce a subtle, non-intrusive greeting (e.g., "Good to see you, [User]") in the `HomeSectionCard` area or header, distinct from the removed "Errl Message" card.

### D. Notification Refinement
**Goal:** Make notifications manageable for power users.
*   [ ] **Review `NotificationsMenu.js`:**
    *   Ensure the "Mark all as read" and "Clear" actions are performant.
    *   (Future) Plan for grouping similar notifications (e.g., "5 people liked your post").

## 3. Testing Plan

Run these specific scenarios to verify the flows:

1.  **The "New User" Test:**
    *   Visit homepage in Incognito.
    *   Verify you see the Signup Form AND some preview content (once implemented).
    *   Try to sign up with an existing username (verify real-time error).
    *   Try to sign up with mismatched passwords.
    *   Complete a valid signup -> Verify redirect to Feed/Home.

2.  **The "Returning User" Test:**
    *   Log in.
    *   Verify the "Explore Sections" grid loads correctly with the new simplified layout.
    *   Check for the "Welcome back" indicator.

3.  **The "Notification" Test:**
    *   Trigger a notification (e.g., reply to a thread from another test account).
    *   Verify the badge updates immediately.
    *   Click the notification -> Verify deep link works.

## 4. Documentation
*   [ ] Update `05-Logs/DevPost-Draft-9.md` with final implementation details once Guest Mode is live.
*   [ ] Log all changes in `05-Logs/Daily/`.
