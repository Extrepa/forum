# 2026-02-06 Outline stagger + home card linking

## Summary
- Added stronger stagger sequencing for neon outline animation on list cards so adjacent cards do not run in lockstep.
- Added stagger sequencing for base `.card` outlines as well, with duration and delay variation.
- Updated Home section cards so:
  - clicking the card navigates to the section/category page, and
  - clicking the "Latest drip" activity text navigates to the most recent activity target.

## Files changed
- `src/app/globals.css`
- `src/components/HomeSectionCard.js`

## Behavior details
- `list-item` outlines now use a 6-step cycle (`6n + 1` through `6n + 6`) for duration + negative delay.
- `.card` outlines now use a 5-step cycle (`5n + 1` through `5n + 5`) for duration + negative delay.
- Home cards with recent activity now use a clickable container for section routing and a separate inner link for recent activity routing.

## Verification
- `npm run lint` passed with no warnings/errors.
- `npm run build` succeeded (Next.js 15.5.9).
- Confirmed only intended files changed for this task.

## Branch/context
- Changes made on `main` per user request to prepare immediate deploy.
