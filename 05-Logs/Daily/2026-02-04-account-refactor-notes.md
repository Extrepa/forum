# Account Page Refactor Notes - 2026-02-04

## Overview
Refactoring the account page to be significantly more compact and mobile-friendly.

## Components
- **AccountSettings.js**: The new core component.
- **EditSheet**: Needs better desktop handling (centering and max-height fixes).

## Desired UX Refinements
1. **Header Layout**: Move card subtitles to the same row as titles.
2. **EditSheet Fix**: Ensure `max-height: 95vh` and vertical centering on desktop.
3. **Notification Logic**:
    - Unified edit sheet for both site and admin notifications.
    - Validation: Site notifs require Email delivery; SMS requires phone.
4. **Site & UI**:
    - Add "(Default)" to Rainbow theme.
    - Add "Display settings saved" success message.
5. **Cleanup**:
    - Remove "account active on device" text.
    - Remove redundant edit buttons.
    - Simplify Sign Out card.

## Implementation Status
- Basic cards created.
- Basic sheet logic implemented but needs CSS refinement for scrolling/centering.
- Validation logic partially implemented.
