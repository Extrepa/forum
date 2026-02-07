# 2026-02-07 admin move + media fixes

## Summary
- Fixed Admin > Media thumbnail rendering for mixed/legacy image key formats.
- Expanded Admin move destinations to include forum subsection moves (`General` <-> `Shitposts`).
- Added missing post-section destination `About` for post-to-post section moves.
- Added non-post -> post section moves (`Art`, `Nostalgia`, `Bugs`, `Rants`, `Lore`, `Memories`) from the same Admin move modal.
- Wired backend support for creating post destinations, migrating discussion into `post_comments`, and resolving redirects for moved `post` targets.

## Files changed
- `src/components/AdminConsole.js`
- `src/app/api/admin/move/route.js`
- `src/app/api/admin/posts/[id]/route.js`
- `src/app/admin/page.js`

## Commits
- `59fea57` Fix admin move destinations and media thumbnail rendering
- `59c9306` Add About as admin post move destination
- `de5cd4a` Enable moving admin content into post sections

## Production deployments
- Version `6c47f699-8cb9-450e-b836-51a451c06c22` (move destinations + media thumbnails)
- Version `0f37d604-ab79-480c-bcb3-cf632717df62` (About destination)
- Version `d8adce03-8f85-4a87-a606-12b0fb540c24` (non-post -> post section destinations)

## Verification completed
- `npm run lint` passes (no warnings/errors).
- Confirmed destination option lists in UI code:
  - Non-post move destinations include:
    - `General`, `Shitposts`, `Announcements`, `Events`, `Music`, `Projects`, `Development`
    - `Art`, `Nostalgia`, `Bugs`, `Rants`, `Lore`, `Memories` (via `post:<subtype>` mapping)
  - Post move destinations include:
    - `Art`, `Nostalgia`, `Bugs`, `Rants`, `Lore`, `Memories`, `About`
- Confirmed backend move API supports:
  - `forum_section` for `forum_thread` destination
  - `post_subtype` for `post` destination
  - discussion migration into `post_comments`
  - redirect resolution for moved `post` targets based on subtype path

## Notes / limits
- `About` is currently included for post-to-post section moves.
- Non-post move destinations intentionally do **not** include `post:about` at this time to avoid routing to a non-detail `about` destination path in the cross-content move flow.
- When moving content, the current source type is intentionally filtered out of destination options (e.g., moving a `dev_log` does not show `Development` as a destination).
