## 2026-01-20 (Cursor)

- Goal: migrate from browser-only username claims to email/password accounts while preserving existing D1 content ownership.
- Added `migrations/0006_accounts.sql` to extend `users` with email + password fields and a nullable-unique email index.
- Added WebCrypto PBKDF2 password hashing in `src/lib/passwords.js`.
- Added auth API routes under `src/app/api/auth/` for signup/login/me/logout/change-password/set-email.
- Updated homepage/claim UI to account signup/login and added a must-change-password posting guard in content POST routes.
- Added admin bootstrap route `src/app/api/admin/bootstrap-accounts/route.js` to set temp passwords for extrepa/geofryd/ashley and make extrepa admin.

## Review notes (double-check)

- **Security**: `POST /api/claim` is now deprecated (410) so the old “claim without password” path can’t be used to create users outside the new account system.
- **Compatibility**: existing sessions still work because `users.id` is unchanged and content tables still reference `author_user_id`.
- **Operational dependency**: auth routes require running D1 migration `0006_accounts.sql` before use (new columns/index).
- **Linting**: `npm run lint` is currently interactive (Next 15 deprecates `next lint` and prompts to set up ESLint). We didn’t change lint tooling; code was checked via `ReadLints` and repo builds should be validated via your preferred workflow.

## Notifications (next feature)

- Added in-app notification scaffolding (D1 migration + API + header UI) for forum replies.
- Scope: notify thread author + all reply participants (excluding the replier).
- Email/SMS: preference toggles are stored, but no external sending is implemented yet.

## Legacy session upgrade (account setup)

- If a user is logged in from the old browser-only era (no `password_hash`), the UI now prompts them to set email + password to finish account setup.
- Posting endpoints now require a password to be set (legacy sessions can still browse, but must set a password to post).

## UX polish (header banner + logo notifications)

- Added a **header-level Account button + popover** so settings are reachable even when already logged in.
- Added a **global header banner** when account setup is incomplete (missing email/password or must-change-password).
- Moved notifications trigger onto the **Errl face** (badge count + click opens the notifications dropdown); removed standalone notifications button from the header nav row.
- Moved the **Account** button next to **Search** (left of it), keeping the setup banner full-width beneath the nav row.
- Adjusted header layout so **Account stays immediately beside Search** (grouped right-side controls; avoids SearchBar `margin-left:auto` separating them).
- Deploy note: OpenNext `build:cf` can fail with `ENOTEMPTY` on `.open-next`; removing the folder and re-running deploy resolves it.
- Account popover UX: reordered account setup so **email + password** come first; notification prefs are shown only after setup. Added **phone number storage** and a `set-phone` API endpoint to support future SMS notifications.
- Outbound notifications: added optional **Resend (email)** + **Twilio (SMS)** delivery for forum reply notifications when provider secrets are configured (best-effort; won’t block posting if sending fails).
- Account setup hardening: disallow passwords containing spaces (server + client), lock email behind an explicit “Change email” action, disable SMS toggle until a phone number is provided, and make account/notifications popovers scroll within the viewport.

## Ready-to-test checklist (2026-01-21)

- Repo clean and pushed: `origin/main` at commit `6090187`.
- Cloudflare worker deployed: `https://errl-portal-forum.extrepatho.workers.dev` returns `{"online":true}` on `/api/status`.
- D1 migrations: `0006_accounts.sql` and `0007_notifications.sql` applied on remote (no pending migrations).
- Auth upgrade flow:
  - Logged-in legacy session with no password shows `hasPassword: false` via `/api/auth/me`
  - Change-password endpoint allows setting first password while logged in
  - Posting endpoints block until a password exists (`must_change_password || !password_hash`)
- Notifications: `/api/notifications` returns list + unread count (requires login); reply posting writes notification rows.

