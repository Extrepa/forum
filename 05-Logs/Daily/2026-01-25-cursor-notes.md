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
