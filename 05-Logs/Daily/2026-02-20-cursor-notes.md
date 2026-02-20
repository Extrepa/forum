# Daily Log - 2026-02-20 - Post preview consistency and mini preview

## Request
- Post previews inconsistent across sections: unnecessary scrollbars, some previews too long or going outside the viewport, content "not quite in the box."
- Ensure a **mini preview** for the top / most recent / pinned post: **on mobile**, condensed and scrollable inside the card; **on larger viewports**, normal behavior so sections that were already fine (Events, Projects, General) stay that way.

## Root cause
- The first post on section list pages (devlog, lore-memories, events, projects, art, music, etc.) was rendering with `className="post-body"` only (no `post-body-scrollable`), so the first post body had **no max-height** and expanded to full content height. That caused:
  - Development (single long post) and Lore & Memories (long "The origin..." preview) to extend outside the viewport.
  - One very tall card and a page scrollbar even when a short "mini" preview was desired.
- Section lists used different effective heights: single-post had 200px cap via `.list--single-post .post-body-scrollable`, but the first post did not use that class, so the cap never applied to the first post.

## Changes

### 1. globals.css (lines ~5007–5032)
- **Larger viewports (desktop):** Section list previews use normal height so sections that were already fine (Events, Projects, etc.) stay that way: `.list.list--tight .list-item .post-body-scrollable` has `max-height: 400px`. Single-post sections keep a shorter cap: `.list.list--single-post .list-item .post-body-scrollable` has `max-height: 200px` so one post doesn’t dominate and you can see there’s nothing below.
- **Mobile only (≤640px):** Condensed mini preview that you can scroll: `.list.list--tight .list-item .post-body-scrollable` gets `max-height: min(38vh, 260px)`; single-post stays at `200px`. This fixes overflow on small viewports (e.g. Development, Lore) without changing desktop behavior for sections that were already in line.

### 2. Section clients: first post uses scrollable container
For the **first** (top / most recent) post only, the body/description/details block was changed from `className="post-body"` to `className="post-body post-body-scrollable"`. The same CSS caps then apply (400px desktop, 200px/260px mobile); inner scroll appears when content exceeds the cap.

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
- **Mobile:** Condensed mini preview (min(38vh, 260px) or 200px single-post) with inner scroll; content in box; Development/Lore overflow fixed.
- **Larger viewports:** 400px for section lists, 200px single-post; sections that were already fine (Events, Projects) unchanged.
- First post everywhere uses `post-body-scrollable`, so no full-height first post spilling off viewport.

## Verification
- Grep `post-body post-body-scrollable` in `src/app`: 14 client files.
- Section-list caps live in `globals.css` (`.list.list--tight`, `.list.list--single-post`, and the `@media (max-width: 640px)` block).
