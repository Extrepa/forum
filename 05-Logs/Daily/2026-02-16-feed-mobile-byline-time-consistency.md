# Daily Log - 2026-02-16 - Feed Mobile Byline + Event Spacing Consistency

## Request
- Re-check the mobile/small-viewport feed card fixes.
- Ensure event cards no longer show uneven top/bottom spacing.
- Ensure feed byline/time stays consistent as `by <username> at <time>` before wrapping.

## Files Updated In This Pass
- `src/components/PostMetaBar.js`
- `src/app/feed/page.js`
- `src/app/globals.css`

## What Was Verified
- Non-condensed feed items now show `by <username> at <time>` inline on mobile.
- The separate date row is hidden on mobile when inline author-time is used.
- Event cards no longer render an empty bottom meta row when there are no attendees/last-activity details, removing extra bottom whitespace.
- Existing event inline author-time behavior remains intact.

## Validation Commands
- `npm run lint` -> pass
- `npm run build` -> pass

## Diff Scope Notes
- Confirmed the functional changes are limited to feed metadata rendering and mobile visibility rules.
- `src/app/globals.css` contains other pre-existing edits in the working tree that were not modified by this pass.
