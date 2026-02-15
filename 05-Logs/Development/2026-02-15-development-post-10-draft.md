# Errl Portal Forum - Development Update #10 (Draft)

Hey everyone. This update covers everything that landed after Development Update #9. The focus was search quality, event lifecycle tools, mobile readability, popover/menu reliability, and deployment safety.

## New Features

### Events: end-time support, completion logic, and invites
- Event create/edit now supports optional **end time**.
- Event completion state now supports a stronger lifecycle model:
  - completion uses end time when present (otherwise start time),
  - then follow-up was refined so completion behavior is evaluated as end-of-day in forum timezone logic,
  - RSVP can auto-close for completed events while comments stay available.
- Event authors/admins can now invite:
  - individual users,
  - role groups,
  - all users.
- Added new `event_invite` notification path and event invite dedupe behavior.

### Event engagement layout split
- Event detail now separates engagement from replies:
  - dedicated engagement card for RSVP + invites,
  - replies/comments card focused on conversation.
- This removes mixed interaction clutter and makes invite/rsvp actions easier to find.

### Search now finds content by author identity, not just body text
- Search now ranks and returns authored content when searching usernames.
- Coverage includes posts/replies across forum sections and shared post types.
- Ranking was upgraded so exact/strong identity matches appear first, then weaker text matches.

### Admin broadcast + notification tooling
- Added admin broadcast route + UI tool for forum-wide in-app announcements.
- Added one-time navigation tip support for existing users and automatic navigation tip on new signup.
- Added admin new-post notifications across additional section create routes.

### Homepage mobile compact explorer and mixed activity feed
- Homepage sections now support a compact mobile scan mode with single-open accordion behavior.
- Expanded section rows now show richer **mixed recent activity** (posts + replies/comments), sorted newest-first.
- Card interaction was refined so expanded sections are more actionable without visual overload.

## Enhancements & Improvements

### Header menu reliability and consistency
- Library and Notifications menu behavior was normalized to anchored dropdown behavior near the trigger.
- Placement and overflow behavior were repeatedly tightened for desktop and small viewport stability.
- Added desktop hover-open support for Library with delayed hover-close to avoid flicker.
- Notifications remained trigger-driven from the right-side header action and received runtime safety fixes.

### Mobile UI and interaction polish
- Search page mobile form layout was hardened to avoid compressed input/button behavior.
- Username color rendering and mini profile popover behavior were made more consistent across search/feed/event surfaces.
- Homepage compact rows received additional copy/structure polish:
  - cleaner collapsed title + meta line,
  - clearer expanded activity list and section actions,
  - reduced repeated labels in expanded state.

### Modal and popout consistency pass
- Modal shell usage was expanded across create/edit/settings/admin/profile flows for consistent open/close behavior.
- Unsaved-change confirmation handling was standardized across close actions (including backdrop + escape where applicable).
- Card sizing behaviors in modal contexts were adjusted to avoid mobile framing/height mismatch.

### Account/Edit Profile tab behavior cleanup
- Edit profile tab switcher placement/order was corrected so the switcher appears before tab content and remains predictable.
- Admin Console tab strip was replaced with shared tab-switcher behavior for better mobile readability.

## Bug Fixes

- Fixed silent notification failures in several comment/reply paths caused by recipient lookup mismatches.
- Fixed event route/API edge cases around completion + RSVP/comment behavior.
- Fixed notification menu runtime regression (`onClose` path) introduced during menu simplification.
- Fixed header/menu clipping issues by correcting overflow behavior in header containers.
- Fixed homepage compact-mode visual regressions caused by breakpoint mismatch and inherited global button styles.
- Fixed popover/menu overflow issues with viewport clamping and follow-up simplification.
- Hardened additional Next.js 15 compatibility edges in touched routes/components.

## Technical Improvements

### Database & migration
- Added migration:
  - `migrations/0065_events_end_time_and_invites.sql`
    - `events.ends_at`
    - `events.attendance_reopened`
    - `event_invites` table + indexes
- Migration was applied to remote D1 during rollout verification.

### API additions and upgrades
- New routes:
  - `src/app/api/events/[id]/invites/route.js`
  - `src/app/api/events/[id]/attendance/route.js`
  - `src/app/api/admin/notifications/broadcast/route.js`
- Expanded/updated event and notification paths:
  - `src/app/api/events/route.js`
  - `src/app/api/events/[id]/route.js`
  - `src/app/api/events/[id]/rsvp/route.js`
  - `src/app/api/events/[id]/comments/route.js`
  - `src/app/api/auth/signup/route.js`
  - `src/app/api/admin/test-notification/route.js`

### Shared utilities and component architecture
- Added `src/lib/anchoredPopover.js` for reusable anchor/clamp positioning.
- Added `src/lib/adminNotifications.js` to centralize admin notification inserts.
- Added `src/lib/dates.js` for event day-boundary completion logic.
- Added `src/components/EventEngagementSection.js` to separate RSVP/invites from replies.
- Added `src/components/HomeSectionsList.js` as mobile compact/accordion controller.

### Search and ranking internals
- Search query matching/ranking logic upgraded in:
  - `src/app/api/search/route.js`
  - `src/app/search/SearchResults.js`
- Client layout hardening in:
  - `src/app/search/SearchClient.js`
  - `src/components/SearchResultsPopover.js`
  - `src/app/globals.css`

### Deployment and environment safety updates
- Added explicit preview deploy script entry:
  - `package.json` -> `deploy:preview`
- Ensured preview and production use the same core data bindings by explicitly defining preview env D1/R2 resources in:
  - `wrangler.toml`
- Verified preview and production deployments after these changes.

## Verification Summary

- Repeated lint/build passes were run during each major follow-up batch.
- Event lifecycle, invite flow, and notification rendering were rechecked after follow-up iterations.
- Homepage compact/expanded behavior received multiple pass-through refinements with verification reruns.
- Preview and production deployments were both completed successfully after config and migration alignment.

## Known Issues & Notes

- This was a high-surface update touching shared layout, header, event, search, and admin flows; targeted manual QA on mobile + desktop remains valuable.
- Header dropdown behavior is now significantly more stable, but it is still worth smoke-testing on narrow devices after any future header CSS changes.
- Because this update included multiple iterative polish passes, this draft intentionally keeps extra implementation detail for traceability before a final publish cut.

---

Thanks for all the testing feedback that shaped this one. If you spot anything off, include the page and device width in your bug report so I can reproduce and patch quickly.
