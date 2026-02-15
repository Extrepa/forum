# 2026-02-15 username color and popover consistency

## Summary
- Extended the search fix to ensure usernames use each user’s saved custom color preference consistently.
- Updated clickable username behavior on touch devices so tapping a username opens the mini profile popover instead of triggering parent-row navigation.
- Improved Feed color consistency for non-author names (attendees and last-activity users) by resolving preferred username colors for all visible usernames.

## Changes
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/search/SearchResults.js`
  - Added `author_color_preference` to search result selects for all content types and user results.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/api/search/route.js`
  - Added `author_color_preference` to mirrored API search selects for parity with server-rendered search.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/search/SearchClient.js`
  - Switched username rendering to pass `preferredColorIndex` from search result data.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/SearchResultsPopover.js`
  - Switched to preferred color-based username rendering.
  - Stopped event propagation on username interactions so row-click handlers do not override username popover behavior.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/Username.js`
  - Added touch interaction guards (`preventDefault`/`stopPropagation`) so username taps in clickable containers open mini profile cards reliably.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/feed/page.js`
  - Added username preference lookup for all usernames shown in feed cards, including attendee names and last-activity names.
  - Passed preferred color values through `PostMetaBar` and `Username` fallbacks.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/EventRSVP.js`
  - Updated attendee usernames to use `preferred_username_color_index` when present.

## Verification
- `npm run lint` passed after all edits.

## Follow-up (viewport hardening + CSS guard)
- Added explicit viewport-clamp positioning to account and action popovers that previously relied on mostly CSS constraints:
  - `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/HeaderAccountButton.js`
  - `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/PostActionMenu.js`
- Added/updated global CSS guard so username mini profile popovers stay compact and non-scroll:
  - `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/globals.css` (`.user-popover.card`)
- Verified `UserPopover` continues to clamp top/left to viewport edges while keeping compact content width:
  - `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/UserPopover.js`

## Double-check audit notes
- Search result relevance, username color preference flow, and popover interaction fixes are present in both server-rendered and API search paths.
- Touch interactions on usernames inside clickable containers now open the mini profile card instead of triggering parent navigation first.
- `npm run lint` rerun after viewport hardening changes (pass).

## 2026-02-15 follow-up: mobile mini-profile stretch fix
- Issue observed: on small/mobile viewports, username mini-profile popovers were stretching to full card width instead of staying compact like desktop.
- Root cause: the mobile auth/layout rule `.card:not(.avatar-customizer-panel)` in global styles applied `width: 100% !important` and `max-width: 100% !important` to all cards, including `.user-popover` (which uses class `card`).
- Fix applied:
  - `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/globals.css`
  - Updated selector to `.card:not(.avatar-customizer-panel):not(.user-popover)` so the username popover is excluded from forced full-width behavior on small screens.
- Verification:
  - Re-checked final CSS diff to confirm only this selector change was made for the fix.
  - `npm run lint` passed after the change.

## 2026-02-15 follow-up: feed/events meta consistency and list spacing pass
- Issues addressed:
  - Feed event rows showed post time twice (inline with author and again in event info row).
  - Events page "More" cards did not consistently keep `by <username> at <time>` inline with the title/meta line.
  - Mobile condensed list rows wrapped metadata too aggressively.
  - Inner/outer list spacing felt uneven between cards.
- Fixes applied:
  - `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/PostMetaBar.js`
  - Added `authorDateInline` prop to support inline `by <username> at <time>` rendering in shared meta.
  - Suppressed the secondary date row when `authorDateInline` is enabled to avoid duplicate timestamps.
  - Tightened condensed mobile metadata row flex behavior.
  - `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/feed/page.js`
  - Enabled `authorDateInline` for event items.
  - Removed duplicate feed event timestamp block from the event-info row.
  - `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/events/EventsClient.js`
  - Enabled `authorDateInline` for condensed ("More") event cards.
  - `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/globals.css`
  - Reduced tight-list gap (`.list.list--tight`) for denser vertical rhythm.
  - Reduced `.list-item` paddings and heading bottom margin for more even card spacing.
  - Updated mobile meta wrapping rules for condensed stats to reduce unnecessary line breaks.
  - Aligned `.event-info-row` to `flex-start` on mobile instead of centering.
- Validation:
  - `npm run lint` passed.
  - `npm run build` passed (`next build`, compile/static generation successful).
