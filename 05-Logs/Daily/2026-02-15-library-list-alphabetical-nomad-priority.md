# Daily Log - 2026-02-15 - Library List Alphabetical + Nomad Priority

## Request
- Sort Library dropdown items alphabetically.
- If the signed-in user is a Drip Nomad, show `Nomads` at the top of the Library list.

## File Updated
- `src/components/SiteHeader.js`

## Implementation
- Updated `libraryLinks` in `SiteHeader` to:
  - Build the same source links as before (including conditional `Nomads` visibility for `admin` and `drip_nomad`).
  - Sort links by `label` using case-insensitive `localeCompare`.
  - When `user.role === 'drip_nomad'`, move `/nomads` to index `0` after sorting.

## Double-Check Performed
- Code-level verification in `libraryLinks`:
  - Confirmed alphabetical sort is applied to all visible items.
  - Confirmed `Nomads` is pinned to top only for `drip_nomad`.
  - Confirmed admins still see `Nomads`, but it remains in normal alphabetical position.
- Lint check:
  - `npm run lint -- src/components/SiteHeader.js` -> pass.

## Notes
- The workspace already had unrelated modified files before this change; no unrelated files were edited for this task.
