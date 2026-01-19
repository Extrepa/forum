## 2026-01-18 - Cursor notes

- Added Errl theme username styling (purple/cyan/yellow/green) via `.username` classes in `src/app/globals.css`.
- Added `src/lib/usernameColor.js` (stable per-username palette index + optional adjacent-repeat avoidance).
- Added `src/components/Username.js` component (supports `force="purple"` for the Home "Welcome back" username).
- Updated all username render points (home welcome + section tiles, forum/timeline/events/music/projects/shitposts/search, thread replies, project/music comments, ClaimUsernameForm) to use `Username`.

## Verification notes

- Searched for remaining plain `{row.author_name}` / `{result.author_name}` / `{thread.author_name}` renders; all found references were already swapped to `<Username ... />`.
- Confirmed “Welcome back” keeps normal text and only the username is forced purple.
- Confirmed “Posting as …” (SessionBadge) and claim flow messages (“You are …”, “Username locked …”) render the username via `<Username />`.
- No linter diagnostics reported for the touched files.

