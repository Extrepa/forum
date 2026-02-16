# Errl Portal Forum - Development Update #10

Hey everyone. This update covers everything that landed after Update #9, plus follow-up work completed on February 15-16, 2026. Focus areas were events, search relevance, private-section permissions, admin tooling, and mobile/UI reliability.

## New Features

### Events: end time, completion flow, and invites
- Events now support optional end time on create/edit.
- Completed-event behavior is clearer and more consistent:
  - RSVP can close after completion,
  - comments remain open,
  - attendance wording updates to match completed state.
- Event authors/admins can invite users (individual, role, or all users).
- Added `event_invite` notification support with dedupe safeguards.

### Event page layout now separates engagement from replies
- RSVP/invite controls are now in a dedicated engagement card.
- Replies/comments stay in a focused discussion card.
- This makes event detail easier to scan and use.

### Driplet/Nomads role model and private section support
- Base role display renamed from `Drip` to `Driplet`.
- Added new `drip_nomad` role (`Drip Nomad`).
- Added Nomads section (`/nomads`) with role-gated visibility rules.
- Added moderator delete-only scope across section content delete paths.

### Search now prioritizes authored content better
- Username queries now return authored content more reliably across post/reply/comment surfaces.
- Relevance ordering now prioritizes stronger identity matches first.
- Mobile search form behavior was tightened for usability.

### Admin broadcast and navigation-tip tooling
- Added admin broadcast capability for forum-wide in-app notifications.
- Added one-time navigation-tip support for existing users and automatic tip insertion on new signup.

### Homepage mobile section explorer upgrade
- Homepage sections now use a compact mobile scan mode with single-open expansion.
- Expanded sections now show mixed recent activity context.
- Added a dedicated Nomads home card for eligible users.

## Enhancements & Improvements

### Admin Console follow-up improvements
- Overview/System Log layout was reworked for better readability and space usage.
- Added system-log filtering, markdown export, and archive rollover/download support.
- Added broader admin action confirmations and improved bottom-row action menu reachability.

### Header menu behavior and placement
- Library and Notifications behavior was normalized around trigger-anchored dropdowns.
- Placement/overflow behavior was hardened across desktop and mobile.
- Library supports desktop hover-open with safer close timing and click-to-pin behavior.
- Library links now sort alphabetically; `Nomads` is pinned first for Drip Nomads.

### Forum-time clock unification
- Completed an event time-audit to remove mixed timezone behavior between event labels, relative day text, and create/edit inputs.
- Standardized event display/input handling to one forum clock (`America/Los_Angeles`) across feed/events/admin/form flows.
- Added shared datetime-local forum-time helpers to keep roundtrip behavior consistent.

### Modal/popout and account/profile cleanup
- Shared modal behavior was expanded across create/edit/settings/admin/profile flows.
- Unsaved-change close protection was standardized.
- Edit/profile tab switcher ordering was corrected.
- Account editing now uses summary-first username/avatar cards with explicit edit expansion and improved large-screen layout.

## Bug Fixes

- Fixed notification recipient-path issues causing silent misses in some comment/reply flows.
- Fixed event RSVP/comment edge cases around completion state behavior.
- Fixed mixed-clock event behavior by unifying parsing/rendering to forum time (`America/Los_Angeles`).
- Fixed notifications runtime regression during menu refactor (`onClose` path).
- Fixed header/menu clipping and small-viewport dropdown visibility regressions.
- Fixed mobile username mini-popover stretch behavior from broad card rules.
- Fixed feed/event duplicate timestamp rendering and list spacing inconsistencies.
- Hardened additional Next.js 15 compatibility edges in touched files.

## Technical Improvements

### Migrations
- Added `migrations/0065_events_end_time_and_invites.sql`:
  - `events.ends_at`
  - `events.attendance_reopened`
  - `event_invites` table + indexes
- Added `migrations/0066_drip_nomads_and_visibility.sql` for role/scope visibility fields and indexing.

### New/updated routes and utilities
- Added/expanded:
  - `src/app/api/events/[id]/invites/route.js`
  - `src/app/api/events/[id]/attendance/route.js`
  - `src/app/api/admin/notifications/broadcast/route.js`
  - `src/lib/anchoredPopover.js`
  - `src/lib/adminNotifications.js`
  - `src/lib/dates.js`
  - `src/lib/roles.js`
  - `src/lib/visibility.js`
  - `src/components/EventEngagementSection.js`
  - `src/components/HomeSectionsList.js`
  - `src/components/NomadContentComposer.js`
- Additional forum-time helper adoption across:
  - `src/components/PostForm.js`
  - `src/components/AdminConsole.js`
  - `src/components/SearchResultsPopover.js`
  - `src/components/ProfileTabsClient.js`
  - `src/app/projects/[id]/page.js`
- Updated search internals in:
  - `src/app/api/search/route.js`
  - `src/app/search/SearchResults.js`

## Known Issues & Notes

- This update touched many shared surfaces (header, events, search, homepage, admin, role/visibility).
- Extra mobile + desktop manual QA is still recommended after future UI changes in these areas.
- For legacy events saved before forum-time clock unification, re-saving an event normalizes stored timestamps.
- `npm test -- --run` is still unavailable in this repository (no `test` script).

---

Thanks for all the feedback and fast iteration help on this one. If something looks off, include the page and viewport width in your bug note so I can reproduce quickly.
