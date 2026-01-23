# Unread Tracking & NEW Indicator Implementation
**Date:** 2026-01-23  
**Feature:** NEW indicator that disappears after viewing posts/threads

## Overview
Implemented a comprehensive unread tracking system that shows a 🆕 indicator next to unread posts/threads on all section pages. The indicator automatically disappears after a user views the content.

## Database Changes

### Migration: `migrations/0032_add_content_reads.sql`
- **Created:** `content_reads` table to track read status for all content types
- **Structure:**
  - `id` (TEXT PRIMARY KEY)
  - `user_id` (TEXT NOT NULL, FOREIGN KEY to users)
  - `content_type` (TEXT NOT NULL) - e.g., 'post', 'dev_log', 'music_post', 'event', 'project', 'timeline_update'
  - `content_id` (TEXT NOT NULL)
  - `last_read_at` (INTEGER NOT NULL)
  - UNIQUE constraint on (user_id, content_type, content_id)
- **Indexes:**
  - `idx_content_reads_user_type` on (user_id, content_type)
  - `idx_content_reads_content` on (content_type, content_id)

**Note:** Forum threads (lobby, shitposts) continue using the existing `forum_thread_reads` table which tracks `last_read_reply_id` for more sophisticated reply tracking.

## API Endpoints Created

### Mark-Read Endpoints
All endpoints follow the same pattern: check authentication, insert/update read status in `content_reads` table.

1. **`src/app/api/devlog/[id]/mark-read/route.js`**
   - Content type: `'dev_log'`
   - Marks dev log posts as read

2. **`src/app/api/music/[id]/mark-read/route.js`**
   - Content type: `'music_post'`
   - Marks music posts as read

3. **`src/app/api/events/[id]/mark-read/route.js`**
   - Content type: `'event'`
   - Marks events as read

4. **`src/app/api/projects/[id]/mark-read/route.js`**
   - Content type: `'project'`
   - Marks projects as read

5. **`src/app/api/posts/[id]/mark-read/route.js`**
   - Content type: `'post'`
   - Marks posts (art, bugs, rant, nostalgia, lore, memories) as read

6. **`src/app/api/timeline/[id]/mark-read/route.js`**
   - Content type: `'timeline_update'`
   - Marks timeline updates/announcements as read

**Note:** Forum threads already had `/api/forum/[id]/mark-read/route.js` which uses `forum_thread_reads` table.

## Component Updates

### ViewTracker Component (`src/components/ViewTracker.js`)
**Updated to:**
- Call view API endpoint (existing functionality)
- **NEW:** Call mark-read API endpoint for all content types
- Automatically marks content as read when user views a detail page
- Silently fails if mark-read endpoint doesn't exist (for rollout compatibility)

## Server-Side Pages Updated (Unread Tracking Logic)

All section pages now query the read status and set `is_unread` flag on each post/thread.

### Posts-Based Pages (use `content_reads` table, content_type='post'):
1. **`src/app/art/page.js`** ✅
2. **`src/app/bugs/page.js`** ✅
3. **`src/app/rant/page.js`** ✅
4. **`src/app/nostalgia/page.js`** ✅
5. **`src/app/lore/page.js`** ✅
6. **`src/app/memories/page.js`** ✅
7. **`src/app/lore-memories/page.js`** ✅

**Pattern used:**
```javascript
// Add unread status for logged-in users
if (user && results.length > 0) {
  try {
    const postIds = results.map(p => p.id);
    if (postIds.length > 0) {
      const placeholders = postIds.map(() => '?').join(',');
      const readStates = await db
        .prepare(
          `SELECT content_id FROM content_reads 
           WHERE user_id = ? AND content_type = 'post' AND content_id IN (${placeholders})`
        )
        .bind(user.id, ...postIds)
        .all();

      const readSet = new Set();
      (readStates?.results || []).forEach(r => {
        readSet.add(r.content_id);
      });

      results.forEach(post => {
        post.is_unread = !readSet.has(post.id);
      });
    } else {
      results.forEach(post => {
        post.is_unread = false;
      });
    }
  } catch (e) {
    // content_reads table might not exist yet, mark all as read
    results.forEach(post => {
      post.is_unread = false;
    });
  }
} else {
  results.forEach(post => {
    post.is_unread = false;
  });
}
```

### Other Content Types:
8. **`src/app/devlog/page.js`** ✅
   - Content type: `'dev_log'`

9. **`src/app/music/page.js`** ✅
   - Content type: `'music_post'`

10. **`src/app/events/page.js`** ✅
    - Content type: `'event'`

11. **`src/app/projects/page.js`** ✅
    - Content type: `'project'`

12. **`src/app/announcements/page.js`** ✅
    - Content type: `'timeline_update'`

### Forum Threads (use `forum_thread_reads` table):
13. **`src/app/shitposts/page.js`** ✅
    - Uses `forum_thread_reads` table (same as lobby)
    - Tracks `last_read_reply_id` for reply-level tracking
    - Logic matches `src/app/lobby/page.js`

14. **`src/app/lobby/page.js`** ✅
    - Already had unread tracking (no changes needed)

15. **`src/app/forum/page.js`** ✅
    - Uses `ForumClient.js` which already had unread tracking

## Client Components Updated (NEW Indicator Display)

All client components now display the 🆕 indicator when `is_unread` is true.

### Updated Components:
1. **`src/app/art/ArtClient.js`** ✅
2. **`src/app/bugs/BugsClient.js`** ✅
3. **`src/app/rant/RantClient.js`** ✅
4. **`src/app/nostalgia/NostalgiaClient.js`** ✅
5. **`src/app/lore/LoreClient.js`** ✅
6. **`src/app/memories/MemoriesClient.js`** ✅
7. **`src/app/lore-memories/LoreMemoriesClient.js`** ✅
8. **`src/app/shitposts/ShitpostsClient.js`** ✅
9. **`src/app/timeline/TimelineClient.js`** ✅
10. **`src/app/events/EventsClient.js`** ✅
11. **`src/app/projects/ProjectsClient.js`** ✅
12. **`src/app/devlog/DevLogClient.js`** ✅
13. **`src/app/music/MusicClient.js`** ✅
14. **`src/app/forum/ForumClient.js`** ✅ (already had this)

**Pattern used:**
```javascript
const statusIcons = [];
if (row.is_unread) statusIcons.push('🆕');
const titleWithIcons = statusIcons.length > 0 
  ? <><span style={{ marginRight: '6px' }}>{statusIcons.join(' ')}</span>{row.title}</>
  : row.title;

// In JSX:
<a
  className={`list-item ${row.is_unread ? 'thread-unread' : ''}`}
  ...
>
  <PostMetaBar title={titleWithIcons} ... />
</a>
```

## Detail Pages (ViewTracker Integration)

All detail pages already have `ViewTracker` component which now automatically marks content as read:

1. ✅ `src/app/devlog/[id]/page.js` - `ViewTracker contentType="devlog"`
2. ✅ `src/app/music/[id]/page.js` - `ViewTracker contentType="music"`
3. ✅ `src/app/events/[id]/page.js` - `ViewTracker contentType="events"`
4. ✅ `src/app/projects/[id]/page.js` - `ViewTracker contentType="projects"`
5. ✅ `src/app/lobby/[id]/page.js` - `ViewTracker contentType="forum"`
6. ✅ `src/app/art/[id]/page.js` - `ViewTracker contentType="posts"`
7. ✅ `src/app/bugs/[id]/page.js` - `ViewTracker contentType="posts"`
8. ✅ `src/app/rant/[id]/page.js` - `ViewTracker contentType="posts"`
9. ✅ `src/app/nostalgia/[id]/page.js` - `ViewTracker contentType="posts"`
10. ✅ `src/app/lore/[id]/page.js` - `ViewTracker contentType="posts"`
11. ✅ `src/app/memories/[id]/page.js` - `ViewTracker contentType="posts"`
12. ✅ `src/app/lore-memories/[id]/page.js` - `ViewTracker contentType="posts"`
13. ✅ `src/app/announcements/[id]/page.js` - `ViewTracker contentType="timeline"`

## Pages Excluded (As Requested)

- ✅ **`src/app/feed/page.js`** - No changes (user requested no changes to feed)
- ✅ **`src/app/page.js`** - No changes (user requested no changes to home)

## How It Works

### Flow:
1. **User visits section page** (e.g., `/art`, `/devlog`, `/music`)
   - Server queries `content_reads` (or `forum_thread_reads` for threads)
   - Sets `is_unread = true` for items user hasn't read
   - Passes `is_unread` flag to client component

2. **Client component renders**
   - Checks `is_unread` flag
   - Shows 🆕 emoji before title if unread
   - Applies `thread-unread` CSS class

3. **User clicks on post/thread**
   - Navigates to detail page
   - `ViewTracker` component mounts
   - Calls mark-read API endpoint
   - Content is marked as read in database

4. **User returns to section page**
   - Server queries read status again
   - Item no longer has `is_unread = true`
   - 🆕 indicator is gone

## Error Handling

All implementations include graceful error handling:
- If `content_reads` table doesn't exist yet (migration not applied), all items marked as read
- If query fails, defaults to marking all as read (no breaking errors)
- Mark-read API endpoints silently fail if table doesn't exist
- ViewTracker silently fails if mark-read endpoint doesn't exist

This ensures the feature degrades gracefully during rollout.

## Testing Checklist

### Pages to Test:
- [ ] Art (`/art`)
- [ ] Bugs (`/bugs`)
- [ ] Rant (`/rant`)
- [ ] Nostalgia (`/nostalgia`)
- [ ] Lore (`/lore`)
- [ ] Memories (`/memories`)
- [ ] Lore & Memories (`/lore-memories`)
- [ ] Shitposts (`/shitposts`)
- [ ] Announcements (`/announcements`)
- [ ] Development (`/devlog`)
- [ ] Music (`/music`)
- [ ] Events (`/events`)
- [ ] Projects (`/projects`)
- [ ] General/Forum (`/forum` or `/lobby`)

### Test Steps:
1. View a section page - should see 🆕 on unread items
2. Click on an unread item - navigate to detail page
3. Return to section page - 🆕 should be gone
4. Verify feed and home pages unchanged

## Migration Required

**File:** `migrations/0032_add_content_reads.sql`

**Command to apply:**
```bash
# Local database
npx wrangler d1 execute errl_forum_db --file=./migrations/0032_add_content_reads.sql

# Remote/Production database
npx wrangler d1 execute errl_forum_db --remote --file=./migrations/0032_add_content_reads.sql
```

## Files Modified Summary

### New Files Created:
- `migrations/0032_add_content_reads.sql`
- `src/app/api/devlog/[id]/mark-read/route.js`
- `src/app/api/music/[id]/mark-read/route.js`
- `src/app/api/events/[id]/mark-read/route.js`
- `src/app/api/projects/[id]/mark-read/route.js`
- `src/app/api/posts/[id]/mark-read/route.js`
- `src/app/api/timeline/[id]/mark-read/route.js`

### Files Modified:
- `src/components/ViewTracker.js` - Added mark-read API calls
- 14 server pages (`page.js` files) - Added unread tracking logic
- 14 client components (`*Client.js` files) - Added NEW indicator display

## Notes

- Forum threads (lobby, shitposts) use `forum_thread_reads` table which tracks `last_read_reply_id` for more sophisticated tracking
- Other content types use simpler `content_reads` table which just tracks if read
- All implementations are rollout-safe with graceful error handling
- No breaking changes - feature degrades gracefully if migration not applied
- Feed and home pages explicitly excluded from changes
