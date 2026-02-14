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

## Forum header/layout refactor log (same-day continuation)
- Header responsiveness + spacing:
  - Reworked small-viewport header balance for brand/nav/action controls so controls stay visible and aligned.
  - Tuned left/right inset behavior and compact spacing to reduce uneven edge padding on narrow devices.
  - Added tighter tiny-breakpoint behavior so overflow pressure is handled by size reduction first.

- Section page top area unification:
  - Removed breadcrumb usage on section landing pages and moved to a unified section-intro pattern (title + description + actions in one card).
  - Migrated section clients to shared intro structure so all section headers match visually and responsively.
  - Moved section action controls (`Show hidden`, `New ...`) into the same intro card instead of a separate row above.

- Section action button responsiveness:
  - Added mobile button scaling rules so actions shrink before layout breaks.
  - Allowed two-line wrap behavior only at the smallest breakpoint to keep medium widths clean and stable.
  - Prevented full-width button expansion where it caused inconsistent card height.

- Signed-in menus + account controls:
  - Notifications and three-dot menus were restructured for better mobile fit:
    - Sign out moved from notifications to the three-dot menu.
    - Notifications header row consolidated (title + refresh/actions in one line).
    - Username row aligned with avatar and linked to profile.
  - Three-dot menu labels were standardized to requested wording:
    - Account
    - Edit Profile
    - View Profile
    - Edit Avatar
    - Admin (conditional)
    - Sign out

- Library and small-screen navigation behavior:
  - Added Home to library list and constrained small-screen list length with scroll for the rest.
  - Preserved right alignment for guest `Home` + `Feed` header controls across viewport sizes.

- Post-page context row (breadcrumb replacement):
  - Reintroduced a compact context row for post pages to support edit controls without the old full breadcrumb strip.
  - Simplified context path to just `Section > Post` (last two trail items), with truncation on smaller widths.
  - Styled context row as a compact variant aligned with section-intro visual language.

- Modal layering + editing UX:
  - Fixed new-post modal stacking issue by rendering modal via portal to `document.body`.
  - Raised overlay z-index so modal and editor UI reliably sit above header and page content.
  - Kept body scroll lock while modal is open.

- Size/density reduction pass:
  - Reduced oversized type/padding in key shared styles:
    - Header brand title clamp lowered.
    - Section title/description sizing tightened.
    - Card padding reduced to trim unnecessary vertical growth.
  - Adjusted compact control sizing to prevent visual spikes between sections.

- Profile/account tab navigation fix:
  - Fixed profile subtab persistence behavior so navigating into Edit Avatar no longer traps users in that subtab.

- Easter egg viewport safety:
  - Updated header easter-egg overlay/control constraints to keep controls visible and non-overflowing on small devices.

- Verification:
  - Lint was run repeatedly during this sequence after major batches and passed each time (`npm run lint`).
