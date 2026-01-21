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

