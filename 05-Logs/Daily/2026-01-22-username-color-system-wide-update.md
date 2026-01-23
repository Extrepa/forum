# Username Color System-Wide Update

**Date:** 2026-01-22  
**Status:** 🔄 In Progress

## Problem
When users change their username color preference on the profile page, it updates on that page but doesn't update on other pages where their username appears (devlogs, forum threads, music posts, etc.).

## Root Cause
Most queries that fetch usernames only select `users.username AS author_name` but don't fetch `preferred_username_color_index`. The Username component then can't use the preference.

## Solution Strategy
1. Update all queries that JOIN users to also fetch `preferred_username_color_index AS author_color_preference`
2. Build a Map of username -> preferredColorIndex from the data
3. Pass that Map to `assignUniqueColorsForPage()` 
4. Pass `preferredColorIndex` to Username components

## Files Updated

### ✅ Detail Pages (Post/Thread View Pages)
1. **`src/app/devlog/[id]/page.js`**
   - ✅ Updated queries to fetch `author_color_preference`
   - ✅ Builds preferences map
   - ✅ Passes to `assignUniqueColorsForPage()`
   - ✅ Passes `preferredColorIndex` to Username components

2. **`src/app/lobby/[id]/page.js`** (Forum Threads)
   - ✅ Updated queries to fetch `author_color_preference`
   - ✅ Builds preferences map
   - ✅ Passes to `assignUniqueColorsForPage()`
   - ✅ Passes `preferredColorIndex` to Username components

3. **`src/app/music/[id]/page.js`**
   - ✅ Updated queries to fetch `author_color_preference`
   - ✅ Builds preferences map
   - ✅ Passes to `assignUniqueColorsForPage()`
   - ✅ Passes `preferredColorIndex` to Username components

4. **`src/app/announcements/[id]/page.js`**
   - ✅ Updated queries to fetch `author_color_preference`
   - ✅ Builds preferences map
   - ✅ Passes to `assignUniqueColorsForPage()`
   - ✅ Passes `preferredColorIndex` to Username components

5. **`src/app/events/[id]/page.js`**
   - ✅ Updated queries to fetch `author_color_preference`
   - ✅ Builds preferences map
   - ✅ Passes to `assignUniqueColorsForPage()`
   - ✅ Passes `preferredColorIndex` to Username components

6. **`src/app/projects/[id]/page.js`**
   - ✅ Updated queries to fetch `author_color_preference`
   - ✅ Builds preferences map
   - ✅ Passes to `assignUniqueColorsForPage()`
   - ✅ Passes `preferredColorIndex` to Username components

### ✅ Components
1. **`src/components/EventCommentsSection.js`**
   - ✅ Uses `author_color_preference` from comment data
   - ✅ Passes to `getUsernameColorIndex()`

### ⚠️ Still Need to Update

#### List Pages (Need Similar Updates)
- `src/app/devlog/page.js` - Devlog list
- `src/app/lobby/page.js` - Forum thread list
- `src/app/music/page.js` - Music posts list
- `src/app/events/page.js` - Events list
- `src/app/projects/page.js` - Projects list
- `src/app/announcements/page.js` - Announcements list
- `src/app/feed/page.js` - Feed page
- `src/app/page.js` - Home page
- All other post type list pages

#### Client Components (List Views)
- `src/app/devlog/DevLogClient.js`
- `src/app/forum/ForumClient.js`
- `src/app/music/MusicClient.js`
- `src/app/events/EventsClient.js`
- `src/app/projects/ProjectsClient.js`
- `src/app/timeline/TimelineClient.js`
- All other Client components

#### API Endpoints (For Dynamic Loading)
- `src/app/api/events/[id]/attendees/route.js` - Should include preferences
- `src/app/api/events/[id]/comments/route.js` - Should include preferences
- `src/app/api/projects/[id]/comments/route.js` - Should include preferences
- `src/app/api/timeline/[id]/comments/route.js` - Should include preferences
- All other comment/reply API endpoints

## Pattern to Apply

For each page/component:

1. **Update SQL queries:**
   ```sql
   -- Add this to SELECT statements:
   users.preferred_username_color_index AS author_color_preference
   ```

2. **Build preferences map:**
   ```javascript
   const preferredColors = new Map();
   if (post.author_name && post.author_color_preference !== null && post.author_color_preference !== undefined) {
     preferredColors.set(post.author_name, Number(post.author_color_preference));
   }
   comments.forEach(c => {
     if (c.author_name && c.author_color_preference !== null && c.author_color_preference !== undefined) {
       preferredColors.set(c.author_name, Number(c.author_color_preference));
     }
   });
   ```

3. **Pass to assignUniqueColorsForPage:**
   ```javascript
   const usernameColorMap = assignUniqueColorsForPage(allUsernames, preferredColors);
   ```

4. **Pass to Username component:**
   ```javascript
   <Username 
     name={author_name} 
     colorIndex={usernameColorMap.get(author_name)}
     preferredColorIndex={author_color_preference !== null && author_color_preference !== undefined ? Number(author_color_preference) : null}
   />
   ```

## Next Steps

1. Update remaining detail pages (if any)
2. Update list pages systematically
3. Update client components
4. Update API endpoints that return user data
5. Test across all pages

## Testing Checklist

- [ ] Devlog detail page - username color updates
- [ ] Forum thread detail page - username color updates
- [ ] Music post detail page - username color updates
- [ ] Announcement detail page - username color updates
- [ ] Event detail page - username color updates
- [ ] Project detail page - username color updates
- [ ] List pages - username colors work
- [ ] Comments/replies - username colors work
- [ ] Multiple users with preferences - uniqueness maintained
- [ ] Automatic users - still get unique colors

---

**Status:** Key detail pages updated. List pages and API endpoints still need updates.
