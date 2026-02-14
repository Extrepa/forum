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

## Header + Signup follow-up (current pass)
- Signed-out header controls changed from avatar-right to compact `Home` + `Feed` pills on the right.
- Added guest header easter-egg flow:
  - Double-click `Feed` to arm.
  - Drag `Feed` onto the mascot/title area to launch header easter-egg overlay.
- Added/updated guest easter-egg styles for armed, drag-hidden, and close-button states.
- Prevented title/nav overlap by constraining header brand/title overflow and enabling ellipsis where needed.
- Notifications panel simplification:
  - Removed redundant profile action pills from notifications card.
  - Kept focused notifications list with lightweight `Open messages` action.
- Signup copy and density polish:
  - Removed explicit `(optional)` wording from first/last name labels.
  - Kept privacy line: name is not shown on public profile.
  - Kept compact two-column rows for name and password fields.
- Rotating placeholder glitch fix:
  - Disabled native input placeholders where animated overlay is used.
  - Increased animated overlay opacity to avoid faint duplicate/stacked text effect.
- Responsive refinement pass:
  - Guest `Home`/`Feed` pills now include icons and collapse cleanly to icon-only at mobile width.
  - Header center/nav now hard-constrained (`min-width: 0`, overflow guard) to avoid title collision.
  - Search now shrinks earlier (intermediate squeeze range) and collapses to icon sooner (`<=1360px`).
- Tiny-viewport popover hardening:
  - Notifications popover mobile max-height is now computed from trigger `top` + viewport height, so it stays on-screen and scrollable on short devices.
