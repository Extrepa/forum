# 2026-02-06 Errl message surface removal

## Summary
- Removed the top-of-page Errl greeting/message card from Home.
- Removed the top-of-page Errl greeting/message card from Feed.
- Simplified notification panel copy to remove the custom greeting and themed message text.
- Removed now-unused hourly greeting/template helpers and related component code.
- Cleaned a stale mobile notification popover selector in global styles.

## Files changed
- `src/app/page.js`
- `src/app/feed/page.js`
- `src/components/NotificationsMenu.js`
- `src/app/globals.css`
- `src/lib/forum-texts/index.js`
- `src/components/HomeWelcome.js` (deleted)
- `src/lib/forum-texts/variations.js` (deleted)

## Verification
- Searched for removed greeting/message code paths and legacy strings:
  - `HomeWelcome`
  - `getTimeBasedGreetingTemplate`
  - `renderTemplateParts`
  - legacy notification copy strings
  - no remaining matches in `src/`.
- `npm run lint` passes with no warnings/errors.
- `npm run build` succeeds on Next.js 15.5.9.

## Branch
- `codex/fix-remove-errl-messages`
