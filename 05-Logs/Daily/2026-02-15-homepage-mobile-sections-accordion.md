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
  - Detects mobile viewport (`<= 640px`) and controls expanded card state.
  - Ensures only one section is expanded at a time.

- `src/components/HomeSectionCard.js`
  - Added optional props: `compactMode`, `isExpanded`, `onToggle`.
  - Added compact rendering mode with revised interaction flow:
    - Collapsed row: section title + post count + lightweight recent-activity status indicator.
    - Expanded panel: description + latest activity detail + explicit links for latest item and section root.
    - Removed always-visible collapsed `Open` button.
  - Preserved existing desktop card behavior for non-compact mode.

- `src/app/page.js`
  - Replaced direct map of `HomeSectionCard` with `HomeSectionsList` wrapper.
  - Removed now-unused imports (`Username`, `getUsernameColorIndex`).

- `src/app/globals.css`
  - Added scoped styles for homepage compact cards:
    - `.home-section-card__*` structure styles
    - compact mobile density tuning
    - expanded panel divider and animation
    - collapsed status-dot + activity label treatment
    - expanded action-link treatments
  - Added `@keyframes homeSectionExpand` for subtle expand motion.

## Behavior Details
- Mobile compact mode:
  - Rows are denser and easier to scan.
  - Collapsed state shows title, count, and activity signal only.
  - Tapping title row toggles expansion.
  - Only one row stays expanded at a time.
  - Expanded state reveals description + latest activity + section navigation links.
- Desktop mode:
  - Existing card styling and interactions remain as before.

## Verification Performed
- Ran lint:
  - `npm run lint` -> pass
- Ran production build:
  - `npm run build` -> pass
- Re-checked component usage:
  - `HomeSectionCard` is now only used by `HomeSectionsList`.
- Ran post-feedback correction checks:
  - `npm run lint` -> pass
  - `npm run build` -> pass

## Troubleshooting Timeline
- Initial compact pass produced poor visual results at wider viewports.
- Two causes were confirmed:
  - Breakpoint mismatch (`HomeSectionsList` JavaScript used `<= 760px` while compact CSS was tuned at `<= 640px`).
  - Collapsed toggle inherited global `main button` styling, causing oversized pill-like controls.
- Corrections applied:
  - Standardized compact activation to `<= 640px`.
  - Reset toggle control styling with `all: unset` and explicit local styles.
  - Removed collapsed `Open` button and switched to status-driven collapsed rows with richer expanded actions.

## Double-Check Notes / Risks
- Current mobile detection is client-side (`window.innerWidth`) after hydration. On very first paint, mobile may briefly render desktop layout before switching to compact mode.
  - This is functionally correct but may produce a small layout shift on mobile.
  - If needed later, we can reduce that shift with a CSS-first fallback strategy.

## Outcome
- Homepage sections are significantly more scannable on mobile.
- Full section information remains available on demand.
- Interaction model now balances quick browsing with depth.

## Final Follow-up (Mixed Activity Top-3)
- Updated collapsed row layout:
  - Section title + shortened description now share one line.
  - Count, activity dot, and expand indicator remain on the right.
- Updated expanded row behavior:
  - `Open section` is now inline with the recent-activity header.
  - Latest activity rows are directly clickable (`Latest drip` line itself), removing need for a separate latest-activity button.
- Added true mixed activity feed per section (top 3):
  - Combines posts + replies/comments, sorted newest-first.
  - Not just UI duplication of a single latest item.
- Technical wiring:
  - `src/app/page.js` now builds per-section `recentActivities` arrays with merged activity sources.
  - `src/components/HomeSectionsList.js` passes `recentActivities`.
  - `src/components/HomeSectionCard.js` renders up to 3 compact recent lines in expanded mode.
- Verification rerun after final changes:
  - `npm run lint` -> pass
  - `npm run build` -> pass

## Follow-up (Expanded Card Copy Cleanup)
- User-requested copy adjustment in compact expanded cards:
  - Removed the `Recent activity {timeAgo}` header line.
  - Added one shared `Latest drip:` label above the recent items list.
  - Removed repeated `Latest drip:` prefix from each list row so each row now reads as plain activity text + time.
- File updated:
  - `src/components/HomeSectionCard.js`
- Double-check performed:
  - Verified expanded-mode render now contains only one `Latest drip:` label (header-level).
  - Verified `Recent activity` text is no longer present in compact expanded card output.
