# Cursor Notes - 2026-02-15

## Objective
- Double-check the Cloudflare production deployment state after multiple Worker services appeared in the dashboard.
- Confirm which Worker owns `forum.errl.wtf`.
- Record a full audit trail of config changes, deploy actions, and verification outputs.

## What Was Changed During This Session
- Updated `src/lib/audit.js`:
  - Removed Node import `import crypto from 'crypto'`.
  - Switched to `globalThis.crypto.randomUUID()`.
- Updated `package.json`:
  - `deploy` script changed from `wrangler deploy` to `wrangler deploy --env=""`.
  - Wrangler version bumped from `^4.61.1` to `^4.65.0`.
- Updated `package-lock.json` via `npm install --save-dev wrangler@4.65.0`.
- Updated `wrangler.toml` in stages:
  - Added top-level compatibility flags:
    - `nodejs_compat`
    - `global_fetch_strictly_public`
  - Added/confirmed custom domain route:
    - `forum.errl.wtf` with `custom_domain = true`.
  - Finalized canonical production service name:
    - `name = "errl-portal-forum"` (not `errl-portal-forum-docs`).
  - Added explicit production settings:
    - `workers_dev = false`
    - `preview_urls = false`
  - Added explicit R2 binding:
    - `UPLOADS -> errl-forum-uploads`.
  - Kept preview env explicit:
    - `workers_dev = true`
    - `preview_urls = true`.

## Production Deploy Events (Chronological)
1. Deployed `errl-portal-forum-docs` (production env) with custom domain route.
2. Confirmed route reassignment prompt from `errl-portal-forum` to `errl-portal-forum-docs` and accepted.
3. After dashboard review, corrected config back to canonical service `errl-portal-forum`.
4. Deployed `errl-portal-forum` again and accepted reassignment prompt from `errl-portal-forum-docs` back to `errl-portal-forum`.
5. Final production deployment version on canonical worker:
   - `ecf018c1-240b-4495-9104-92ec4d7be361`.

## Verification Commands Run
- Local build and bundle:
  - `npm run build:cf` (pass).
- Wrangler dry-run (prod env):
  - `HOME=/Users/extrepa/Projects/errl-portal-forum-docs WRANGLER_HOME=/Users/extrepa/Projects/errl-portal-forum-docs/.wrangler npx wrangler deploy --dry-run --env=""` (pass).
- Cloudflare deployment history:
  - `npx wrangler deployments list --name errl-portal-forum --json`
  - `npx wrangler deployments list --name errl-portal-forum-docs --json`
- Cloudflare version metadata:
  - `npx wrangler versions view ecf018c1-240b-4495-9104-92ec4d7be361 --name errl-portal-forum --json`
  - `npx wrangler versions view f9ab8501-35e9-4338-9dcd-ef59e075c4b0 --name errl-portal-forum-docs --json`

## Final Verified State
- Canonical production Worker: `errl-portal-forum`.
- Custom domain route: `forum.errl.wtf` is attached to `errl-portal-forum`.
- `errl-portal-forum` latest deployed version:
  - `ecf018c1-240b-4495-9104-92ec4d7be361` (created `2026-02-15T03:04:55Z`).
- Runtime flags on canonical worker include:
  - `nodejs_compat`
  - `global_fetch_strictly_public`.
- Bindings on canonical worker include:
  - `DB` (D1)
  - `UPLOADS` (R2)
  - `ASSETS`
  - existing secrets (`RESEND_API_KEY`, `TWILIO_*`, etc.)
  - `IMAGE_UPLOAD_ALLOWLIST` as plain text variable (`"*"`).

## Important Notes / Risks
- During deploy, Wrangler warned that `IMAGE_UPLOAD_ALLOWLIST` env var conflicts with an existing remote secret and would replace it.
- Result: `IMAGE_UPLOAD_ALLOWLIST` is now plain text var on production worker instead of secret.
  - Current value observed in metadata: `"*"`.
- Multiple Worker services still exist in account:
  - `errl-portal-forum` (canonical prod)
  - `errl-portal-forum-docs` (orphaned/secondary service)
  - preview services also exist.
- `deploy.sh --production` auto-committed npm metadata files in prior run:
  - `.npm/_logs/2026-02-15T02_56_32_392Z-debug-0.log`
  - `.npm/_update-notifier-last-checked`

## Suggested Cleanup Follow-ups
- Decide whether to keep or delete `errl-portal-forum-docs` service in Cloudflare.
- Add `.npm/` patterns to `.gitignore` to avoid committing local npm artifacts.
- If desired, convert `IMAGE_UPLOAD_ALLOWLIST` back to a Wrangler secret workflow (or keep as plain var if intentional).

## Current Local Workspace Status
- Modified:
  - `wrangler.toml`
- Untracked local npm debug logs under `.npm/_logs/` from command runs.

## UI Fix: Delete Confirmation Modal Stacking Context
- Reported issue:
  - Delete confirmation modal appeared inline near the post action area instead of overlaying the full viewport.
- Root cause:
  - `DeleteConfirmModal` was rendered inside transformed/stacked UI regions (e.g. post action popover). In that context, `position: fixed` did not escape to viewport reliably due local stacking context behavior.
- Fix applied:
  - Updated `src/components/DeleteConfirmModal.js` to render through `createPortal(..., document.body)`.
  - Added client mount guard before portal render.
  - Increased overlay z-index to `12000` to sit above existing header/panel layers.
- Verification:
  - `npm run lint` passed after the modal patch.

## Follow-up Fix: Modal Size + Event Delete API
- Issue reported after portal fix:
  - Delete confirmation modal rendered too tall.
  - Confirm delete did not remove event posts.
- Root causes:
  - `.card` global style enforces `height: 100%`, which made modal content inherit oversized height.
  - `POST /api/events/[id]/delete` attempted `UPDATE events ... updated_at = ?`, but some deployed schemas do not include `events.updated_at`, causing 409 `notready`.
- Fixes applied:
  - `src/components/DeleteConfirmModal.js`
    - Forced modal panel sizing to content:
      - `height: auto`
      - `minHeight: 0`
      - `maxHeight: min(85vh, 420px)`
      - `overflow: auto`
  - `src/app/api/events/[id]/delete/route.js`
    - Kept primary update with `updated_at`.
    - Added fallback update that sets only `is_deleted = 1` if `updated_at` column is unavailable.
- Verification:
  - `npm run lint` passed.

## Follow-up Fix: Admin Console Delete Failures
- Issue reported:
  - Admin Console still reported "Delete failed".
- Additional root causes found:
  - `music_posts` delete route also attempted `updated_at` on schemas where that column may not exist.
  - `forum` delete route referenced `params.id` directly instead of awaiting Next.js 15 `params`.
  - Admin generic delete endpoint (`/api/admin/posts/[id]` DELETE) required `edited_at` and `updated_by_user_id`, which may not exist on older schemas.
- Fixes applied:
  - `src/app/api/music/[id]/delete/route.js`
    - Added fallback update to `is_deleted = 1` if `updated_at` update fails.
  - `src/app/api/forum/[id]/delete/route.js`
    - Updated to `const { id } = await params;` and used resolved `id` everywhere.
  - `src/app/api/admin/posts/[id]/route.js`
    - Added fallback delete update with `is_deleted = 1` when audit columns are unavailable.
- Verification:
  - `npm run lint` passed.

## Feature: Global Click Tracking Into Admin System Log
- Request:
  - Track click activity around the forum and surface it in Admin Console `System Log`.
- Implementation added:
  - New migration:
    - `migrations/0064_add_click_events.sql`
    - Creates `click_events` table + indexes.
  - New telemetry API:
    - `src/app/api/telemetry/click/route.js`
    - Accepts click payloads and stores them in D1.
    - Gracefully no-ops on malformed payloads/failures.
  - New global client tracker:
    - `src/components/ClickTracker.js`
    - Captures click events on interactive elements (`a`, `button`, `summary`, role button, submit/button inputs).
    - Sends telemetry using `navigator.sendBeacon` with `fetch(..., keepalive)` fallback.
  - Layout integration:
    - `src/app/layout.js` now mounts `<ClickTracker />` globally so tracking runs across forum pages.
  - Admin ingestion:
    - `src/app/admin/page.js` now loads recent `click_events`.
    - `src/components/AdminConsole.js` now merges click events into `System Log` entries.
- Commands run:
  - `npm run lint` (pass)
  - `npx wrangler d1 migrations apply errl_forum_db --remote` (applied `0064_add_click_events.sql`)
  - `npx wrangler deploy --env=""` (production deploy)
- Live deployment:
  - Worker: `errl-portal-forum`
  - Version: `fc33e087-de9c-4f35-8fb7-a0c8c2f17239`
  - Route: `forum.errl.wtf`

## UI Follow-up: Admin Mobile Tab Switcher Cleanup
- Request:
  - Replace the long stacked Admin tab strip on mobile with the shared tab switcher used in Edit Profile.
- Changes applied:
  - `src/components/AdminConsole.js`
    - Swapped old `admin-tabs` button strip for `ErrlTabSwitcher`.
    - Added `ADMIN_TABS` mapping and `ADMIN_TAB_COLOR_SEQUENCE` for neon indicator colors.
    - Preserved existing `activeTab` state flow and all tab panel conditions.
  - `src/app/globals.css`
    - Added `.admin-tabs-switcher` and tighter admin switcher inner padding.
    - Tuned `.admin-tab` sizing/spacing for mobile density.
    - Simplified `.admin-tab--active` to weight emphasis (switcher indicator now handles visual active frame).
- Verification:
  - `npx eslint src/components/AdminConsole.js` (pass)
  - `npm run build` (pass)
- Detailed log:
  - `05-Logs/Daily/2026-02-15-admin-console-tab-switcher-mobile.md`

## UI Follow-up: Library + Notification Popover Positioning + Hover Open
- Request:
  - Fix desktop popover placement for Library and Notifications so they open directly near the clicked control.
  - Unify menu positioning behavior across desktop/mobile and avoid viewport overflow.
  - Add hover-open support for Library on desktop.
- Changes implemented:
  - Added shared anchor-and-clamp utility:
    - `src/lib/anchoredPopover.js`
  - Updated:
    - `src/components/SiteHeader.js`
    - `src/components/NotificationsMenu.js`
  - Notifications now anchor to the actual message icon button ref (not wrapper).
  - Library now supports desktop hover-open with delayed hover-close.
- Verification:
  - `npm run lint` (pass)
  - `npm run build` (pass)
- Detailed log:
  - `05-Logs/Daily/2026-02-15-library-notification-popover-positioning.md`

## UI Follow-up Revision: Simplify Library + Notification Menus to Normal Anchored Dropdowns
- Feedback:
  - Prior implementation still felt too complex and did not match expected simple dropdown behavior.
- Revision:
  - Removed extra positioning math and switched Library + Notifications to normal anchored absolute menus under their own header controls (same model as three-dot menu).
  - Kept click behavior for both menus.
  - Kept desktop hover-open for Library.
  - Updated close-on-outside logic to rely on direct container refs.
  - Removed leftover `transform: none` override that canceled Library centering.
- Verification:
  - `npm run lint` (pass)
  - `npm run build` (pass)

## Feature Follow-up: Events Ordering + End Time + RSVP Close + Invites
- Implemented events behavior update request:
  - pinned-first then newest-created order for event lists,
  - optional event end time on create/edit,
  - passed-event state (`Event happened`) with RSVP close and comments still enabled,
  - author/admin invite flow (individual users, role groups, invite-all),
  - new `event_invite` in-app notification path and UI rendering.
- Added migration:
  - `migrations/0065_events_end_time_and_invites.sql`
- Added APIs:
  - `src/app/api/events/[id]/invites/route.js`
  - `src/app/api/events/[id]/attendance/route.js`
- Full implementation + verification notes:
  - `05-Logs/Daily/2026-02-15-events-ordering-endtime-rsvp-invites.md`

## UI Follow-up: Homepage Explore Sections Mobile Density + Flow Correction
- Request:
  - Make homepage section discovery denser on mobile while preserving full section context and clear navigation paths.
- Initial implementation:
  - Added mobile compact accordion with single-open behavior.
  - Introduced `HomeSectionsList` wrapper and compact mode in `HomeSectionCard`.
- Issue observed in visual QA:
  - Compact styling looked wrong at wider viewport widths.
  - Collapsed rows showed oversized pill-like controls.
- Root causes confirmed:
  - Breakpoint mismatch (`HomeSectionsList` used `<= 760px`, compact CSS tuned at `<= 640px`).
  - Collapsed toggle inherited global mobile `main button` rules.
- Corrections applied:
  - Set compact mode breakpoint to `<= 640px` in `src/components/HomeSectionsList.js`.
  - Reset toggle styles with `all: unset` and explicit local styles in `src/app/globals.css`.
  - Removed always-visible collapsed `Open` button.
  - Updated compact flow in `src/components/HomeSectionCard.js`:
    - collapsed: title + post count + status dot/activity hint,
    - expanded: description + latest activity detail + links for `Open latest activity` and `Open section`.
- Verification:
  - `npm run lint` (pass)
  - `npm run build` (pass)
- Detailed log:
  - `05-Logs/Daily/2026-02-15-homepage-mobile-sections-accordion.md`

## Events Follow-up: End-of-Day Completion + Engagement Card Separation
- Applied follow-up adjustments to event lifecycle + layout:
  - Event completion now triggers after the end of the event day (forum timezone), not at exact event-time cutoff.
  - Invite permissions reconfirmed in both UI/API as author-or-admin only.
  - RSVP/invitations moved out of replies into a dedicated engagement card.
  - Replies card reorganized so comment input/actions appear before the posts list.
  - Removed duplicate "Event happened" wording in event detail display.
- New/updated files include:
  - `src/lib/dates.js`
  - `src/components/EventEngagementSection.js`
  - `src/components/EventCommentsSection.js`
  - `src/app/events/[id]/page.js`
  - `src/app/events/EventsClient.js`
  - `src/app/feed/page.js`
  - `src/app/api/events/[id]/rsvp/route.js`
  - `src/app/api/events/[id]/comments/route.js`
- Verification:
  - `npm run lint` (pass)
  - `npm run build` (pass)
- Detailed note:
  - `05-Logs/Daily/2026-02-15-events-ordering-endtime-rsvp-invites.md` (follow-up section appended)

## UI Follow-up: Edit Profile Tab Switcher Placement
- Request:
  - Move the Edit Profile tab switcher above the active panel content.
- Change applied:
  - Updated `src/app/account/AccountTabsClient.js` to render `ErrlTabSwitcher` before `.account-edit-tab-content--above` inside the edit profile card.
  - Removed the previous bottom-rendered switcher instance from the end of the card content.
- Verification:
  - Structural check: single `ErrlTabSwitcher` instance remains and it is above `.account-edit-tab-content--above`.
  - `npm run lint` (pass)
