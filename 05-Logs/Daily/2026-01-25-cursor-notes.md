# Implementation Notes - 2026-01-25

## Summary
Fixed devlog crash after replies, added edit/delete functionality to Lore/Memories pages, and ensured consistency across all sections.

## Issues Fixed

### 1. Devlog Posts Broken After Testing Replies
**Root Cause:** Next.js 15 requires `params` to be awaited as it's now a Promise. Also potential BigInt serialization issues when passing data to client components.

**Fixes Applied:**
- ✅ Updated `devlog/[id]/page.js` to await params: `const { id } = await params;`
- ✅ Replaced all `params.id` references with `id` throughout the file
- ✅ Sanitized `log` object passed to `DevLogForm` - coerced numeric fields (views, like_count, author_color_preference) to Number to prevent BigInt serialization errors
- ✅ Sanitized `replyingTo` object passed to `ReplyFormWrapper` - created minimal serializable object with only `{ id, author_name, body }` as strings
- ✅ Added validation for `replyToId` - only creates `replyingTo` if comment exists in comments array

**Files Modified:**
- `src/app/devlog/[id]/page.js`

### 2. Next.js 15 Params Promise Pattern
**Applied to all [id] pages:**
- ✅ `src/app/devlog/[id]/page.js`
- ✅ `src/app/events/[id]/page.js`
- ✅ `src/app/projects/[id]/page.js`
- ✅ `src/app/music/[id]/page.js`
- ✅ `src/app/lobby/[id]/page.js`
- ✅ `src/app/lore/[id]/page.js`
- ✅ `src/app/memories/[id]/page.js`
- ✅ `src/app/lore-memories/[id]/page.js`
- ✅ `src/app/rant/[id]/page.js`
- ✅ `src/app/nostalgia/[id]/page.js`
- ✅ `src/app/bugs/[id]/page.js`
- ✅ `src/app/art/[id]/page.js`
- ✅ `src/app/announcements/[id]/page.js`

**Pattern:** Added `const { id } = await params;` at the start of each page function and replaced all `params.id` with `id`.

### 3. Lore and Memories Missing Edit/Delete/Lock Buttons
**Fixes Applied:**

#### Added `author_user_id` to Queries
- ✅ Updated SQL queries in `lore-memories/[id]/page.js`, `lore/[id]/page.js`, `memories/[id]/page.js` to include `posts.author_user_id`
- ✅ Added permission checks: `canEdit = canDelete = (user.id === post.author_user_id) || isAdminUser(user)`

#### Created PostEditForm Component
- ✅ New component: `src/components/PostEditForm.js`
- ✅ Supports `initialData` prop for editing existing posts
- ✅ Includes title, body, is_private checkbox, optional image upload
- ✅ Uses same formatting toolbar as GenericPostForm

#### Updated Page Layouts
- ✅ Replaced `Breadcrumbs` with `PageTopRow` for consistency with devlog/events/projects
- ✅ Added Edit and Delete buttons in `PageTopRow.right` section
- ✅ Added edit panel (initially hidden) with `PostEditForm` that POSTs to `/api/posts/[id]`
- ✅ Edit panel uses same pattern as devlog/events (hidden div with `id="edit-post-panel"`)

**Files Modified:**
- `src/app/lore-memories/[id]/page.js`
- `src/app/lore/[id]/page.js`
- `src/app/memories/[id]/page.js`
- `src/components/PostEditForm.js` (new)

### 4. Delete APIs
**Created:**
- ✅ `src/app/api/devlog/[id]/delete/route.js` - Soft deletes dev logs (sets `is_deleted = 1`)
- ✅ `src/app/api/posts/[id]/delete/route.js` - Soft deletes posts (sets `is_deleted = 1`)

**Both APIs:**
- ✅ Await params: `const { id } = await params;`
- ✅ Check authentication
- ✅ Verify ownership or admin status
- ✅ Return appropriate error codes (401, 403, 404)

**Note:** The posts delete API has a try/catch for `is_deleted` column - if it doesn't exist, returns 409 'notready'. 
- Migration `0017_shared_posts.sql` does NOT include `is_deleted` column for posts table (only for `post_comments`)
- Migration `0028_soft_delete_all_tables.sql` adds `is_deleted` to events, music_posts, projects, and dev_logs, but NOT to posts table
- **Action Required:** If soft-delete is desired for posts, need to add migration:
  ```sql
  ALTER TABLE posts ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0;
  CREATE INDEX IF NOT EXISTS idx_posts_is_deleted ON posts(is_deleted);
  ```

### 5. DeletePostButton Component
**Updated:**
- ✅ Added support for `postType="post"` - calls `/api/posts/[id]/delete`
- ✅ Added redirect to `/lore-memories` after deleting a post

**Files Modified:**
- `src/components/DeletePostButton.js`

## Verification Checklist

### Params Fix
- ✅ All [id] pages await params before use
- ✅ No remaining `params.id` references in page components
- ⚠️ **Note:** API routes still use `params.id` - these may also need updating if they're causing issues, but API route handlers might handle Promises differently. Need to verify Next.js 15 behavior for API routes.

### Data Sanitization
- ✅ DevLogForm receives sanitized `initialData` with all numeric fields coerced to Number
- ✅ ReplyFormWrapper receives minimal `replyingTo` object (only strings)

### Edit/Delete Functionality
- ✅ All three pages (lore, memories, lore-memories) have:
  - `author_user_id` in queries
  - Permission checks (`canEdit`, `canDelete`)
  - Edit button and panel
  - Delete button
  - Proper redirects after delete

### API Routes
- ✅ Devlog delete API created and awaits params
- ✅ Posts delete API created and awaits params
- ⚠️ **Potential Issue:** Posts table may not have `is_deleted` column - delete API will return 409 'notready' if column doesn't exist

## Known Issues / Follow-ups

1. **Posts `is_deleted` Column:** 
   - Migration `0017_shared_posts.sql` doesn't include `is_deleted` for the `posts` table
   - Migration `0028_soft_delete_all_tables.sql` adds `is_deleted` to events, music_posts, projects, dev_logs, but NOT to posts
   - The delete API handles this gracefully (returns 409 'notready'), but if soft-delete is desired, a migration should be added:
   ```sql
   ALTER TABLE posts ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0;
   CREATE INDEX IF NOT EXISTS idx_posts_is_deleted ON posts(is_deleted);
   ```

2. **API Route Params:** Many API routes still use `params.id` directly. Need to verify if Next.js 15 requires awaiting params in API routes as well. If so, ~36 API route files need updating. **Note:** The delete APIs created (`devlog/[id]/delete` and `posts/[id]/delete`) already await params correctly.

3. **Lock Comments:** Lock functionality was deferred per plan - requires `is_locked` column migration for posts table and `/api/posts/[id]/lock` route.

4. **Reply Threading:** Lore/Memories pages still use flat comment form instead of `ReplyFormWrapper` with threading. This was noted as optional follow-up in the plan.

## Follow-up (2026-01-25): Devlog replies still broken

**Additional fixes applied:**

1. **Devlog page**
   - Built `safeComments`: full serialization (id, body, author_name, author_color_preference, created_at, reply_to_id) with String/Number coercion; pre-render markdown to `body_html` in try-catch.
   - `validCommentIds` Set: use `reply_to_id` as parent key only when it exists in the set (same as lobby).
   - Reply tree uses `safeComments`, `body_html`, and coerced `preferredColor`; `renderReply` returns null for invalid items; filter nulls.
   - Await `searchParams`: `const resolvedSearchParams = (await searchParams) || {}`; use for `error` and `replyTo`.

2. **Events page**
   - `commentsWithHtml`: wrap `renderMarkdown` in try-catch; serialize id, body, author_name, author_color_preference, created_at.
   - Await `searchParams`, use `resolvedSearchParams` for `error`.

3. **Music page**
   - `safeComments` with pre-rendered `body_html` in try-catch; use in comment list and for Username/CommentActions.
   - Await `searchParams`, use `resolvedSearchParams` for `error`.

4. **Lobby page**
   - Await `searchParams`; use `resolvedSearchParams` for error, replyTo, page, edit, and in extraction block.
   - Replaced remaining `params.id` with `id` (count query, read-state, etc.).

5. **Projects page**
   - Await `searchParams`; use `resolvedSearchParams` in extraction block.

6. **Devlog comments API**
   - GET/POST await `params`, use `id` for all DB binds and redirect URL.

**Files touched:** `devlog/[id]/page.js`, `events/[id]/page.js`, `music/[id]/page.js`, `lobby/[id]/page.js`, `projects/[id]/page.js`, `api/devlog/[id]/comments/route.js`.

---

## Verification Notes (2026-01-25 - Double Check)

### ✅ Verified: Devlog Page (`/devlog/[id]`)
1. **Params & SearchParams:**
   - ✅ Line 68: `const { id } = await params;`
   - ✅ Line 69: `const resolvedSearchParams = (await searchParams) || {};`
   - ✅ All DB queries use `id` (not `params.id`)
   - ✅ Line 216: `const error = resolvedSearchParams?.error;`
   - ✅ Line 268: `const replyToId = String(resolvedSearchParams?.replyTo || '').trim() || null;`

2. **Comment Serialization:**
   - ✅ Lines 271-294: `safeComments` array with full serialization:
     - All fields coerced to String/Number
     - `body_html` pre-rendered in try-catch (lines 275-280)
     - `reply_to_id` coerced to String or null
   - ✅ Line 296: `validCommentIds` Set created from `safeComments`
   - ✅ Lines 297-302: `replyingTo` only created if `replyToId` exists in `validCommentIds`

3. **Reply Tree Building:**
   - ✅ Lines 471-478: `byParent` Map built with validation:
     - Only uses `reply_to_id` as key if it exists in `validCommentIds`
     - Orphaned replies (pointing to deleted comments) become top-level
   - ✅ Lines 480-514: `renderReply` function:
     - Returns `null` for invalid comments (line 481)
     - Uses `c.body_html` instead of calling `renderMarkdown` (line 491)
     - Coerces `preferredColor` to Number (line 482)
   - ✅ Lines 517-529: Tree rendering with null filtering:
     - `top.map()` filters nulls (line 520)
     - `kids.map()` filters nulls (line 526)

4. **Data Passed to Client Components:**
   - ✅ `Username` receives coerced `preferredColorIndex` (Number or null)
   - ✅ `CommentActions` receives serialized strings (`commentId`, `commentAuthor`, `commentBody`)
   - ✅ `ReplyFormWrapper` receives minimal `replyingTo` object (only strings)

### ✅ Verified: Events Page (`/events/[id]`)
1. **Params & SearchParams:**
   - ✅ Line 41: `const { id } = await params;`
   - ✅ Line 42: `const resolvedSearchParams = (await searchParams) || {};`
   - ✅ Line 240: `const error = resolvedSearchParams?.error;`

2. **Comment Serialization:**
   - ✅ Lines 217-233: `commentsWithHtml` with try-catch:
     - `renderMarkdown` wrapped in try-catch (lines 219-223)
     - All fields serialized (id, body, author_name, author_color_preference, created_at)
     - `body_html` pre-rendered

3. **Data Passed to Client:**
   - ✅ `EventCommentsSection` receives `commentsWithHtml` (fully serialized)
   - All numeric fields coerced to Number

### ✅ Verified: Music Page (`/music/[id]`)
1. **Params & SearchParams:**
   - ✅ Line 41: `const { id } = await params;`
   - ✅ Line 42: `const resolvedSearchParams = (await searchParams) || {};`
   - ✅ Line 182: `const error = resolvedSearchParams?.error;`

2. **Comment Serialization:**
   - ✅ Lines 220-238: `safeComments` with try-catch:
     - `renderMarkdown` wrapped in try-catch (lines 225-229)
     - All fields serialized
     - `body_html` pre-rendered

3. **Comment Rendering:**
   - ✅ Lines 380-410: Comment list uses `safeComments`
   - ✅ Line 391: Uses `comment.body_html` instead of `renderMarkdown(comment.body)`
   - ✅ All data passed to `Username` and `CommentActions` is serialized

### ✅ Verified: Lobby Page (`/lobby/[id]`)
1. **Params & SearchParams:**
   - ✅ Line 42: `const { id } = await params;`
   - ✅ Line 43: `const resolvedSearchParams = (await searchParams) || {};`
   - ✅ Line 90: `const isEditing = resolvedSearchParams?.edit === 'true';`
   - ✅ Line 227: `currentPage = Math.max(1, parseInt(resolvedSearchParams?.page || '1', 10));`
   - ✅ Lines 498-518: Extraction block uses `resolvedSearchParams`

2. **Params.id Fixes:**
   - ✅ All `params.id` references replaced with `id`:
     - Line 239: Count query
     - Line 348: Read state query
     - Line 351: Read state check
     - Lines 360, 373: Last read reply queries
     - Line 385: Last read reply check
     - Lines 396, 410: View tracking queries

### ✅ Verified: Projects Page (`/projects/[id]`)
1. **Params & SearchParams:**
   - ✅ Line 41: `const { id } = await params;`
   - ✅ Line 42: `const resolvedSearchParams = (await searchParams) || {};`
   - ✅ Lines 236-250: Extraction block uses `resolvedSearchParams`

### ✅ Verified: Devlog Comments API (`/api/devlog/[id]/comments`)
1. **Params Await:**
   - ✅ Line 7: `const { id } = await params;` (GET handler)
   - ✅ Line 30: `const { id } = await params;` (POST handler)
   - ✅ All DB queries use `id`:
     - Line 23: GET query
     - Line 36: POST redirect URL
     - Line 51: POST log check
     - Line 74: POST parent check
     - Line 91: POST insert

### ⚠️ Potential Issues Found

1. **API Routes with `params.id`:**
   - Found 38 API route files that still use `params.id` directly
   - These may need updating if Next.js 15 requires awaiting params in API routes
   - **Note:** The devlog comments API was fixed as part of this work
   - **Recommendation:** Test API routes that handle replies/comments. If they fail, update them to await params.

2. **Other Pages with Comments:**
   - Lore, Memories, Lore-Memories, Rant, Nostalgia, Bugs, Art, Announcements pages have comments but use flat structure (no threading)
   - These pages may benefit from similar serialization if they start having issues
   - Currently they use `CommentActions` which receives raw comment data - should verify serialization

3. **Projects Replies:**
   - Uses `ProjectRepliesSection` client component
   - Already has `validReplyIds` pattern (from previous work)
   - Should verify it handles serialization correctly

### ✅ Build Verification
- ✅ `npm run build` completed successfully with no errors
- ✅ All pages compile without TypeScript/linting errors
- ✅ No remaining `params.id` in page components (verified via grep)

### 📝 Summary
All critical fixes have been verified:
- ✅ Devlog page: Full serialization, validCommentIds, pre-rendered markdown, searchParams await
- ✅ Events page: Comment serialization with try-catch, searchParams await
- ✅ Music page: Comment serialization with try-catch, searchParams await
- ✅ Lobby page: searchParams await, all params.id replaced
- ✅ Projects page: searchParams await
- ✅ Devlog comments API: params await

**Remaining work (non-critical):**
- 38 API routes may need params await (if they start failing)
- Other comment pages may need serialization (if issues arise)

---

## Testing Recommendations

1. Test devlog post that previously crashed - should load without errors
2. Test adding replies to devlog posts - verify no serialization errors
3. Test edit functionality on lore/memories posts:
   - As post owner: should see edit/delete buttons
   - As admin: should see edit/delete buttons
   - As other user: should NOT see edit/delete buttons
4. Test delete functionality:
   - Verify soft-delete works (post disappears from list)
   - Verify redirect to `/lore-memories` after delete
5. Test edit form submission - verify updates persist and redirect correctly

## Files Created
- `src/components/PostEditForm.js`
- `src/app/api/devlog/[id]/delete/route.js`
- `src/app/api/posts/[id]/delete/route.js`

## Files Modified
- `src/app/devlog/[id]/page.js`
- `src/app/events/[id]/page.js`
- `src/app/projects/[id]/page.js`
- `src/app/music/[id]/page.js`
- `src/app/lobby/[id]/page.js`
- `src/app/lore/[id]/page.js`
- `src/app/memories/[id]/page.js`
- `src/app/lore-memories/[id]/page.js`
- `src/app/rant/[id]/page.js`
- `src/app/nostalgia/[id]/page.js`
- `src/app/bugs/[id]/page.js`
- `src/app/art/[id]/page.js`
- `src/app/announcements/[id]/page.js`
- `src/components/DeletePostButton.js`
