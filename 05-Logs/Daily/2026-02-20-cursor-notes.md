# Daily Log - 2026-02-20 - Post preview consistency and mini preview

## Request
- Post previews inconsistent across sections: unnecessary scrollbars, some previews too long or going outside the viewport, content "not quite in the box."
- Ensure a **mini preview** for the top / most recent / pinned post: **on mobile**, condensed and clipped (no inner scrollbar); **on larger viewports**, normal height so sections that were already fine (Events, Projects, General) stay that way. Inner scrollbars only on the full post page, not in section title/description or list previews.

## Root cause
- The first post on section list pages (devlog, lore-memories, events, projects, art, music, etc.) was rendering with `className="post-body"` only (no `post-body-scrollable`), so the first post body had **no max-height** and expanded to full content height. That caused:
  - Development (single long post) and Lore & Memories (long "The origin..." preview) to extend outside the viewport.
  - One very tall card and a page scrollbar even when a short "mini" preview was desired.
- Section lists used different effective heights: single-post had 200px cap via `.list--single-post .post-body-scrollable`, but the first post did not use that class, so the cap never applied to the first post.

## Changes

### 1. globals.css (lines ~5012–5032)
- **Larger viewports (desktop):** Section list previews use normal height so sections that were already fine (Events, Projects, etc.) stay that way: `.list.list--tight .list-item .post-body-scrollable` has `max-height: 400px`. Single-post sections keep a shorter cap: `.list.list--single-post .list-item .post-body-scrollable` has `max-height: 200px` so one post doesn’t dominate and you can see there’s nothing below.
- **Mobile only (≤640px):** Condensed mini preview, clipped (no inner scrollbar): `.list.list--tight .list-item .post-body-scrollable` gets `max-height: min(38vh, 260px)`; single-post stays at `200px`. This fixes overflow on small viewports (e.g. Development, Lore) without changing desktop behavior for sections that were already in line.

### 2. Section clients: first post uses scrollable container
For the **first** (top / most recent) post only, the body/description/details block was changed from `className="post-body"` to `className="post-body post-body-scrollable"`. The same CSS caps apply; in section lists the override uses `overflow: hidden` so the preview is **clipped with no inner scrollbar** (scroll only on full post page).

**Files updated (14):**

| File | Block |
|------|--------|
| `src/app/devlog/DevLogClient.js` | `row.bodyHtml` (+ `suppressHydrationWarning`) |
| `src/app/lore-memories/LoreMemoriesClient.js` | `p.bodyHtml` |
| `src/app/lore/LoreClient.js` | `p.bodyHtml` |
| `src/app/memories/MemoriesClient.js` | `p.bodyHtml` |
| `src/app/nostalgia/NostalgiaClient.js` | `p.bodyHtml` |
| `src/app/art/ArtClient.js` | `p.bodyHtml` |
| `src/app/art-nostalgia/ArtNostalgiaClient.js` | `p.bodyHtml` |
| `src/app/rant/RantClient.js` | `p.bodyHtml` |
| `src/app/bugs/BugsClient.js` | `p.bodyHtml` |
| `src/app/bugs-rant/BugsRantClient.js` | `p.bodyHtml` |
| `src/app/events/EventsClient.js` | `row.detailsHtml` |
| `src/app/projects/ProjectsClient.js` | `row.descriptionHtml` |
| `src/app/music/MusicClient.js` | `row.bodyHtml` |
| `src/app/timeline/TimelineClient.js` | `row.bodyHtml` |

**Not changed:**
- **Feed** (`src/app/feed/page.js`): list items meta only.
- **Forum** (`src/app/forum/ForumClient.js`): per-section lists all condensed (truncated text).
- **Shitposts** (`src/app/shitposts/ShitpostsClient.js`): truncated text in `<p>`, no full body block.

### 3. View tracking
- DevLogClient, LoreClient, MemoriesClient use `latestPostWrapper?.querySelector('.post-body')`. First post body still has class `post-body`, so selectors still match.

## Result
- **Mobile:** Condensed mini preview (min(38vh, 260px) or 200px single-post), **clipped, no inner scrollbar**; content in box; Development/Lore overflow fixed.
- **Larger viewports:** 400px for section lists, 200px single-post; sections that were already fine (Events, Projects) unchanged.
- First post everywhere uses `post-body-scrollable`, so no full-height first post spilling off viewport.
- **Follow-up:** Section list previews and section intro have no inner scrollbars; inner scroll only on full post page.

## Verification
- Grep `post-body post-body-scrollable` in `src/app`: 14 client files (devlog, lore-memories, lore, memories, nostalgia, art, art-nostalgia, rant, bugs, bugs-rant, events, projects, music, timeline).
- Section-list preview behavior is controlled in one place in `globals.css`; section header scrollbar in one rule.

---

## Follow-up: No inner scrollbars except on full post (2026-02-20)

**Request:** No scrollbars in section title/description; no inner scrollbars anywhere except the large (full) post preview. Then simplify: one rule per concern.

**Changes (globals.css), simplified:**
1. **Section list previews:** `.list.list--tight .list-item .post-body-scrollable` — `max-height` + `overflow: hidden` (one block with single-post and mobile overrides). List previews are capped and clipped; no inner scrollbar.
2. **Section header:** `.card:has(> .section-intro):not(:has(> .list))` — `overflow: hidden` only. No separate rules on section-intro children.
3. Removed: redundant mobile single-post max-height (already 200px), redundant overflow on section-intro/__meta/__title/__desc.

---

## Double-check / Reference (2026-02-20)

**Where things are controlled (single source each):**

| What | Where (globals.css) | What it does |
|------|---------------------|--------------|
| Section list preview: no inner scrollbar | ~5025–5035 | `.list .list-item .post-body-scrollable` overflow-y/x hidden; `.list.list--tight` max-height 400px; `.list.list--single-post` max-height 200px; mobile 640px: tight gets min(38vh, 260px). |
| Section header no scrollbar | ~2517–2519 | `.card:has(> .section-intro):not(:has(> .list))`: overflow hidden. |
| Base scrollable (full post if used) | ~5266–5274 | `.post-body-scrollable`: max-height 400px, overflow-y auto. Overridden by .list .list-item rule above for all section list previews. |
| Small viewport overflow (horizontal + no inner vertical) | ~3181–3225 | Single 640px block: html/body/site/main/card containment; footer tagline hover; list-item and post-meta max-width/min-width; main and .card overflow-y: visible. |

**Client usage:** First post body/details in section lists use class `post-body post-body-scrollable` inside list items, so the `.list .list-item .post-body-scrollable` rule applies and no inner scrollbar is shown. Full post pages use `post-body` only (no post-body-scrollable), so they scroll with the document.

---

## Small viewport inner scrollbars removed (2026-02-20)

**Request:** Fix unnecessary inner scrollbars on small viewports (e.g. 430px); overflow and consistency issues between post previews and full post; organize global CSS so the page scrolls as one document.

**Root cause:** `.site` had `height: 100%` and `main` had `flex: 1` and `height: 100%`, creating a height chain. With body only having `min-height: 100vh`, the main content area could get a constrained height and show an inner scrollbar even when content didn’t need it. `.card` had `height: 100%`, stretching in the grid and contributing to the effect. List previews with `.list--single-post` used the base `.post-body-scrollable` (overflow-y: auto), so they showed inner scrollbars; only `.list--tight` had overflow: hidden.

**Changes (globals.css):**
1. **`.site`** — Removed `height: 100%`. Site no longer forces a full-height column; content dictates height and the document scrolls as one page.
2. **`main`** — Removed `flex: 1` and `height: 100%`. Main is content-sized; no inner scrollbar on the main content area.
3. **`.card`** — Removed `height: 100%`. Cards size to content; no stretching that could create overflow/scroll.
4. **List previews** — `.list.list--single-post .list-item .post-body-scrollable` now gets `overflow: hidden` (same as list--tight), so single-post section previews are clipped with no inner scrollbar. Kept max-height: 200px for single-post and existing tight/single-post/mobile rules.

**Result:** One document scroll on small viewports; no unnecessary inner scrollbars on the main content, section cards, or list previews (tight or single-post). Full post pages still use `post-body` without `post-body-scrollable`, so they have no max-height and scroll with the page.

**Follow-up (vertical + horizontal):** User clarified focus on the vertical scrollbar and horizontal overflow. Horizontal overflow fixes (globals.css):
- `.site`: `max-width: min(var(--max-width), 100%)` so the site never exceeds viewport.
- Small viewports (≤640px): `html, body` get `max-width: 100%`; `.card`, `.list`, `.section-intro`, `.footer-grid`, `.footer-tagline-bar` get `max-width: 100%`, `min-width: 0`, `overflow-x: hidden`. Footer tagline hover no longer forces width: `.footer-tagline-bar:hover .footer-tagline-phrase-2 { min-width: 0 }` in that block so the "Errrrrrrrrrrrrl" hover doesn’t cause horizontal scroll.
- **Simplified:** Reverted to minimal: .site stays `var(--max-width)`; 640px block only has html/body + .site + main + footer-tagline hover override; removed blanket .card/.list/etc. and .footer-tagline-bar base extras.

---

## Double-check and reference (2026-02-20, final)

All scroll/overflow fixes live in `src/app/globals.css`. Single source for each concern.

### Layout: no height chain (document scrolls as one page)

| Selector | Location | What |
|----------|----------|------|
| `.site` | ~132 | No `height: 100%`. `max-width: var(--max-width)`; `overflow-x: hidden`. |
| `main` | ~2389 | No `flex: 1` or `height: 100%`. `overflow-y: visible`; `overflow-x: hidden`. |
| `.card` | ~2399 | No `height: 100%`. `overflow-x: hidden` only (vertical: visible). |

### Small viewports only (media (max-width: 640px), ~3181)

| Purpose | Rules in that block |
|---------|---------------------|
| Horizontal containment | `html, body { overflow-x: hidden; width: 100%; max-width: 100% }`. `.site` same + `max-width: 100%`. `main { min-width: 0; overflow-x: hidden; overflow-y: visible }`. `.card { overflow-y: visible }`. |
| Footer tagline | `.footer-tagline-bar:hover .footer-tagline-phrase-2 { min-width: 0 }` so hover does not force horizontal scroll. |
| List/post-meta containment | `.list-item { max-width: 100% }`. `.list-item .post-meta { min-width: 0; max-width: 100% }`. Title row/link/h3 truncation (min-width: 0, overflow: hidden, text-overflow: ellipsis). |
| Feed | `.feed-header-desc { min-width: 0 !important }`. `.list, .list-item { min-width: 0 }`. |

### List previews: no inner vertical scrollbar

| Selector | Location | What |
|----------|----------|------|
| `.list .list-item .post-body-scrollable` | ~5026 | `overflow-y: hidden; overflow-x: hidden` so any section list preview never shows inner scrollbar. |
| `.list.list--tight .list-item .post-body-scrollable` | ~5030 | `max-height: 400px` (mobile: `min(38vh, 260px)` in nested @media). |
| `.list.list--single-post .list-item .post-body-scrollable` | ~5032 | `max-height: 200px`. |

Base `.post-body-scrollable` (~5266) keeps `max-height: 400px; overflow-y: auto` for contexts outside `.list .list-item` (e.g. full post if ever used there). Section list clients use `post-body post-body-scrollable` inside list items, so the `.list .list-item` override always applies.

### Verification

- No `height: 100%` on .site, main, or .card.
- 640px block: one place for mobile overflow; no duplicate or blanket rules on .card/.list/.section-intro/.footer-grid.
- List preview scrollbar: only `.list .list-item .post-body-scrollable` and the tight/single-post max-heights; no inner vertical scroll on section pages.
