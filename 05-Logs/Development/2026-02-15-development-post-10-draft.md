# Errl Portal Forum - Development Update #10 (Draft)

Hey everyone. This update covers everything that landed after Development Update #9, including follow-up work completed on February 15-16, 2026. The main themes were events, search quality, private-section permissions, admin tooling, mobile readability, and menu/popover reliability.

## New Features

### Events: end-time support, completion logic, and invites
- Event create/edit now supports optional **end time**.
- Completion logic now follows a stronger lifecycle model:
  - completion uses end time when present (otherwise start time),
  - completion checks were refined to forum end-of-day behavior in Pacific Time,
  - RSVP can close for completed events while comments remain available.
- Event authors/admins can now invite:
  - individual users,
  - role groups,
  - all users.
- Added `event_invite` notification handling with invite dedupe safeguards.

### Event detail layout split
- Event detail now separates engagement from replies:
  - dedicated engagement card for RSVP + invites,
  - replies/comments card focused on conversation.
- This removes mixed interaction clutter and makes invite/rsvp actions easier to find.

### Driplet/Nomads role model and private section controls
- Base role display was renamed from `Drip` to `Driplet` (capabilities unchanged).
- Added new `drip_nomad` role (`Drip Nomad`).
- Added Nomads section (`/nomads`) with role-gated access and Nomads-scoped visibility for posts/events.
- Added moderator delete-only scope across section content delete endpoints.

### Search now finds authored activity much more reliably
- Search now ranks and returns authored content when searching usernames.
- Coverage expanded beyond top-level posts to include replies/comments across multiple content types.
- Ranking now prioritizes stronger identity matches before weaker text matches.

### Admin broadcast + notification tooling
- Added admin broadcast route + UI for forum-wide in-app announcements.
- Added one-time navigation tip support:
  - automatic tip for new signups,
  - deduped admin-triggered send for existing users.
- Added centralized admin new-post notifications across more create routes.

### Homepage mobile compact explorer and mixed activity feed
- Homepage sections now support a compact mobile scan mode with single-open accordion behavior.
- Expanded rows now show mixed recent activity (posts + replies/comments), sorted newest-first.
- Added a dedicated Nomads home card for eligible users.

## Enhancements & Improvements

### Admin Console follow-up expansion
- Reworked Overview lower layout into a clearer two-column structure with improved System Log space usage.
- Added system log de-duplication, user/action filters, in-card controls, markdown export, and archive rollover downloads.
- Added global admin success/error notices for console actions.
- Split traffic visualization into:
  - `Network activity` (windowed metrics),
  - `Operational totals` (state totals).
- Improved bottom-row action-menu reachability and hit targets in admin tables.

### Header menu reliability and consistency
- Library and Notifications menu behavior was normalized to anchored dropdown behavior near triggers.
- Placement/overflow behavior was repeatedly tightened for desktop and small viewport stability.
- Added desktop hover-open support for Library with delayed close and click-to-pin behavior.
- Library list now sorts alphabetically, with `Nomads` pinned first for `drip_nomad` users.

### Mobile UI and interaction polish
- Search mobile form layout was hardened to avoid compressed input/button behavior.
- Username color and mini-profile popover behavior were made more consistent across search/feed/event surfaces.
- Feed/event meta rows were cleaned up for clearer byline/timestamp behavior and tighter list rhythm.
- Homepage compact rows received additional copy/spacing/hover refinements after QA follow-ups.

### Forum-time clock unification
- Completed a full event time-audit to remove mixed timezone behavior across labels, relative day text, and event create/edit inputs.
- Standardized event display/input handling to one forum clock (`America/Los_Angeles`) across feed/events/admin/forms.
- Updated shared date helpers and datetime-local roundtrip handling so create/edit defaults and saved values stay consistent.

### Modal and popout consistency pass
- Shared modal shell usage was expanded across create/edit/settings/admin/profile flows.
- Unsaved-change confirmation handling was standardized across close actions (backdrop/escape/close button paths).
- Modal card sizing rules were adjusted to prevent mobile framing/height mismatch.

### Account and profile layout cleanup
- Edit profile/public profile switcher ordering was corrected so switchers render before tab content.
- Account page width caps were removed on larger viewports.
- Username/avatar account editors now use summary-first cards with explicit `Edit` expansion, improving readability and reducing heavy editor rendering until needed.

## Bug Fixes

- Fixed silent notification failures in several comment/reply paths caused by recipient query alias issues.
- Fixed event route/API edge cases around completion + RSVP/comment behavior.
- Fixed mixed-clock event behavior by unifying parsing and rendering to forum time (`America/Los_Angeles`).
- Fixed notification menu runtime regression (`onClose`) introduced during menu simplification.
- Fixed header/menu clipping and small-viewport dropdown visibility issues.
- Fixed mobile username popover full-width stretching caused by overly broad `.card` rules.
- Fixed feed/event duplicate time rendering and inconsistent condensed-row spacing.
- Hardened additional Next.js 15 compatibility edges in touched routes/components.

## Technical Improvements

### Database & migrations
- Added migration:
  - `migrations/0065_events_end_time_and_invites.sql`
    - `events.ends_at`
    - `events.attendance_reopened`
    - `event_invites` table + indexes
- Added migration:
  - `migrations/0066_drip_nomads_and_visibility.sql`
    - visibility/scope fields for posts/events
    - Nomads-scoping support indexes

### API additions and upgrades
- New routes:
  - `src/app/api/events/[id]/invites/route.js`
  - `src/app/api/events/[id]/attendance/route.js`
  - `src/app/api/admin/notifications/broadcast/route.js`
- Expanded/updated event, notification, role, and visibility paths across posts/events/admin/signup/search routes.

### Shared utilities and component architecture
- Added `src/lib/anchoredPopover.js` for reusable trigger anchoring/clamp behavior.
- Added `src/lib/adminNotifications.js` for centralized admin new-post notification inserts.
- Added/expanded `src/lib/dates.js` for event completion day-boundary handling and timezone-aligned parsing.
- Added `FORUM_TIME_ZONE` and forum-time datetime-local helpers in `src/lib/dates.js` to centralize event clock behavior.
- Added `src/lib/roles.js` and `src/lib/visibility.js` to centralize role/visibility logic.
- Added `src/components/EventEngagementSection.js` to separate RSVP/invites from replies.
- Added `src/components/HomeSectionsList.js` as mobile compact/accordion controller.
- Added `src/components/NomadContentComposer.js` for Nomads section composer flow.
- Updated additional UI surfaces to shared date helpers for forum-time consistency:
  - `src/components/PostForm.js`
  - `src/components/AdminConsole.js`
  - `src/components/SearchResultsPopover.js`
  - `src/components/ProfileTabsClient.js`
  - `src/app/projects/[id]/page.js`

## Verification Summary

- Repeated lint/build passes were run across each major follow-up batch.
- Event lifecycle, invite flow, and notification rendering were rechecked after iterative follow-ups.
- Nomads role/visibility routing and section behavior were verified with lint/build reruns.
- Admin Console Overview/System Log/settings and action-menu follow-ups were revalidated.
- Feed/list/meta and timezone parsing follow-ups on February 16, 2026 were validated with lint/build reruns.
- `npm test -- --run` remains unavailable in this repository (no `test` script in `package.json`).

## Known Issues & Notes

- This was a high-surface update touching shared layout, header, event, search, admin, and role/visibility paths; targeted mobile + desktop QA is still recommended.
- Header dropdown behavior is substantially more stable, but still worth smoke-testing after future header CSS changes.
- For legacy events saved before timezone clock unification, re-saving an event normalizes stored timestamps under the updated forum-time interpretation.
- This draft intentionally keeps extra implementation detail for traceability before final publish trim.

---

Thanks for all the testing feedback that shaped this one. If you spot anything off, include the page and viewport width in your bug report so I can reproduce and patch quickly.
