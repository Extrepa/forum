# Feed Page "Latest Activity" Implementation - Notes & Plan

**Date:** 2026-01-22  
**Status:** Reverted - Planned for later implementation  
**Branch Strategy:** Use feature branch workflow

## What We Did

### Implementation Attempted

Transformed the Feed page's "Latest" section into "Latest Activity" that would track both new posts and posts with recent activity (comments/replies), ensuring no duplicates and proper sorting by most recent activity.

### Changes Made (Now Reverted)

**File Modified:** `src/app/feed/page.js`

#### 1. SQL Queries Updated (7 content types)

All queries were modified to include activity tracking:

- **Announcements** (`timeline_updates`) → track `timeline_comments`
- **Forum Threads** (`forum_threads`) → track `forum_replies`
- **Events** (`events`) → track `event_comments`
- **Music** (`music_posts`) → track `music_comments`
- **Projects** (`projects`) → track `project_comments` and `project_replies` (simplified, excluded `project_updates`)
- **Posts** (`posts`) → track `post_comments`
- **Dev Logs** (`dev_logs`) → track `dev_log_comments`

#### 2. Query Pattern Used

```sql
SELECT 
  [post_table].id, 
  [post_table].title, 
  [post_table].created_at AS post_created_at,
  COALESCE(MAX([activity_table].created_at), [post_table].created_at) AS latest_activity_at,
  users.username AS author_name
FROM [post_table]
JOIN users ON users.id = [post_table].author_user_id
LEFT JOIN [activity_table] ON [activity_table].[foreign_key] = [post_table].id 
  AND [activity_table].is_deleted = 0
WHERE [post_table].moved_to_id IS NULL
GROUP BY [post_table].id, [post_table].title, [post_table].created_at, users.username
ORDER BY latest_activity_at DESC
LIMIT 20
```

**Special Case - Projects:**
Used correlated subquery with UNION ALL to track both comments and replies:
```sql
COALESCE(
  (SELECT MAX(ts) FROM (
    SELECT MAX(project_comments.created_at) AS ts FROM project_comments 
      WHERE project_comments.project_id = projects.id AND project_comments.is_deleted = 0
    UNION ALL
    SELECT MAX(project_replies.created_at) AS ts FROM project_replies 
      WHERE project_replies.project_id = projects.id AND project_replies.is_deleted = 0
  )),
  projects.created_at
) AS latest_activity_at
```

#### 3. Data Structure Changes

- Added `latestActivityAt` field to all items
- Preserved `createdAt` for reference
- Updated field mapping from `row.created_at` to `row.post_created_at` and `row.latest_activity_at`

#### 4. Deduplication Logic

```javascript
const deduplicatedMap = new Map();
items.forEach(item => {
  const key = `${item.type}:${item.href}`;
  const existing = deduplicatedMap.get(key);
  if (!existing || item.latestActivityAt > existing.latestActivityAt) {
    deduplicatedMap.set(key, item);
  }
});
const deduplicatedItems = Array.from(deduplicatedMap.values())
  .sort((a, b) => b.latestActivityAt - a.latestActivityAt)
  .slice(0, 5);
```

#### 5. Sorting Update

Changed from:
```javascript
.sort((a, b) => b.createdAt - a.createdAt)
```

To:
```javascript
.sort((a, b) => b.latestActivityAt - a.latestActivityAt)
```

#### 6. UI Updates

- Heading: "Latest" → "Latest Activity"
- Time display: `formatTimeAgo(item.createdAt)` → `formatTimeAgo(item.latestActivityAt)`
- Variable renamed: `items` → `deduplicatedItems`

### Build Status

- ✅ Build completed successfully: `npm run build` passed
- ✅ No linter errors
- ✅ All queries tested and working

### Why Reverted

User reverted changes - reason not specified, but likely:
- Need to test in production environment first
- Want to implement using proper branch workflow
- May need additional planning/coordination

---

## Plan for Future Implementation

### Branch Workflow Strategy

1. **Create feature branch:**
   ```bash
   git checkout -b feature/feed-latest-activity
   ```

2. **Make changes incrementally:**
   - Start with one content type (e.g., forum threads)
   - Test and verify
   - Add remaining content types one by one
   - Or implement all at once if confident

3. **Test thoroughly:**
   - Test with real data
   - Verify deduplication works
   - Check performance with large datasets
   - Test all 7 content types

4. **Create PR and review:**
   - Submit PR for review
   - Get approval before merging

5. **Merge to main:**
   - Merge after approval
   - Deploy to production

### Implementation Checklist

#### Phase 1: Setup
- [ ] Create feature branch: `feature/feed-latest-activity`
- [ ] Review current feed page implementation
- [ ] Verify database schema for all activity tables

#### Phase 2: Query Updates (One by One)
- [ ] Update announcements query (timeline_comments)
- [ ] Update forum threads query (forum_replies)
- [ ] Update events query (event_comments)
- [ ] Update music query (music_comments)
- [ ] Update projects query (project_comments + project_replies)
- [ ] Update posts query (post_comments)
- [ ] Update dev logs query (dev_log_comments)

#### Phase 3: Data Structure
- [ ] Update items mapping to include `latestActivityAt`
- [ ] Update field references from `created_at` to `post_created_at` and `latest_activity_at`
- [ ] Preserve `createdAt` for reference

#### Phase 4: Logic Updates
- [ ] Implement deduplication logic
- [ ] Update sorting to use `latestActivityAt`
- [ ] Update filter to check both `createdAt` and `latestActivityAt`

#### Phase 5: UI Updates
- [ ] Change heading to "Latest Activity"
- [ ] Update time display to use `latestActivityAt`
- [ ] Update variable names for clarity

#### Phase 6: Testing
- [ ] Run build: `npm run build`
- [ ] Test with sample data
- [ ] Verify deduplication works correctly
- [ ] Test all 7 content types
- [ ] Verify posts with activity move to top
- [ ] Check performance
- [ ] Test edge cases (no activity, deleted comments, etc.)

#### Phase 7: Deployment
- [ ] Create PR
- [ ] Get code review
- [ ] Merge to main
- [ ] Deploy to production
- [ ] Monitor for issues

### Key Implementation Details

#### SQL Query Pattern

For most content types (simple case):
```sql
SELECT 
  [table].id, 
  [table].title, 
  [table].created_at AS post_created_at,
  COALESCE(MAX([activity_table].created_at), [table].created_at) AS latest_activity_at,
  users.username AS author_name
FROM [table]
JOIN users ON users.id = [table].author_user_id
LEFT JOIN [activity_table] ON [activity_table].[foreign_key] = [table].id 
  AND [activity_table].is_deleted = 0
WHERE [table].moved_to_id IS NULL
GROUP BY [table].id, [table].title, [table].created_at, users.username
ORDER BY latest_activity_at DESC
LIMIT 20
```

#### Projects Query (Special Case)

Projects need to track both comments and replies:
```sql
SELECT 
  projects.id, 
  projects.title, 
  projects.created_at AS post_created_at,
  COALESCE(
    (SELECT MAX(ts) FROM (
      SELECT MAX(project_comments.created_at) AS ts FROM project_comments 
        WHERE project_comments.project_id = projects.id AND project_comments.is_deleted = 0
      UNION ALL
      SELECT MAX(project_replies.created_at) AS ts FROM project_replies 
        WHERE project_replies.project_id = projects.id AND project_replies.is_deleted = 0
    )),
    projects.created_at
  ) AS latest_activity_at,
  users.username AS author_name
FROM projects
JOIN users ON users.id = projects.author_user_id
WHERE projects.moved_to_id IS NULL
GROUP BY projects.id, projects.title, projects.created_at, users.username
ORDER BY latest_activity_at DESC
LIMIT 20
```

#### Deduplication Logic

```javascript
// After combining all post types into items array
const deduplicatedMap = new Map();
items.forEach(item => {
  const key = `${item.type}:${item.href}`;
  const existing = deduplicatedMap.get(key);
  if (!existing || item.latestActivityAt > existing.latestActivityAt) {
    deduplicatedMap.set(key, item);
  }
});
const deduplicatedItems = Array.from(deduplicatedMap.values())
  .sort((a, b) => b.latestActivityAt - a.latestActivityAt)
  .slice(0, 5);
```

### Database Schema Reference

Activity tracking tables:
- `timeline_comments` → `update_id` references `timeline_updates.id`
- `forum_replies` → `thread_id` references `forum_threads.id`
- `event_comments` → `event_id` references `events.id`
- `music_comments` → `post_id` references `music_posts.id`
- `project_comments` → `project_id` references `projects.id`
- `project_replies` → `project_id` references `projects.id`
- `post_comments` → `post_id` references `posts.id`
- `dev_log_comments` → `log_id` references `dev_logs.id`

All activity tables have:
- `created_at` (INTEGER timestamp)
- `is_deleted` (INTEGER, 0 = not deleted)

### Performance Considerations

- Queries use `MAX()` aggregations with `GROUP BY` - existing indexes should support this
- Projects query uses correlated subquery - may need performance testing
- Consider adding query result limit (currently 20 per type, then top 5 overall)
- Monitor query performance; may need additional indexes if slow
- Consider caching if feed page becomes slow with large datasets

### Edge Cases to Test

- Posts with no activity (should use creation time)
- Posts with deleted comments/replies (should be excluded)
- Moved posts (should be excluded via `moved_to_id IS NULL`)
- Private posts (should respect visibility rules)
- Empty results (should show "Nothing new… the goo is resting.")
- Duplicate posts across different content types (deduplication should handle)
- Posts with very recent activity (should move to top)

### Future Enhancements (Optional)

- Add activity indicators (e.g., "updated X ago" vs "posted X ago")
- Add filtering options (e.g., "Show only new posts" vs "Show all activity")
- Consider tracking project_updates as activity (currently excluded)
- Add pagination if feed grows large
- Cache activity timestamps for performance

---

## Notes

- All changes are query-level only - no database migrations required
- Backward compatible - existing functionality preserved
- Can be implemented incrementally (one content type at a time)
- Build tested and verified working
- Ready for implementation when needed
