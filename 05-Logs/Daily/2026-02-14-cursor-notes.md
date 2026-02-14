# Cursor Notes - 2026-02-14

## Tasks
- [x] Refactor `PostActionMenu` to use `editModal` prop for managed modal state.
- [x] Migrate several `page.js` files to the new `editModal` pattern.
- [x] Fix serializability issues (BigInt, params/searchParams awaiting) for Next.js 15 compatibility.
- [x] Complete refactoring for remaining detail pages (Memories, Lore, Lore & Memories, Bugs).
- [x] Verify `src/app/music/[id]/page.js` redundant panel removal.

## Changes
- Modified `src/components/PostActionMenu.js` to support `editModal` and `onOpen`.
- Updated `src/app/events/[id]/page.js`
- Updated `src/app/devlog/[id]/page.js` (Added serialization)
- Updated `src/app/art/[id]/page.js` (Added serialization)
- Updated `src/app/announcements/[id]/page.js`
- Updated `src/app/projects/[id]/page.js` (Added serialization)
- Updated `src/app/lobby/[id]/page.js` (Added serialization and debug logs)
- Updated `src/app/music/[id]/page.js` (Added serialization)
- Updated `src/app/rant/[id]/page.js`
- Updated `src/app/nostalgia/[id]/page.js`

## Notes
- Created `05-Logs/Development/edit-modal-refactoring.md` for Codex/other agents to follow the pattern.
- Serializability fixes are crucial for Next.js 15 to avoid BigInt errors when passing data to client components.
- The `PostActionMenu` now manages the modal visibility state internally, reducing the need for manual `style={{ display: 'none' }}` toggling via ID.
