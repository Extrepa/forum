# 2026-02-15 Notification Audit + Broadcast Tools

## Objective
- Verify notification behavior after moving access from the old logo-trigger flow to the right-side header Messages icon.
- Confirm admin and regular notification paths are still active (including event-related admin alerts).
- Add admin tooling for one-time migration guidance and reusable custom broadcasts.
- Record all implementation and validation notes.

## Header / Entry-Point Verification
- Verified the active notifications entry point is the right-side Messages icon in header:
  - `src/components/SiteHeader.js` (message icon trigger + unread badge + `NotificationsMenu` wiring).
- Confirmed unread badge is attached to the header icon (`header-icon-badge`) and reflects `/api/notifications` unread count.
- Confirmed legacy components still exist but are not currently mounted:
  - `src/components/NotificationsLogoTrigger.js`
  - `src/components/NotificationsBell.js`

## Notification Reliability Fixes
### 1) Admin "new post" coverage across sections
- Added shared helper:
  - `src/lib/adminNotifications.js` (`notifyAdminsOfNewPost`).
- Wired helper into creation routes so admins who enabled `notify_admin_new_post_enabled` receive alerts for non-admin posts:
  - `src/app/api/events/route.js`
  - `src/app/api/posts/route.js`
  - `src/app/api/projects/route.js`
  - `src/app/api/music/posts/route.js`
  - `src/app/api/shitposts/route.js`
  - `src/app/api/threads/route.js` (refactored from inline logic).

### 2) Notification panel rendering for admin post alerts
- Extended `admin_post` rendering in:
  - `src/components/NotificationsMenu.js`
- Result: admin post notifications now display labels/links for multiple target types (not only forum threads).

### 3) SQL alias bug fixes in notification recipient queries
- Fixed queries that selected `u.*` without aliasing `users` as `u`, which could fail silently in try/catch notification blocks.
- Updated routes:
  - `src/app/api/events/[id]/comments/route.js`
  - `src/app/api/timeline/[id]/comments/route.js`
  - `src/app/api/projects/[id]/comments/route.js`
  - `src/app/api/projects/[id]/replies/route.js`
  - `src/app/api/devlog/[id]/comments/route.js`
  - `src/app/api/music/comments/route.js`
  - `src/app/api/posts/[id]/comments/route.js`

### 4) Account settings wording
- Updated admin setting label in:
  - `src/app/account/AccountSettings.js`
- Label changed from "New forum threads" to "New section posts" for clearer scope.

## Migration Guidance Notification (One-Time)
### For new users
- Signup now inserts a navigation tip in-app notification:
  - `type = navigation_tip`, `target_type = system`, `target_id = header_messages_and_kebab_v1`.
- Implemented in:
  - `src/app/api/auth/signup/route.js`

### For existing users
- Enhanced admin endpoint to send one-time deduped navigation tips:
  - `POST /api/admin/test-notification` with default/`kind: navigation_tip`.
- Keeps old `kind: test` behavior.
- Implemented in:
  - `src/app/api/admin/test-notification/route.js`

### Notification display text
- Added rendering for `navigation_tip` in:
  - `src/components/NotificationsMenu.js`

## New Admin Broadcast Tool (Custom Message Anytime)
### API
- Added endpoint:
  - `POST /api/admin/notifications/broadcast`
  - file: `src/app/api/admin/notifications/broadcast/route.js`
- Behavior:
  - admin-only
  - requires `message`
  - max 280 chars
  - inserts `type = broadcast`, `target_type = system`, `target_id = <message>` for all active users (fallback to all users if `is_deleted` column unavailable).

### Admin UI (pop-out composer)
- Added controls in Admin Settings:
  - "Send navigation tip to all users"
  - "Compose broadcast notification"
- Added centered pop-out composer with textarea, char count, send/cancel, and inline status.
- Implemented in:
  - `src/components/AdminConsole.js`

### Notification panel support
- Added display mapping for `broadcast` notifications in:
  - `src/components/NotificationsMenu.js`

## Commands / Validation Run
- `npm run lint` (pass)
- `npm run build` (pass)
- `npm run test -- --run` (cannot run: no `test` script in `package.json`)
- Additional static checks (`rg`) for:
  - notification trigger usage
  - alias-corrected SQL paths
  - admin broadcast/navigation-tip wiring

## Recheck Findings
- Messages icon + badge path is in place and active.
- Admin new-post notifications now include events and other major sections.
- Notification SQL alias errors in affected comment/reply routes are corrected.
- One-time navigation guidance flow now exists for both:
  - current users (admin-triggered deduped send)
  - new users (auto-insert on signup)
- Admin now has reusable custom broadcast tooling via pop-out composer.

## Follow-up Suggestions
- Optional cleanup: remove or archive unused legacy notification trigger components if no longer needed:
  - `src/components/NotificationsLogoTrigger.js`
  - `src/components/NotificationsBell.js`
- Optional schema follow-up: store broadcast message body in a dedicated column/table rather than `target_id` if longer-term system notices are planned.
