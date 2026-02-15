# 2026-02-15 - Homepage Mobile Sections Compact + Expand

## Request
- Improve homepage mobile discoverability so users can see substantially more of the 10 sections at first glance.
- Preserve full information for each section (description + latest activity / empty-state CTA).
- Keep scrolling minimal but still possible.

## Solution Implemented
- Added a mobile-first compact list mode for homepage section cards.
- Added single-open accordion behavior on mobile so only one section expands at a time.
- Kept desktop behavior unchanged (full cards with existing click-through behavior).

## Files Changed
- `src/components/HomeSectionsList.js` (new)
  - New client wrapper for the homepage sections list.
  - Detects mobile viewport (`<= 760px`) and controls expanded card state.
  - Ensures only one section is expanded at a time.

- `src/components/HomeSectionCard.js`
  - Added optional props: `compactMode`, `isExpanded`, `onToggle`.
  - Added compact rendering mode:
    - Header row with section title + count.
    - `Open` link to section root.
    - Collapsed one-line description.
    - Expanded detail panel containing full existing latest activity content, or empty-state CTA.
  - Preserved existing desktop card behavior for non-compact mode.

- `src/app/page.js`
  - Replaced direct map of `HomeSectionCard` with `HomeSectionsList` wrapper.
  - Removed now-unused imports (`Username`, `getUsernameColorIndex`).

- `src/app/globals.css`
  - Added scoped styles for homepage compact cards:
    - `.home-section-card__*` structure styles
    - compact mobile density tuning
    - expanded panel divider and animation
  - Added `@keyframes homeSectionExpand` for subtle expand motion.

## Behavior Details
- Mobile compact mode:
  - Rows are denser and easier to scan.
  - Descriptions are shown as a single truncated line in collapsed state.
  - Tapping title row toggles expansion.
  - Only one row stays expanded at a time.
  - `Open` always navigates directly to the section list page.
- Desktop mode:
  - Existing card styling and interactions remain as before.

## Verification Performed
- Ran lint:
  - `npm run lint` -> pass
- Ran production build:
  - `npm run build` -> pass
- Re-checked component usage:
  - `HomeSectionCard` is now only used by `HomeSectionsList`.

## Double-Check Notes / Risks
- Current mobile detection is client-side (`window.innerWidth`) after hydration. On very first paint, mobile may briefly render desktop layout before switching to compact mode.
  - This is functionally correct but may produce a small layout shift on mobile.
  - If needed later, we can reduce that shift with a CSS-first fallback strategy.

## Outcome
- Homepage sections are significantly more scannable on mobile.
- Full section information remains available on demand.
- Interaction model now balances quick browsing with depth.
