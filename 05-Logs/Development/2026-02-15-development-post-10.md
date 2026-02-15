# Errl Portal Forum - Development Update #10

Hey everyone. This update covers everything that landed after Update #9, with a focus on search quality, event lifecycle behavior, mobile readability, menu reliability, and deployment safety.

## New Features

### Events: end time, completion flow, and invites
- Events now support an optional end time on create/edit.
- Completed-event behavior is now clearer and more consistent:
  - RSVP can close after completion,
  - comments remain open,
  - attendance wording updates to match completed state.
- Event authors/admins can now invite users to events (individual users, roles, or all users).
- Added `event_invite` notification support.

### Event page layout now separates engagement from replies
- RSVP/invite controls are now in a dedicated engagement card.
- Replies/comments stay in a focused discussion card.
- This makes the event detail page easier to scan and use.

### Search now prioritizes people and authored content better
- Username queries now return authored content more reliably across forum content types.
- Relevance ordering was improved so stronger username matches appear first.
- Mobile search form behavior was tightened for better usability.

### Admin broadcast and navigation-tip tooling
- Added admin broadcast capability for forum-wide in-app notifications.
- Added navigation-tip support for existing users and automatic tip insertion for new signups.

### Homepage mobile section explorer upgrade
- Homepage sections now use a compact mobile scan mode with single-open expansion.
- Expanded sections now show richer recent activity context.
- Interaction/copy refinements were applied after visual QA passes.

## Enhancements & Improvements

### Header menu behavior and placement
- Library and Notifications menu behavior was normalized around trigger-anchored dropdowns.
- Placement/overflow behavior was hardened across desktop and mobile.
- Library supports desktop hover-open with safer close timing.

### Modal and popout consistency
- Shared modal behavior was expanded across create/edit/settings/admin/profile flows.
- Unsaved-change close protection was standardized across modal close paths.

### Account/Admin tab and interaction cleanup
- Edit Profile tab switcher ordering/placement was corrected.
- Admin tabs were migrated to the shared switcher model for better mobile usability.

## Bug Fixes

- Fixed notification recipient path issues that caused silent misses in some comment/reply flows.
- Fixed event RSVP/comment edge cases around completion state behavior.
- Fixed a notifications runtime regression during menu refactor (`onClose` path).
- Fixed header/menu clipping and overflow regressions.
- Fixed homepage compact-mode regressions from breakpoint/style conflicts.
- Hardened additional Next.js 15 compatibility edges in touched files.

## Technical Improvements

### Migration
- Added `migrations/0065_events_end_time_and_invites.sql`:
  - `events.ends_at`
  - `events.attendance_reopened`
  - `event_invites` table + indexes

### New/updated routes and utilities
- Added:
  - `src/app/api/events/[id]/invites/route.js`
  - `src/app/api/events/[id]/attendance/route.js`
  - `src/app/api/admin/notifications/broadcast/route.js`
  - `src/lib/anchoredPopover.js`
  - `src/lib/adminNotifications.js`
  - `src/lib/dates.js`
  - `src/components/EventEngagementSection.js`
  - `src/components/HomeSectionsList.js`
- Updated search internals in:
  - `src/app/api/search/route.js`
  - `src/app/search/SearchResults.js`

### Deployment/config alignment
- Added `deploy:preview` script entry.
- Explicitly aligned preview env D1/R2 bindings with production in `wrangler.toml`.

## Known Issues & Notes

- This update touched many shared surfaces (header, events, search, homepage, admin).
- Extra mobile + desktop manual QA is still recommended after future UI changes in these areas.

---

Thanks for all the feedback and fast iteration help on this one. If something looks off, include the page and viewport width in your bug note so I can reproduce quickly.
