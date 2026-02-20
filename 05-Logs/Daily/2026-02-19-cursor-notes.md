# Daily Log - 2026-02-19 - Feed layout tightening

## Single-post section previews (mobile)

**Request:** Sections with only one post (e.g. Lore & Memories, Music, announcements, etc.) were taking up too much viewport on mobile; make previews more condensed so users can tell whether there's another post below or not. Keep scrollable previews, just make them less tall.

**Changes:**
- **All section list pages:** When the list has exactly one item, add class `list--single-post` to the list container. Applied in: Feed, Events, Art, Art-Nostalgia, Shitposts, Projects, Timeline (announcements), DevLog, Memories, Nostalgia, Lore, Lore & Memories, Rant, Bugs, Bugs-Rant, Forum (per-section: Announcements, Stickies, Threads), Music.
- **LoreMemoriesClient:** Reverted to always showing full scrollable body for latest; single-post shortening is done via CSS only.
- **MusicClient:** Reverted to always showing full embed + body for latest; single-post shortening is done via CSS only.
- **globals.css:** `.list--single-post` — `.post-body-scrollable` max-height 200px (was 400px), `.embed-frame` max-height 180px and min-height 100px; slightly tighter list-item padding on mobile (max-width 640px). Previews remain scrollable.

**Files touched:**
- `src/app/globals.css` — single-post rules (lines ~4888–4901).
- `src/app/feed/page.js` — `items.length === 1`.
- `src/app/forum/ForumClient.js` — `items.length === 1` in renderSection.
- `src/app/timeline/TimelineClient.js` — `updates.length === 1`.
- `src/app/events/EventsClient.js`, `src/app/music/MusicClient.js`, `src/app/projects/ProjectsClient.js`, `src/app/devlog/DevLogClient.js`.
- `src/app/lore-memories/LoreMemoriesClient.js`, `src/app/lore/LoreClient.js`, `src/app/memories/MemoriesClient.js`, `src/app/nostalgia/NostalgiaClient.js`.
- `src/app/art/ArtClient.js`, `src/app/art-nostalgia/ArtNostalgiaClient.js`, `src/app/shitposts/ShitpostsClient.js`, `src/app/rant/RantClient.js`, `src/app/bugs/BugsClient.js`, `src/app/bugs-rant/BugsRantClient.js`.

**Double-check (verified):**
- Grep for `list--single-post`: 16 usages (1 in globals.css for the three rule blocks, 15 in app — feed, forum, timeline, events, music, lore-memories, lore, memories, nostalgia, devlog, projects, art, art-nostalgia, shitposts, rant, bugs, bugs-rant). Every section list that uses `list list--tight` and has a single-item case now adds the class when length === 1.
- LoreMemoriesClient: no getExcerpt/excerptOnly; latest always gets `condensed: false` and full `.post-body-scrollable`; `singlePostSection = posts.length === 1` drives the class only.
- MusicClient: latest always gets `condensed: false` (full embed + body); class from `posts.length === 1`.
- globals.css: only `.list--single-post` rules reference the class; no leftover `.post-body-excerpt` or line-clamp for excerpt. Base `.post-body-scrollable` stays 400px; override to 200px is scoped to `.list.list--single-post .list-item`.
- Feed/Forum: Feed has no scrollable body in list items (meta only), so single-post only affects padding. Forum sections use condensed items only; single-post affects padding when a subsection has one thread.

---

## Request
- Feed cards still "messed up" / "poor throw": inconsistent vertical spacing, last-activity row adding height, possible text spill into next card.
- Make feed list tighter and more consistent.

## Files updated
- `src/app/globals.css`

## Implementation

1. **Overflow containment**  
   `.list.list--tight .list-item { overflow: hidden; }` so card content cannot spill into the next item.

2. **Tighter padding (feed only)**  
   - Base: `.list.list--tight .list-item { padding: 3px 10px 4px; }`  
   - Tablet (media that uses 5px 10px): override to `3px 10px 4px` for `.list.list--tight .list-item`  
   - Desktop (min-width 1025px, 6px 10px): same override so feed stays `3px 10px 4px`  
   - Mobile unchanged: already `3px 8px 4px` for `.list .list-item` / `.list.list--tight .list-item`

3. **Tighter post-meta in feed**  
   - `.list.list--tight .post-meta { gap: 0; }`  
   - `.list.list--tight .post-meta-row2, .list.list--tight .post-meta-row3 { line-height: 1.2; }`

4. **Single meta row on wider viewports**  
   From 480px up, feed post-meta uses a 2-column grid: row 1 = title + stats (full width), row 2 = by-line (left) + last activity (right) on one row. Avoids extra vertical row from "Last activity by..." and reduces the empty left-side "throw."

## Verification
- Lint: no errors on `globals.css`.

## Notes
- Feed-only; other lists (e.g. lobby, devlog) keep existing padding.  
- Event cards: event details (row 2) and last activity (row 3) share the same grid row on >= 480px (details left, last activity right).

---

## Section header layout (section-intro)

**Request:** Unnecessary padding at the bottom of section headers; equal top and bottom padding for section title + description; section descriptions must wrap before touching buttons—buttons get their own space, text wraps in rows underneath.

**Changes in `src/app/globals.css`:**

1. **Single layout for all viewports**  
   Section intro now uses a 2-row grid everywhere: row 1 = title (left) + actions (right), row 2 = description (full width). Description never sits beside or under the button; it always wraps into rows below the button row. Implemented via `.section-intro` with `grid-template-columns: 1fr auto`, `grid-template-rows: auto auto`, and `.section-intro__meta` using `subgrid` so `__title` is (1,1), `__desc` is (1/-1, 2), `__actions` is (2, 1) with `z-index: 1`.

2. **Equal top/bottom padding**  
   `.section-intro { padding-block: 8px; }` so the section header block has the same padding above and below.

3. **Removed extra bottom padding**  
   The `@media (max-width: 600px)` block no longer sets `padding-bottom: 12px`; the shared `padding-block` handles vertical spacing.

4. **Removed 768px override**  
   The `@media (max-width: 768px)` override that set `grid-template-columns: minmax(0, min(1fr, 72ch)) auto` was removed so the 2-row layout (title+button row, description row) applies at all widths.

**Scope:** All section-intro pages (Feed, Music, Events, Art, Art & Nostalgia, Shitposts, Projects, Timeline, Dev log, Memories, Lore, Lore Memories, Rant, Bugs & Rants, Bugs, Forum).

**Follow-up (same day):** Double-check for compactness and buttons:
- Tightened spacing: `padding-block: 6px`, row `gap: 4px 10px`; `__actions` gap 8px; `min-width: 0` on `__actions` so it doesn’t force width.
- At ≤600px: `__actions` use `flex-direction: column; align-items: flex-end` so “Show hidden” and “New Post” stack in a column, right-aligned, and don’t squeeze.
- At ≤520px: buttons use `white-space: nowrap`, `max-width: none`, `padding: 4px 10px`, `font-size: 12px` so labels don’t wrap or get cut off when stacked. Description text remains full-width on row 2 and never overlaps buttons.

**Fix for button overlapping text:** Subgrid was causing the description to overlap the button in some browsers. Switched to a layout without subgrid: `__meta` now occupies **column 1 only** (`grid-column: 1; grid-row: 1 / -1`) with an internal 2-row grid (title row 1, desc row 2). `__actions` stays in column 2 row 1. So row 1 = [title | button], row 2 = [description | empty]. The description is confined to the left column and can never overlap the button; no subgrid required.

---

## Condensed view: fixed row order (title, by, stats, last activity)

**Request:** When the viewport is condensed, post cards should always use this order: Row 1 = post title; Row 2 = by information (author + date); Row 3 = view count and like count (right side); Row 4 = last activity (right side). Avoid wrapping that puts stats or last activity on the wrong row or alignment.

**Files updated**
- `src/components/PostMetaBar.js`
- `src/app/globals.css`

**Implementation**

1. **PostMetaBar DOM order**  
   Rows are now fixed in markup: row 1 = title only; row 2 = by (or custom, e.g. events); row 3 = stats (views, replies, likes); row 4 = last activity. Stats and last activity are no longer inside row 1 or row 2.

2. **Condensed (default, &lt; 641px)**  
   `.post-meta` is a single column. Rows 3 and 4 use `justify-content: flex-end` so stats and last activity are right-aligned on their own rows. Order is always 1 → 2 → 3 → 4.

3. **Wide (≥ 641px)**  
   2-row grid for all cards (title+stats, by+last activity; events: event details+last activity on line 2).

4. **Global**  
   Applies everywhere PostMetaBar is used (feed, devlog, events, lobby, lore, etc.). Mobile overrides for `margin-top: 0` extended to `.post-meta-row4`.

**Verification**
- Lint clean on `PostMetaBar.js` and `globals.css`.

**Checklist for manual check**
- [ ] **Condensed (e.g. 360px):** Row 1 = title (smaller font); Row 2 = by (left) + views/replies/likes (right) on same line; Row 3 = Last activity (right). Titles 13px (feed) or 14px so more fit on one line.
- [ ] **Wide (e.g. 1024px+):** All cards = 2 lines (title+stats, by+last activity or event details+last activity).
- [ ] **Edge cases:** Post with 0 replies (no last activity row); post with hideStats (no stats row); event card – 4-row condensed, 2-row wide.
- [ ] **No spill:** Feed list items don’t let “Last activity” text overflow into the next card (list-item overflow: hidden).

**Events:**
- **Feed:** Event cards use `customRowsAfterTitle` so PostMetaBar row 2 = `event-row2`. Wide = 2 rows (title+stats, event details+last activity). Condensed = 4 stacked rows. Event-specific CSS (`.event-row2`, `.event-details-inline`, 640px stack) unchanged.
- **Events list page:** PostMetaBar has no custom row; `lastActivity={undefined}` so no row 4. Event date/attending live in a sibling `.event-info-row` below PostMetaBar. Layout unchanged.

**Follow-up: condensed by + stats on one row; smaller titles**
- **Condensed grid:** At max-width 640px, `.post-meta` now uses a 3-row grid: row 1 = title (full width); row 2 = by (left) + stats (right) on the same line; row 3 = last activity (full width, right-aligned). View count no longer forced to its own row when it can sit with the byline.
- **Title font size:** In condensed view, `.list-item h3` = 14px; `.list.list--tight .list-item h3` = 13px so more host titles fit on one line and cause fewer wrapping problems.

---

## Development page viewport / layout fix (all host types)

**Request:** Development page (and section pages) was putting content outside the viewport on some viewports (e.g. mobile emulation); fix so layout is consistent across all host types.

**Changes (globals.css):**
- **html, body:** `overflow-x: hidden` globally so no horizontal scroll from any viewport.
- **.site:** `min-width: 0`, `overflow-x: hidden` so the site container never grows past viewport or shows horizontal scroll.
- **main:** `min-width: 0`, `width: 100%` so main grid stays within the layout.
- **.card:** `min-width: 0`, `max-width: 100%` so cards (e.g. devlog, feed sections) never overflow their container.
- **.section-intro:** `min-width: 0`, `max-width: 100%` so section header grid can shrink on narrow viewports.
- **.list:** `min-width: 0`, `max-width: 100%` so list grids don't force width.
- **.list-item:** `min-width: 0`, `max-width: 100%` so list items stay within viewport.
- **.post-body:** `max-width: 100%`; **.list-item .post-body, .list-item .post-body-scrollable:** `min-width: 0`, `max-width: 100%` so markdown/embeds don't push layout out.

**Files touched:** `src/app/globals.css`
