# Daily Log - 2026-02-16 - Events Preview Card Order + More Card Condense Fix

## Request
- Fix event list card arrangement so the top preview follows event-post flow:
  - event info first,
  - then image,
  - then post text.
- Clean up condensed "More" event cards to reduce awkward wrapping/spacing.
- Do not show attendance checkbox controls once an event has already happened.

## Files Updated
- `src/app/events/EventsClient.js`
- `src/components/EventEngagementSection.js`

## Implementation
- Reordered top event preview content in `EventsClient`:
  - moved event datetime/info row above image and details,
  - moved markdown details block to render after image.
- Tightened condensed event card behavior in "More":
  - constrained event-info row wrapping and overflow behavior for compact cards,
  - removed extra condensed "Last activity" line to reduce visual clutter and wasted vertical space.
- Updated attendance indicators:
  - listing-level `✓ Attending` now hides when event has passed,
  - detail-page `I'm attending` checkbox no longer renders for passed events.

## Verification
- `npm run lint` -> pass.
- `npm run build` -> pass.
- Diff review confirmed scope is limited to events list card composition and event engagement RSVP visibility.

## Double-check notes
- Event detail page still keeps attendee summary/labels, but suppresses active RSVP checkbox once passed.
- Completed-event messaging remains intact via existing "RSVP is closed because this event already happened." notice.
