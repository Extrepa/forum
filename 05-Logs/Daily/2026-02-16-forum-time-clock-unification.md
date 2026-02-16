# 2026-02-16 forum time clock unification

## Summary
- Completed a full forum time-audit pass to eliminate mixed-clock behavior between event display labels, relative day text, and event create/edit inputs.
- Standardized all event-related rendering and input parsing to the forum timezone (`America/Los_Angeles`) so feed/events/admin/form flows use one consistent clock.

## User-reported issue
- Event configured for **February 15 at 6:00 PM** was being labeled inconsistently against the current local context (for example around **February 15, 4:12 PM**).
- The mismatch came from mixed timezone handling across different code paths.

## Root cause
- The codebase had a split between:
  - hardcoded Pacific-time formatting in some places,
  - server-local day-boundary math in relative labels (`Today`/`Yesterday`),
  - browser-local `datetime-local` input population in forms.
- This created day-label drift and inconsistent event status messaging depending on environment/runtime timezone.

## Files changed
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/lib/dates.js`
  - Added `FORUM_TIME_ZONE` constant and centralized timezone usage.
  - Updated date/time formatters to consistently use forum timezone.
  - Reworked `formatEventDate()` and `formatRelativeEventDate()` to use timezone-aware day-index logic.
  - Added datetime-local helpers for forum time:
    - `formatDateTimeLocalInputInForumTime()`
    - `getCurrentDateTimeLocalInputInForumTime()`
  - Kept parsing/roundtripping consistent with `parseLocalDateTimeToUTC()` in forum timezone.

- `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/PostForm.js`
  - Replaced browser-local datetime-local defaulting with forum-time helpers for `starts_at` and `ends_at`.

- `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/AdminConsole.js`
  - Switched admin time/date rendering and datetime-local event edit values to shared forum-time helpers.
  - Updated labels from `local time` to `forum time` for clarity.

- `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/SearchResultsPopover.js`
  - Replaced raw `toLocaleDateString()` with shared `formatDate()` for consistent timezone handling.

- `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/ProfileTabsClient.js`
  - Replaced split date/time locale formatting with shared `formatDateTime()`.

- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/projects/[id]/page.js`
  - Replaced raw date formatting for project update timestamps with shared `formatDate()`.

## Double-check pass (post-change)
- Static verification:
  - `npm run lint` passed.

- Targeted runtime checks:
  - Simulated event at `2026-02-16T02:00:00Z` (which is Feb 15, 6:00 PM Pacific) with simulated current time `2026-02-15T23:12:00Z` (Feb 15, 3:12 PM Pacific).
  - Results:
    - `formatEventDate` -> `Today`
    - `formatEventTime` -> `6:00 PM`
    - `formatRelativeEventDate` -> `Today`
    - `isEventUpcoming` -> `true`
  - Datetime-local roundtrip consistency check:
    - forum input from timestamp -> `2026-02-15T18:00`
    - parsed back to UTC -> `2026-02-16T02:00:00.000Z`
    - exact match with original timestamp.

## Notes
- Existing historical events that were saved while old mixed-clock behavior was in place may retain incorrect stored values; re-saving those events normalizes them through the new timezone-consistent parser/render path.
- This update is additive and compatible with the prior event end-of-day Pacific completion fix logged in:
  - `/Users/extrepa/Projects/errl-portal-forum-docs/05-Logs/Daily/2026-02-16-events-pst-end-of-day-fix.md`
