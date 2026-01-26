# View Count System Documentation

## Overview

View counts are **per-post** - each individual post has its own view count stored in the database. Views are tracked separately for each content type and each specific post ID.

## Database Schema

Each content type table has a `views` column that stores the count for that specific post:

- `dev_logs.views` - View count for each dev log post
- `music_posts.views` - View count for each music post
- `events.views` - View count for each event
- `projects.views` - View count for each project
- `posts.views` - View count for each post (Lore, Memories, Art, Bugs, Rant, Nostalgia)
- `timeline_updates.views` - View count for each announcement
- `forum_threads.views` - View count for each forum thread

**Migration:** `0031_add_view_counts.sql` added the `views` column to all tables.

## How Views Are Counted

### 1. Detail Page Views (ViewTracker Component)

**Location:** `src/components/ViewTracker.js`

When a user visits a detail page (e.g., `/devlog/[id]`, `/music/[id]`), the `ViewTracker` component automatically increments the view count for that specific post.

**How it works:**
- Component receives `contentType` (e.g., `'devlog'`) and `contentId` (the post ID)
- On mount, calls `/api/{contentType}/{contentId}/view`
- Each post ID gets its own view count incremented

**Example:**
```jsx
<ViewTracker contentType="devlog" contentId="abc123" />
// Calls: POST /api/devlog/abc123/view
// Updates: dev_logs.views WHERE id = 'abc123'
```

### 2. Scroll-to-Bottom Views (Development Latest Post)

**Location:** `src/app/devlog/DevLogClient.js`

On the development list page (`/devlog`), when a user scrolls to the bottom of the **latest post** (first post in the list), it automatically counts as a view for that specific post.

**How it works:**
- Gets the latest post ID: `const latestPostId = logs[0].id`
- Detects when user scrolls to bottom of that post's content
- Calls `/api/devlog/{latestPostId}/view` for that specific post
- Only counts once per page load (uses state to prevent duplicates)

**Important:** This only tracks the **latest post** (index 0), not other posts on the page.

## API Endpoints

All view endpoints follow the pattern: `/api/{contentType}/{id}/view`

### Available Endpoints:
- `/api/devlog/[id]/view` - Increments `dev_logs.views WHERE id = ?`
- `/api/music/[id]/view` - Increments `music_posts.views WHERE id = ?`
- `/api/events/[id]/view` - Increments `events.views WHERE id = ?`
- `/api/projects/[id]/view` - Increments `projects.views WHERE id = ?`
- `/api/posts/[id]/view` - Increments `posts.views WHERE id = ?`
- `/api/timeline/[id]/view` - Increments `timeline_updates.views WHERE id = ?`
- `/api/forum/[id]/view` - Increments `forum_threads.views WHERE id = ?`

### Implementation Pattern:

```javascript
export async function POST(request, { params }) {
  const db = await getDb();
  const { id } = await params; // Next.js 15: params is a Promise
  
  try {
    await db
      .prepare('UPDATE {table_name} SET views = views + 1 WHERE id = ?')
      .bind(id)
      .run();
  } catch (e) {
    // Silently fail if views column doesn't exist yet
  }
  
  return NextResponse.json({ ok: true });
}
```

**Key Points:**
- Uses `WHERE id = ?` to target the specific post
- Atomic increment: `views = views + 1`
- Each post ID is tracked independently
- No user tracking - views are anonymous and aggregate

## View Count Display

View counts are displayed in:
- List pages (devlog, music, events, projects, etc.)
- Detail pages
- Feed page
- PostMetaBar component

**Query Pattern:**
```sql
SELECT 
  ...,
  COALESCE(dev_logs.views, 0) AS views,
  ...
FROM dev_logs
WHERE id = ?
```

Each post shows its own view count from its own `views` column.

## Important Notes

1. **Per-Post Tracking:** Each post has its own view count. Viewing Post A does not affect Post B's count.

2. **No User Tracking:** Views are anonymous and aggregate. We don't track which users viewed which posts - just the total count.

3. **Multiple View Methods:** A post can get views from:
   - Visiting the detail page (ViewTracker)
   - Scrolling to bottom on list page (devlog latest only)
   - Both methods increment the same counter for that post

4. **Idempotent:** Calling the view endpoint multiple times will increment multiple times. Client-side state prevents duplicate counts within a single page session, but refreshing the page will allow another view.

5. **No Deduplication:** If the same user views a post multiple times, each view counts separately (no "unique views" tracking).

## Example Flow

1. User visits `/devlog` (list page)
2. Latest post is "Post ABC" (id: `abc123`)
3. User scrolls to bottom of Post ABC's content
4. System calls: `POST /api/devlog/abc123/view`
5. Database: `UPDATE dev_logs SET views = views + 1 WHERE id = 'abc123'`
6. Post ABC's view count increases by 1
7. Other posts' view counts are unaffected

If user then clicks into Post ABC's detail page:
1. `ViewTracker` component mounts with `contentId="abc123"`
2. System calls: `POST /api/devlog/abc123/view` again
3. Post ABC's view count increases by 1 more (now +2 total from this session)

## Reset Migrations

View counts can be reset using migrations:
- `0036_reset_test_view_counts.sql` - Partial reset (dev_logs, lore/memories)
- `0037_reset_all_view_counts.sql` - Full reset (all content types)
- `0038_reset_all_view_counts_again.sql` - Full reset (second time)

These migrations set all `views = 0` for the specified tables.
