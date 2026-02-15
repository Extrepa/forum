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

## Follow-up (Description/Indicator/Spacing Pass)
- Request addressed:
  - Expanded cards should show full description text.
  - Section descriptions should be concise and remove any "image-only" language.
  - "Latest drip" label should stand out more.
  - Status light should only turn on for activity in the last 24 hours, with a distinct recent color.
  - Mobile section rows should feel tighter/more seamless.

- Implementation details:
  - `src/components/HomeSectionCard.js`
    - Added expanded description block (`home-section-card__full-description`) so expanded cards show the full section description.
    - Added per-card 24-hour freshness logic using activity timestamps.
    - Switched status-dot activation to freshness-based (`is-recent`) instead of "has any recent activity".
    - Applied styled `Latest drip:` label in both compact expanded and desktop recent lines.
  - `src/app/page.js`
    - Added `createdAt` to section `recent` payloads so 24-hour freshness can be evaluated reliably in the card component.
    - Passed `createdAt` through section card object mapping for timeline and shitposts wrappers.
    - Tightened Nomads description copy.
  - `src/lib/forum-texts/strings.js`
    - Rewrote homepage section descriptions to shorter, clearer variants.
    - Removed "image-only" phrasing from Art & Nostalgia.
  - `src/app/globals.css`
    - Added full-description styling for expanded compact cards.
    - Updated status-dot "recent" color/glow (distinct from previous blue).
    - Increased visual emphasis for `.home-section-card__status-text` ("Latest drip").
    - Reduced mobile list spacing (`.home-sections-list` gap to `2px`) and compact card padding to tighten stack rhythm.

- Verification performed:
  - `npm run lint` -> pass
  - `npm run build` -> pass
  - Spot-check grep:
    - Confirmed no remaining "image-only" wording in homepage section card copy sources.
    - Confirmed new `is-recent` status-dot class and full-description rendering hooks are present.

## Follow-up (Expanded Duplicate Copy + Empty-State + Link/Hover Polish)
- User-requested adjustments:
  - Remove duplicate description text when a mobile section card is expanded.
  - Reduce excess whitespace when expanded card has no recent posts.
  - Remove underline treatment from `Open section`.
  - Remove pink glow on section-card hover for homepage cards.

- Implementation details:
  - `src/components/HomeSectionCard.js`
    - Removed expanded-only duplicate description paragraph (`home-section-card__full-description`) from compact expanded mode.
    - Removed empty placeholder element in expanded header.
    - Added conditional class `home-section-card__details-head is-empty` when there are no recent items.
  - `src/app/globals.css`
    - Added `.home-section-card__details-head.is-empty` to align the header to the right and tighten spacing.
    - Updated `.home-section-card__section-link` to remove underline-like border and keep no underline on hover/focus.
    - Added `.home-section-card__details .section-card-empty-cta` margin reduction for tighter empty expanded cards.
    - Added homepage-specific hover/focus glow override:
      - `.home-section-card:hover::after`
      - `.home-section-card:focus-within::after`
      - Uses cyan-only glow to remove pink hover glow from homepage section cards.

- Verification performed (this follow-up pass):
  - `npm run lint` -> pass
  - `npm run build` -> pass
  - Diff and selector checks confirmed:
    - No expanded duplicate description rendering in compact expanded mode.
    - Empty-state expanded header uses `is-empty` class behavior.
    - `Open section` underline removed.
    - Hover glow override present for homepage section cards only.

- Scope note:
  - This follow-up intentionally documents only the homepage section-card changes from this thread.
  - Other parallel edits in separate conversation threads were not modified here.
