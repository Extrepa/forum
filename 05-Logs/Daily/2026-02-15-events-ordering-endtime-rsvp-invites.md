# 2026-02-15 Events: Ordering, End Time, RSVP Close, and Invites

## Objective
- Translate requested event behavior updates into production-safe changes.
- Keep pinned behavior intact while showing newest posts at the top otherwise.
- Add optional event end time.
- Change passed-event UI/state behavior.
- Add invite flow for event authors/admins.
- Verify notification coverage for the new `event_invite` type.

## Implemented Changes

### 1) Event list ordering and "More" behavior
- Updated events list ordering to:
  - `ORDER BY is_pinned DESC, events.created_at DESC`
- Result:
  - pinned events stay above non-pinned events,
  - otherwise newest-created event is first,
  - remaining events render under "More" in the existing layout.
- Files:
  - `src/app/events/page.js`

### 2) Optional event end time
- Added optional end-time controls to event forms:
  - checkbox to enable end time,
  - optional `ends_at` input when enabled.
- Added server validation:
  - if provided, `ends_at` must parse,
  - `ends_at` cannot be before `starts_at`.
- Files:
  - `src/components/PostForm.js`
  - `src/app/api/events/route.js`
  - `src/app/api/events/[id]/route.js`

### 3) Passed-event behavior
- Added event completion state based on:
  - `ends_at` when present, otherwise `starts_at`.
- UI updates for completed events:
  - shows `Event happened` instead of relative "days ago" style.
  - attendance wording changes from `attending` to `attended`.
  - attendee names available via hover title text.
- RSVP close rules:
  - RSVP disabled after event completion.
  - comments remain enabled.
- Admin override:
  - admin can reopen/close attendance for passed events.
- Files:
  - `src/app/events/EventsClient.js`
  - `src/app/events/[id]/page.js`
  - `src/app/feed/page.js`
  - `src/components/EventCommentsSection.js`
  - `src/app/api/events/[id]/rsvp/route.js`
  - `src/app/api/events/[id]/comments/route.js`
  - `src/app/api/events/[id]/attendance/route.js`

### 4) Invite workflow (author/admin)
- Added event invite panel on event detail page for event author/admin:
  - invite individual users,
  - invite role groups,
  - invite all users.
- Added invite API route.
- Added notification insertion for invitees (`type = event_invite`).
- Added notification menu label/link for invite notifications.
- Added dedupe safety:
  - dedupe via `event_invites` table when available,
  - additional dedupe via existing `notifications` records (rollout-safe).
- Files:
  - `src/components/EventCommentsSection.js`
  - `src/app/events/[id]/page.js`
  - `src/app/api/events/[id]/invites/route.js`
  - `src/components/NotificationsMenu.js`

### 5) Schema migration
- Added migration for:
  - `events.ends_at`
  - `events.attendance_reopened`
  - new `event_invites` table + indexes
- File:
  - `migrations/0065_events_end_time_and_invites.sql`

## Notification Coverage Verification (New Kind: `event_invite`)

### Write path
- Invite API inserts notification records:
  - `type = 'event_invite'`
  - `target_type = 'event'`
  - `target_id = <event id>`
- File:
  - `src/app/api/events/[id]/invites/route.js`

### Read path
- Notifications API returns notification rows without type restrictions.
- `event_invite` is included naturally in unread count and recent list.
- File:
  - `src/app/api/notifications/route.js`

### Render path
- Notifications menu maps `event_invite` to:
  - label: `<actor> invited you to an event`
  - href: `/events/<target_id>`
- File:
  - `src/components/NotificationsMenu.js`

### Deduplication
- Invite send prevents duplicate invite notifications by checking:
  - existing `event_invites` entries,
  - existing `notifications` entries for `event_invite` + event + user.
- File:
  - `src/app/api/events/[id]/invites/route.js`

## Validation Run
- `npm run lint` -> pass
- `npm run build` -> pass
- `npm run test -- --run` -> not available (`test` script missing in this repo)

## Follow-up Required at Deploy Time
- Apply migration:
  - `migrations/0065_events_end_time_and_invites.sql`
- After migration, smoke-test:
  - create event with/without end time,
  - pass event time and verify RSVP close + comments open,
  - send invites (individual, role, all),
  - confirm `event_invite` appears in Messages/notifications and links to event.
