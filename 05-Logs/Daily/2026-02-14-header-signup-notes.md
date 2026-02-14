# 2026-02-14 Header + Signup Notes

## Signup (Phase 1.1 execution)
- Added confirm-password field and validation in signup form.
- Added debounced username availability checks (`/api/auth/username-availability`) with inline status text.
- Added field-level error handling for signup inputs (instead of only global status).
- Updated requirements:
  - Email is required for signup.
  - Phone is optional.
  - First/last name are optional.
- Added inline disclaimer: name is optional and not shown publicly on profile.
- Compacted layout for signup:
  - First + Last name share one responsive row.
  - Password + Confirm password share one responsive row.
- Clarified notification copy:
  - Email is for account identity.
  - Notification toggles control off-site alert delivery.

## Signup/API verification
- Fixed build path issue for new username availability route imports.
- Ran `npm run build` successfully.
- Performed live signup API smoke test against local started app:
  - Successful `POST /api/auth/signup` with optional name and optional phone.
  - Response returned `200 OK` with `{ ok: true, username, email }`.

## Header direction notes (requested)
- Keep header single-row behavior; avoid text being covered by controls.
- On smaller viewports:
  - Errl Forum title should wrap to two lines if needed.
  - Search should collapse earlier than other controls (search is lowest-priority filler).
  - Keep compact nav affordances (`Home`, `Feed`, `Library`) usable.
- Signed-out header should be minimal:
  - Brand/avatar-first presentation.
  - Minimal controls (only essentials) to reduce clutter.
- Signed-in header can reveal richer controls and easter-egg affordances.
- Avatar-click flow should prioritize one-click access to profile + notifications/messages.
- Three-dot menu remains the account/admin/settings bucket.

## Next implementation slice
1. Signed-out header variant in `SiteHeader`:
   - Hide member-only controls and keep minimal top bar.
2. Breakpoint tuning:
   - Force search collapse before title collision.
   - Preserve title readability and non-overlap at narrow widths.
3. Continue menu consolidation:
   - Keep notifications/actions cohesive in a single card.

## Header implementation update (continue)
- Implemented `site-header--guest` mode in `SiteHeader`:
  - Signed-out users now get a minimal header (brand + avatar/login action only).
  - Center nav/search section is hidden when signed out.
  - Notifications menu and member-only controls render only when signed in.
- Avatar behavior split by auth state:
  - Signed-in: opens notifications/profile card.
  - Signed-out: routes to `/` for sign-in/signup.
- Responsive priority preserved:
  - Search still collapses early for signed-in mode.
  - Guest mode stays minimal to avoid text/control overlap.
- CSS compatibility cleanup:
  - Replaced `align-items: end` with `align-items: flex-end` in admin chart styles to remove autoprefixer warning.
