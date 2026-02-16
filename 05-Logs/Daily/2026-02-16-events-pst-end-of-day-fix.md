# 2026-02-16 events PST end-of-day fix

## Summary
- Fixed event datetime parsing so event start/end values are interpreted in Pacific Time (`America/Los_Angeles`) before being stored as UTC timestamps.
- This aligns stored timestamps with existing event completion logic that marks events as finished at end-of-day Pacific Time.

## Root cause
- `datetime-local` form values were previously parsed using the runtime/server local timezone.
- On non-Pacific runtimes, that could shift the effective event day and cause the UI/API to treat some events as already happened earlier than intended.

## Changes
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/lib/dates.js`
  - Updated `parseLocalDateTimeToUTC()` to parse values in `America/Los_Angeles` (default), using timezone-aware conversion.
  - Added input range guards before conversion.

## Verification
- `npm run lint` passed.
- `npm run build` passed.

## Notes
- New and edited events now use Pacific-time interpretation consistently.
- If any previously created event still has an incorrect stored date/time from old parsing behavior, re-saving that event will normalize its stored timestamps with the new parser.

## Double-check audit
- Re-reviewed current diffs touching event/feed metadata and event datetime handling:
  - `/Users/extrepa/Projects/errl-portal-forum-docs/src/lib/dates.js`
  - `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/PostMetaBar.js`
  - `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/feed/page.js`
  - `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/events/EventsClient.js`
  - `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/globals.css`
- Re-ran validation after the review:
  - `npm run lint` passed.
  - `npm run build` passed.
- Confirmed event completion behavior remains end-of-day Pacific-time based (with timezone-aware parsing now aligned to the same timezone).

## Thread coverage checklist
- Covered in logs for this thread:
  - Feed/Event metadata cleanup:
    - Removed duplicate event post-time rendering on feed cards.
    - Preserved `by <username> at <time>` inline on event cards (including condensed "More" cards).
    - Tightened conditional meta-row rendering so extra blank spacing is not introduced when row 2 has no content.
  - List/layout polish:
    - Reduced tight-list spacing and list-item padding for denser, more even card rhythm.
    - Adjusted condensed/mobile metadata wrapping behavior and inline date no-wrap handling.
  - Event timing correctness:
    - Fixed datetime parsing to Pacific-time interpretation for create/edit event flows so "Event happened" status does not flip early due to timezone skew.
  - Verification:
    - Multiple reruns of `npm run lint` and `npm run build` after changes (all passing).
- Cross-reference:
  - Detailed UI/list/meta notes are also captured in `/Users/extrepa/Projects/errl-portal-forum-docs/05-Logs/Daily/2026-02-15-username-color-and-popover-consistency.md` under the section:
    - `2026-02-15 follow-up: feed/events meta consistency and list spacing pass`
