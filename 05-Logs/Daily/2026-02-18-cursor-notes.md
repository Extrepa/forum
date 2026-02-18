# Daily Log - 2026-02-18 - Cursor Notes

## Admin Console Overview: compact mobile layout (2026-02-18)

**Request:** Reduce scrolling on the Admin Console Overview tab on mobile; better use of space so more information is visible without scrolling.

**Changes (src/app/globals.css, inside @media (max-width: 640px)):**

1. **Stats row:** `.admin-stat-grid` becomes a horizontal scroll strip (flex, nowrap, overflow-x: auto, scroll-snap). Cards get `min-width: 88px`, `flex-shrink: 0`, smaller padding and font sizes. All 11 stat cards sit in one swipeable row instead of a 2-column grid that used several rows of vertical space.

2. **Recent admin actions + Latest threads:** `.admin-overview-feed-scroll` becomes a horizontal row: two panels side-by-side (each `min(48%, 200px)`), scroll horizontally to see the second. Each panel's list has `max-height: 160px`. Both sections visible in one row to reduce vertical scroll.

3. **System log preview (Overview only):** On mobile, inside `.admin-overview`: hide `.admin-system-log-controls` (User/Action type filters and Export/Clear buttons) and `.admin-system-log-archives`; limit `.admin-system-log-list` to `max-height: 72px` (~3 lines). Full controls and log remain available on the System Log tab via "Open tab".

**Files:** `src/app/globals.css` (admin 640px block).

**Verification:** In `globals.css` @media (max-width: 640px): `.admin-stat-grid` (flex, overflow-x auto, scroll-snap); `.admin-stat-grid .admin-stat-card` (min-width 88px, etc.); `.admin-overview-feed-scroll` (flex row, overflow-x auto); `.admin-overview .admin-panel--system-wide .admin-system-log-controls` (display none), `.admin-system-log-list` (max-height 72px). No JS changes for Overview.

---

## Admin Console Log tab: JS-driven mobile layout, less CSS (2026-02-18)

**Goal:** Condense Log tab on mobile into one at-a-glance view and keep CSS smaller by using JS to choose layout instead of many @media overrides.

**Approach:** On viewport <= 640px, render a single "at a glance" metrics grid (12 cells: 6 activity + 6 operational) and the system log; do not render the Network activity chart, legend, or separate Operational totals block. This avoids needing CSS to hide/reshape those blocks on mobile.

**Changes:**
- **AdminConsole.js:** Added `isMobile` state via `matchMedia('(max-width: 640px)')` and effect. When `activeTab === 'System Log'` and `isMobile`, render only `.admin-log-metrics-unified` (title line "Low X · Avg Y · High Z" + 4-column grid of 12 label/value cells) and the existing system log window. Otherwise render the full traffic card (chart, legend, operational) + log.
- **globals.css:** New block for `.admin-log-metrics-unified` and children (unified card, title, grid, cell, label, value). Removed from the 640px block the Log-tab-only overrides: `.admin-traffic-bars`, `.admin-traffic-chart`, `.admin-traffic-summary`, `.admin-traffic-legend`, `.admin-operational-grid`, `.admin-traffic-legend-item` (net reduction in CSS).

**Files:** `src/components/AdminConsole.js`, `src/app/globals.css`.

**Verification:** In AdminConsole.js: `isMobile` state + useEffect with matchMedia('(max-width: 640px)'); System Log branch uses `isMobile ? (admin-log-metrics-unified + log window) : (traffic card + log window)`. In globals.css: `.admin-log-metrics-unified` block (card, title, grid, cell, label, value); 640px block no longer contains `.admin-traffic-*` or `.admin-operational-grid` overrides.

---

## Account: Edit Profile tab title -> Profile Settings (2026-02-18)

- Renamed main page title on Edit Profile tab from "Edit Profile" to "Profile Settings" (white section title).
- **File:** `src/app/account/AccountTabsClient.js` — h2 with `section-title` now reads "Profile Settings". Tab label left as "Edit profile".

---

## Double-check: Feed layout + scroll/condensation (2026-02-18)

**Scope:** All work from this session: (1) Feed condensed layout (PostMetaBar three-row, event row 2 = by + event info only, last activity in row 3). (2) Scroll glitch mitigation and tighter spacing on mobile.

**Verification:**
- **PostMetaBar.js:** Structure and class names only; no inline layout (layout is in CSS). Row 1/2/3 structure and row2Content/custom unchanged. JSDoc states layout lives in CSS.
- **feed/page.js:** Event customRowsAfterTitle returns only `<div class="event-row2">` with byUser + event-row2-middle (eventInfo); lastActivity passed to PostMetaBar for row 3.
- **globals.css:** (a) Layout: .post-meta and .post-meta-row1 base layout; .post-meta-stats-top-right; .post-meta-last-activity-row; .event-row2. (b) Mobile 640px: .post-meta gap 0, .post-meta-row1 gap 4px, etc. now apply (no inline overrides). (c) Scroll: prefers-reduced-motion; .list-item backdrop-filter: none; list/list-item condensation.

**File refs:** PostMetaBar.js (lines 6–14 JSDoc, 77–118 layout). feed/page.js (588–659 customRowsAfterTitle). globals.css: 640px block 3187–3211 (backdrop-filter + condensation), 4785–4830 (PostMetaBar/event row), 8039–8044 (prefers-reduced-motion).

---

## PostMetaBar: CSS-only layout, no JS/CSS split (2026-02-18)

**Goal:** One source of truth for layout so we don’t keep fighting between two views (desktop vs mobile). Inline styles in the component had higher specificity than class selectors, so mobile overrides in CSS (e.g. `.post-meta { gap: 0 }`, `.post-meta-row1 { gap: 4px }`) were not applying.

**Approach:** Put all PostMetaBar layout and spacing in CSS; remove inline layout from the component. No JavaScript setup or viewport detection — media queries in globals.css handle both viewports.

**Changes:**

1. **src/app/globals.css**
   - **Base (around 4854+):** Added `.post-meta` (display flex, flex-direction column, gap 1px, min-width 0). Added `.post-meta-row1.post-meta-title-row` (display flex, flex-wrap wrap, align-items flex-start, gap 8px, min-width 0). Added `.post-meta-title-row:has(.post-meta-stats-top-right) > *:first-child` (flex 1 1 auto, min-width 0) so the title grows when stats are present. Expanded `.post-meta-stats-top-right` to include flex, display, justify-content, min-width (margin-left auto was already there).
   - Mobile (640px) overrides for `.post-meta` and `.post-meta-row1` now apply because there are no competing inline styles.

2. **src/components/PostMetaBar.js**
   - Removed all inline layout styles from the root div, row 1 div, title wrapper, and stats wrapper. Root and row 1 use className only. TitleElement keeps inline style only for the link case (textDecoration, color: inherit). JSDoc updated to state that layout lives in CSS.

**Result:** Single source of truth in globals.css for both viewports; mobile condensation (gap 0, gap 4px, etc.) works as intended. No JS-driven layout or extra classes needed.

---

## Feed / section lists: scroll glitch and condensation on mobile (2026-02-18)

**Issues:** (1) Glitchiness when scrolling the feed (and other section lists) on mobile — sometimes a large empty area appears. (2) Post cards on Feed and other sections (e.g. Dev) look too tall on mobile; not condensed enough.

**Likely causes of scroll glitch:**
- **Animated border** on every `.list-item` (`.list-item::before` with `neonChase`): continuous animation can increase repaints during scroll and contribute to jank.
- **`backdrop-filter: blur(10px)`** on `.list-item`: expensive on mobile and can cause compositing/position glitches when the browser is under load during scroll.

**Changes (globals.css):**

1. **Reduce motion / scroll jank**
   - **Lines 8039–8044:** `@media (prefers-reduced-motion: reduce)` — `.list-item::before { animation: none; }` so the neon border animation is disabled when the user prefers reduced motion (accessibility and fewer repaints).
   - **Inside `@media (max-width: 640px)` (lines 3187–3191):** `.list-item { backdrop-filter: none; }` so list cards no longer use blur on small viewports, reducing GPU work and potential scroll/position glitches.

2. **Tighter spacing on small viewports (condensation)**
   - **Inside same 640px block (lines 3192–3211):**
     - `.post-meta`: `gap: 0` (overrides component’s 1px).
     - `.post-meta-row1.post-meta-title-row`: `gap: 4px` (overrides row 1’s 8px).
     - `.post-meta-row2`: `gap: 2px 8px`.
     - `.post-meta-row3`: `margin-top: 0`.
     - `.list.list--tight`: `gap: 1px` (base is 2px at 4781).
     - `.list.list--tight .list-item, .list .list-item`: `padding: 3px 8px 4px` so all section list cards (Feed, Dev, Music, etc.) are more condensed.

**Note:** If the large blank area while scrolling persists, it can also be due to mobile browser behavior (e.g. dynamic URL bar changing viewport height). Consider testing with `height: 100dvh` on the main container or similar viewport fixes if needed.

---

## Feed page: condensed mobile layout (title, by, stats, last activity, events) (2026-02-18)

**Request:** Fix feed card layout on mobile so it stays condensed and consistent: title always row 1 (wraps), "by username at time" always row 2, view/reply/like counts in top right of row 1 (wrapping with title, right-aligned) or bottom right above last activity; last activity always final row bottom right; for events, event info in the row above last activity.

**Changes:**

1. **src/components/PostMetaBar.js**
   - **JSDoc (lines 6–14):** Layout described as row 1 = title + stats, row 2 = by/custom, row 3 = last activity when present.
   - **Row 1 (lines 94–105):** Title (left, wraps) + stats (top right) for all items. Stats wrapper has `flex: 0 1 auto`, `marginLeft: 'auto'` so they stay right when the row wraps.
   - **Row 2 (lines 107–110):** `row2Content` only (byUserAtTime or customRowsAfterTitle). No stats, no last activity.
   - **Row 3 (lines 112–117):** Rendered when `hasLastActivity`; contains `lastActivityEl` in `.post-meta-row3.post-meta-last-activity-row`.
   - Removed: statsInRow1/statsInRow2, row2HasActivity, row2Content with last-activity-second-line, and stats in row 2.

2. **src/app/feed/page.js**
   - **Event customRowsAfterTitle (lines 588–659):** Returns only `<div className="event-row2">` with byUser and event-row2-middle (eventInfo). Removed eventLastActivityEl and class `event-row2-with-activity`. Events still pass lastActivity/lastActivityBy etc. to PostMetaBar so row 3 shows when item has replies.

3. **src/app/globals.css**
   - **Lines 4785, 4809–4827:** PostMetaBar block comment; `.post-meta-stats-top-right { margin-left: auto; }`; `.post-meta-last-activity-row { margin-top: 0; }`; `.post-meta-row3` (flex, justify-content: flex-end).
   - **Lines 4830–4848:** Event row 2 comment updated; `.event-row2` and `.event-row2-middle` only (no last-activity inside). Removed `.post-meta-row2-with-activity`, `.post-meta-last-activity-second-line`, `.post-meta-stats-in-row2` (and 480px media query), `.event-row2-with-activity` and the 640px rule for last-activity-inline in event row.

**Result:** On all viewports: row 1 = title + stats (top right, wrap right-aligned); row 2 = by or by + event info; row 3 = last activity (bottom right) when present. Event info in row 2, last activity in row 3.

---

## Home section card: remove pink glow on tap/hover (2026-02-18)

**Request:** Remove the pink/neon glow that appears when tapping or hovering over a section card on the forum homepage (mobile and desktop).

**Cause:** Section cards use both `.list-item` and `.home-section-card`. The global `.list-item::after` rule (globals.css ~8081) applies the neon box-shadow (cyan + pink). The existing override targeted only `.home-section-card::after`, which has the same specificity as `.list-item::after`; the latter appears later in the file so it won.

**Change (globals.css):** Replaced the no-glow override with a more specific selector so it wins over `.list-item::after`:
- `.list-item.home-section-card::after` and same for `:hover`, `:focus-within`, `:active` — set `opacity: 0` and `box-shadow: none`.
- `:active` included so mobile tap doesn’t show the glow.

No JS changes. Existing "No hover/focus glow" comment kept and updated.

---

## Section intro: description full-width on small viewports (2026-02-18)

**Request:** On smaller viewports, use the space below the section buttons for the description so it doesn't wrap as much — title stays top-left, buttons top-right, description uses the full bottom row.

**Change (globals.css, @media (max-width: 600px), ~9033–9073):** Use subgrid so the description can span the full width on row 2.
- `.section-intro__meta`: `grid-column: 1 / -1; grid-row: 1 / -1` and `grid-template-columns: subgrid` so its children participate in the section-intro grid.
- `.section-intro__title`: `grid-column: 1; grid-row: 1`.
- `.section-intro__desc`: `grid-column: 1 / -1; grid-row: 2` so it occupies the full bottom row (including under the buttons).
- `.section-intro__actions`: added `z-index: 1` so it stays on top in (2,1).

No HTML changes. Applies to all section-intro pages (Feed, Music, Events, Dev log, Lore & Memories, etc.).

**Double-check / verification:**
- **Placement:** Row 1 = title (1,1) + actions (2,1); row 2 = description (1/-1, 2). __meta spans the full grid; subgrid gives __meta’s children the same column tracks so __desc can span both columns on row 2.
- **Base layout (>600px):** Unchanged. Base `.section-intro` / `__meta` / `__title` / `__desc` (globals.css ~2461–2485) do not set grid-column/row; only the 600px block adds those, so desktop/tablet behavior is unchanged.
- **520px block:** Only overrides `.section-intro__actions` gap and button sizing (min-height, padding, font-size, etc.). Does not change grid placement; full-width description layout is preserved.
- **Subgrid:** Uses `grid-template-columns: subgrid` only; rows are explicit `auto auto` inside __meta. Supported in current Chrome, Firefox, Safari. If older browsers must be supported, fallback would be to keep description in column 1 only (previous layout).
- **Lint:** No new linter issues.
