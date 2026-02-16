# Daily Log - 2026-02-16 - Section Intro Small Viewport: Compact Row + Divider

## Request
- On small viewports, reduce the height of the section header card (e.g. Events, General/lobby).
- Put the section title, description, and "Add Post" / "Add Event" button in the same rows area: title and button on the first row, description wrapping below.
- Add a middle line (divider) between the section header and the content below.
- Description text should wrap to fit the compact setup.

## Files Changed
- `src/app/globals.css` — `@media (max-width: 600px)` block for `.section-intro` and children.

## Implementation (verified)

### Layout (≤600px)
- **`.section-intro`**
  - Grid: `grid-template-columns: 1fr auto; grid-template-rows: auto auto;` so we have two columns (title/desc area | actions) and two rows.
  - `gap: 6px 10px`, `align-items: start`.
  - `padding-bottom: 12px` and `border-bottom: 1px solid var(--border)` to create the divider line between the header and the list below.
- **`.section-intro__meta`**
  - Placed in column 1, spanning both rows: `grid-column: 1; grid-row: 1 / -1`.
  - Internal grid: `grid-template-rows: auto auto;` so title is first row, description second row.
  - `min-width: 0` so the description can shrink and wrap in the grid.
- **`.section-intro__desc`**
  - `min-width: 0` so it wraps correctly within the meta column.
- **`.section-intro__actions`**
  - Placed in column 2, row 1: `grid-column: 2; grid-row: 1;` so the Add Post/Add Event button sits on the same row as the title.
  - `justify-self: end; align-self: start;` so it stays top-right.

Result: Row 1 = [Title (left) | Button (right)], Row 2 = [Description (full width of first column, wraps)]. Then the border line, then the list.

### Divider
- The bottom border uses `var(--border)` (theme border color). No new CSS variables.

### Scope
Section intro is used on: Feed, Music, Events, Art, Art & Nostalgia, Shitposts, Projects, Timeline (Announcements), Dev log, Memories, Lore, Lore Memories, Rant, Bugs & Rants, Bugs, Forum (lobby). All use the same `.section-intro` / `__meta` / `__title` / `__desc` / `__actions` structure, so this behavior applies everywhere on viewports ≤600px.

### Interaction with 520px rules
The existing `@media (max-width: 520px)` block only adjusts `.section-intro__actions` button sizing (min-height, padding, font-size, `max-width: 10ch`, etc.). It does not change grid placement. Layout remains: title + button on first row, description below. If "Add Event" or "New Post" feels cramped at very narrow widths due to `max-width: 10ch`, consider relaxing that or using a smaller breakpoint; not changed in this pass.

## Verification
- **CSS:** Line numbers in `globals.css` for the 600px block: ~8929–8959. Structure matches intent: 2×2 grid, meta spans col 1 both rows with internal title/desc rows, actions in col 2 row 1, border-bottom on section-intro.
- **No HTML changes:** All section pages use the same markup (section-intro > __meta > title + __desc, and __actions sibling); layout is CSS-only.
- **Lint:** No new linter issues introduced.

## Double-check summary
| Check | Result |
|-------|--------|
| Title and button on same row at ≤600px | Yes — __meta col 1, __actions col 2 row 1 |
| Description on second row, wrapping | Yes — __meta has grid-template-rows auto auto; __desc has min-width: 0 |
| Divider line below header | Yes — border-bottom on .section-intro with padding-bottom |
| Theme border variable | Yes — var(--border) |
| 520px button rules still apply | Yes — only action button styling; grid unchanged |
| Scope (all section-intro pages) | Yes — single class set, no page-specific overrides |
