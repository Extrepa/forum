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

## Header Verification Pass (same day)
- Confirmed signed-in header keeps three zones stable:
  - left brand
  - centered `Home` / `Feed` / `Library`
  - right-side actions (`Search`, notifications bell, kebab)
- Confirmed library popout width is now content-driven in `SiteHeader`:
  - width is estimated from the longest visible library label
  - panel is clamped to viewport edge padding
- Confirmed search trigger exists again and toggles modal state:
  - Added explicit search icon button in header right actions
  - Opening search closes other menus (`Library`, notifications, kebab)
- Confirmed search icon size is reduced compared with bell/kebab in shared + mobile/signed-in rules.

### Verification commands
- `npm run lint` (pass)

### Follow-up visual check
- Validate in-browser at narrow widths that:
  - library panel does not over-expand
  - search icon remains visually smaller and aligned with bell/kebab
  - center nav stays centered as header width changes

## Runtime Error Fix
- Issue reported in production bundle:
  - `ReferenceError: Cannot access 'Ls' before initialization`
- Root cause:
  - `libraryLinks` / `filteredLibraryLinks` were referenced by a `useEffect` dependency array before those `const` values were initialized in component order.
- Fix:
  - Moved both memoized values above the dependent `useEffect` in `src/components/SiteHeader.js`.
- Verification:
  - `npm run lint` (pass)

## Header Search Placement Correction
- Removed header-right search icon from `SiteHeader`; only bell + kebab remain on the right.
- Repurposed the Library popout corner control as forum search:
  - click icon to reveal search input inside Library panel
  - submit routes to `/search?q=...`
  - closes Library/search panel after submit
- Removed section-filter behavior from Library list (list remains full; corner control is now forum search).
- Reworked corner control styling so it renders as a small visible search icon instead of a dark blob.
- Removed `Date.now()` usage from `SiteHeader` notification optimistic updates to avoid hydration warning in that component.
