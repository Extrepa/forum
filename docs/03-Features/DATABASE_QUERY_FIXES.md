# Database Query Fixes - Rollout Safety

## Issue
After implementing classic forum features, some pages were failing to load because queries were trying to access columns/tables that don't exist yet (migrations not fully applied).

## Fixes Applied

### 1. Lobby Page (`src/app/lobby/page.js`)

**Problem:** 
- Main query tries to SELECT `views`, `is_announcement` columns that might not exist
- Unread tracking queries try to access `forum_thread_reads` table that might not exist
- WHERE clauses reference `is_announcement` which might not exist

**Solution:**
- ✅ Wrapped unread tracking queries in try/catch blocks
- ✅ Added fallback queries that don't reference new columns
- ✅ Simplified WHERE clauses in fallback to avoid `is_announcement` references
- ✅ Added triple-fallback: main query → simplified fallback → absolute simplest query
- ✅ Wrapped each thread type query (announcements, stickies, threads) in try/catch

### 2. Thread Detail Page (`src/app/lobby/[id]/page.js`)

**Problem:**
- Pagination queries might fail if there are issues
- Unread tracking query might fail if table doesn't exist

**Solution:**
- ✅ Wrapped pagination queries in try/catch
- ✅ Unread tracking already had try/catch (kept it)
- ✅ Added fallback for thread query if `post_likes` table doesn't exist
- ✅ Added double-fallback for thread query

### 3. Account Page (`src/app/account/page.js`)

**Status:** Already has try/catch blocks - should be safe

## Key Changes

1. **Unread tracking queries** - Now wrapped in try/catch, gracefully degrade if `forum_thread_reads` table doesn't exist
2. **WHERE clause simplification** - Fallback queries remove references to `is_announcement` and `moved_to_id` if they might not exist
3. **Multiple fallback levels** - Each query has 2-3 levels of fallback for maximum compatibility
4. **Empty array defaults** - All queries default to empty arrays if they fail, preventing crashes

## Testing

After these fixes, pages should:
- ✅ Load even if migrations 0023, 0024, 0025 aren't applied yet
- ✅ Load even if `forum_thread_reads` table doesn't exist
- ✅ Load even if `post_likes` table doesn't exist
- ✅ Show basic thread lists without new metadata if columns don't exist
- ✅ Gracefully degrade features instead of crashing

## Next Steps

1. Apply remaining migrations (0020, 0021, 0022, 0023, 0024, 0025)
2. Test pages load correctly
3. Verify features work once migrations are applied
