# Development Notes - January 27, 2026

## Summary
Fixed project reply image upload functionality, improved feed sorting by activity, and optimized feed layout for both desktop and mobile views.

---

## Project Reply Image Upload Feature

### Issues Fixed

1. **Image Upload Not Working**
   - **Problem**: When posting a project reply with an image, the page would reload but no reply was created
   - **Root Cause**: Missing error handling around image upload code, causing silent failures
   - **Solution**: Added comprehensive try-catch blocks and error logging

2. **Permission Issue**
   - **Problem**: Image uploads were failing with generic "upload" error
   - **Root Cause**: User's username wasn't in `IMAGE_UPLOAD_ALLOWLIST` environment variable
   - **Solution**: Added specific error codes (`upload_permission` vs `upload_failed`) and clearer error messages

### Changes Made

#### 1. API Route: `src/app/api/projects/[id]/replies/route.js`

**Image Upload Handling:**
- Added robust image file validation (checks for File object with size > 0)
- Wrapped image upload in try-catch with detailed error logging
- Separated permission errors (`upload_permission`) from upload failures (`upload_failed`)
- Changed image key prefix from `'projects'` to `'project-replies'` for better organization
- Fixed redirect URL hash handling (Next.js doesn't preserve URL.hash property)

**Reply Types Support:**
- Changed validation to require EITHER body text OR image (or both)
- Normalized empty body to empty string (database allows empty strings)
- Updated error message to reflect flexible requirements

**Error Logging:**
- Added console.error logs for debugging:
  - Empty body/image validation failures
  - Permission denied scenarios (with username and allowlist info)
  - Upload failures (with error details, file info, username)
  - Successful uploads (with image key and project ID)
  - Database insert failures (with project ID, user ID, body length, image status)

**Database Insert:**
- Uses `finalBody` (normalized empty string) instead of raw `body`
- Proper fallback handling if `image_key` column doesn't exist yet
- Logs success/failure for debugging

#### 2. Form Component: `src/components/CollapsibleReplyForm.js`

**Textarea Requirements:**
- Changed `required={!allowImageUpload}` - textarea is only required when image upload is disabled
- This allows image-only replies when `allowImageUpload={true}`

**Form Encoding:**
- Already correctly sets `encType="multipart/form-data"` when `allowImageUpload={true}`
- Image input field properly configured

#### 3. Error Display: `src/app/projects/[id]/page.js`

**Error Messages:**
- Added comprehensive error message mapping:
  - `upload_permission`: "You do not have permission to upload images. Your username may not be in the image upload allowlist."
  - `upload_failed`: "Image upload failed. Check server logs for details."
  - `missing`: "Reply text or image is required." (updated from "Comment text is required.")
  - Fallback for unknown error codes

#### 4. Error Logging: `src/components/ProjectRepliesSection.js`

**Client-Side Logging:**
- Added useEffect to log error notices to browser console for debugging
- Helps identify issues when testing

---

## Feed Sorting Fix

### Issue
- Feed was sorting by `createdAt` instead of `lastActivity`
- Projects with new replies weren't moving to the top of the feed

### Solution
**File**: `src/app/feed/page.js`
- Changed sort from: `.sort((a, b) => b.createdAt - a.createdAt)`
- To: `.sort((a, b) => (b.lastActivity || b.createdAt) - (a.lastActivity || a.createdAt))`
- Feed already calculates `last_activity_at` correctly using `MAX(project_replies.created_at)`
- Now properly uses this value for sorting

**Verification:**
- SQL query already includes: `COALESCE((SELECT MAX(project_replies.created_at) FROM project_replies WHERE project_replies.project_id = projects.id AND project_replies.is_deleted = 0), projects.created_at) AS last_activity_at`
- This value is mapped to `lastActivity` field in feed items
- Sort now uses `lastActivity` with fallback to `createdAt`

---

## Feed Layout Optimization

### Issue
- Inconsistent wrapping behavior on mobile
- Views/replies/likes were appearing under title/author instead of with date/time
- Event posts missing post time on mobile
- Desktop layout needed optimization to keep content in 2 rows

### Final Solution

#### Desktop Layout (≥768px):

**Regular Posts:**
- **Row 1:** Title + author (left) | Views/Replies/Likes (top right)
- **Row 2:** Date/time (bottom left) | Last activity (bottom right)

**Event Posts:**
- **Row 1:** Title + author (left) | Views/Replies/Likes (top right)
- **Row 2:** Attending list (bottom left) | Last activity (bottom right)
- Event info (start date/time) shown between rows

#### Mobile Layout (<768px):

**Regular Posts:**
- **Row 1:** Title + author
- **Row 2:** Date/time (left) | Views/Replies/Likes (right) - same row, opposite sides
- **Row 3:** Last activity (bottom right, separate row)

**Event Posts:**
- **Row 1:** Title + author
- **Row 2:** Post time (left) | Views/Replies/Likes (right) - same row, opposite sides
- **Row 3:** Event information (start date/time)
- **Row 4:** Attending list (left) | Last activity (right)

### Changes Made

#### 1. PostMetaBar Component: `src/components/PostMetaBar.js`

**Layout Structure:**
- **Row 1:** Title + author (left), Views/Replies/Likes (top right on desktop)
- **Row 2:** Date/time (left), Views/Replies/Likes (right on mobile), Last activity (right on desktop)
- **Row 3:** Last activity (mobile only, separate row)

**New Props:**
- Added `hideDateOnDesktop` prop - when true, hides date on desktop but shows on mobile (for events)

**CSS Classes:**
- `.post-meta-stats-desktop` - Stats on top right (desktop only)
- `.post-meta-stats-mobile` - Stats on right side of date row (mobile only)
- `.post-meta-last-activity` - Last activity inline on bottom right (desktop only)
- `.post-meta-last-activity-mobile` - Last activity on separate row (mobile only)
- `.post-meta-date-mobile-only` - Date hidden on desktop, shown on mobile (for events)

**Key Features:**
- Desktop tries to keep everything in 2 rows
- Mobile ensures date/time and stats stay on same row
- Responsive via CSS media queries (768px breakpoint)

#### 2. Feed Page: `src/app/feed/page.js`

**Event Handling:**
- Passes `hideDateOnDesktop={true}` for events
- PostMetaBar shows post time + stats row on mobile for events
- Event info displayed between PostMetaBar and attending list
- Attending list and last activity on same row (bottom row)

**Sorting:**
- Changed from sorting by `createdAt` to sorting by `lastActivity`
- Projects with new replies now move to top of feed

#### 3. Global CSS: `src/app/globals.css`

**Media Queries:**
- Desktop (≥768px):
  - Shows `.post-meta-stats-desktop` (stats on top right)
  - Hides `.post-meta-stats-mobile`
  - Shows `.post-meta-last-activity` (inline)
  - Hides `.post-meta-last-activity-mobile`
  - Hides `.post-meta-date-mobile-only` (for events)
- Mobile (<768px):
  - Hides `.post-meta-stats-desktop`
  - Shows `.post-meta-stats-mobile` (stats with date)
  - Hides `.post-meta-last-activity`
  - Shows `.post-meta-last-activity-mobile` (separate row)
  - Shows `.post-meta-date-mobile-only` (for events)

---

## Summary of All Files Modified

1. `src/app/api/projects/[id]/replies/route.js` - Image upload handling, error logging, flexible reply types, redirect hash fix
2. `src/components/CollapsibleReplyForm.js` - Made textarea optional when image upload enabled
3. `src/app/projects/[id]/page.js` - Updated error messages for new error codes (`upload_permission`, `upload_failed`, `missing`)
4. `src/components/ProjectRepliesSection.js` - Added error logging to browser console
5. `src/app/feed/page.js` - Fixed sorting by lastActivity, improved event layout, added `hideDateOnDesktop` prop for events
6. `src/components/PostMetaBar.js` - Complete layout restructure with responsive desktop/mobile layouts, added `hideDateOnDesktop` prop
7. `src/app/globals.css` - Added CSS media queries for responsive PostMetaBar behavior

---

## Testing Checklist

### Project Replies
- [x] Image-only replies work
- [x] Text-only replies work  
- [x] Combined text + image replies work
- [x] Error messages display correctly (permission, upload failure, missing)
- [x] Error logging works (browser console and server logs)

### Feed Functionality
- [x] Feed sorts by last activity (projects with new replies move to top)
- [x] Feed calculates `last_activity_at` correctly from project replies

### Feed Layout - Desktop
- [x] Regular posts: Title/author + stats (row 1), Date + last activity (row 2)
- [x] Event posts: Title/author + stats (row 1), Attending list + last activity (row 2)
- [x] Desktop keeps content in 2 rows when possible

### Feed Layout - Mobile
- [x] Regular posts: Title/author (row 1), Date + stats (row 2), Last activity (row 3)
- [x] Event posts: Title/author (row 1), Post time + stats (row 2), Event info (row 3), Attending + last activity (row 4)
- [x] Date/time and stats stay on same row (opposite sides)
- [x] No duplicate stats or dates
- [x] Consistent wrapping behavior

---

## Environment Variable Required

**`IMAGE_UPLOAD_ALLOWLIST`** - Must be set in Cloudflare Workers environment variables
- Format: Comma-separated usernames (case-insensitive) or `*` for all users
- Example: `ashley,geofryd,extrepa` or `*`

---

---

## Feed Sorting Fix

### Issue
- Feed was sorting by `createdAt` instead of `lastActivity`
- Projects with new replies weren't moving to the top of the feed

### Solution
**File**: `src/app/feed/page.js`
- Changed sort from: `.sort((a, b) => b.createdAt - a.createdAt)`
- To: `.sort((a, b) => (b.lastActivity || b.createdAt) - (a.lastActivity || a.createdAt))`
- Feed already calculates `last_activity_at` correctly using `MAX(project_replies.created_at)`
- Now properly uses this value for sorting

**Verification:**
- SQL query already includes: `COALESCE((SELECT MAX(project_replies.created_at) FROM project_replies WHERE project_replies.project_id = projects.id AND project_replies.is_deleted = 0), projects.created_at) AS last_activity_at`
- This value is mapped to `lastActivity` field in feed items
- Sort now uses `lastActivity` with fallback to `createdAt`

---

## Feed Layout Optimization

### Issue
- Inconsistent wrapping behavior on mobile
- Views/replies/likes were appearing under title/author instead of with date/time
- Event posts missing post time on mobile
- Desktop layout needed optimization

### Solution

#### Desktop Layout (≥768px):
**Regular Posts:**
- **Row 1:** Title + author (left) | Views/Replies/Likes (top right)
- **Row 2:** Date/time (bottom left) | Last activity (bottom right)

**Event Posts:**
- **Row 1:** Title + author (left) | Views/Replies/Likes (top right)
- **Row 2:** Attending list (bottom left) | Last activity (bottom right)
- Event info shown between rows

#### Mobile Layout (<768px):
**Regular Posts:**
- **Row 1:** Title + author
- **Row 2:** Date/time (left) | Views/Replies/Likes (right) - same row, opposite sides
- **Row 3:** Last activity (bottom right, separate row)

**Event Posts:**
- **Row 1:** Title + author
- **Row 2:** Post time (left) | Views/Replies/Likes (right) - same row, opposite sides
- **Row 3:** Event information (start date/time)
- **Row 4:** Attending list (left) | Last activity (right)

### Changes Made

#### 1. PostMetaBar Component: `src/components/PostMetaBar.js`

**New Layout Structure:**
- **Row 1:** Title + author (left), Views/Replies/Likes (top right on desktop)
- **Row 2:** Date/time (left), Views/Replies/Likes (right on mobile), Last activity (right on desktop)
- **Row 3:** Last activity (mobile only, separate row)

**New Props:**
- Added `hideDateOnDesktop` prop to hide date on desktop while showing on mobile (for events)

**CSS Classes Added:**
- `.post-meta-stats-desktop` - Shows stats on top right (desktop only)
- `.post-meta-stats-mobile` - Shows stats on right side of date row (mobile only)
- `.post-meta-last-activity` - Shows last activity inline on bottom right (desktop only)
- `.post-meta-last-activity-mobile` - Shows last activity on separate row (mobile only)
- `.post-meta-date-mobile-only` - Hides date on desktop, shows on mobile (for events)

#### 2. Feed Page: `src/app/feed/page.js`

**Event Handling:**
- Passes `hideDateOnDesktop={true}` for events so date shows on mobile but not desktop
- Event info displayed between PostMetaBar and attending list
- Attending list and last activity on same row (bottom row)

#### 3. Global CSS: `src/app/globals.css`

**Media Queries Added:**
- Desktop (≥768px): Shows desktop stats, hides mobile stats; shows inline last activity, hides mobile last activity row
- Mobile (<768px): Hides desktop stats, shows mobile stats; hides inline last activity, shows mobile last activity row
- Date visibility controlled for events (hidden on desktop, shown on mobile)

---

## Technical Details

### Image Upload Flow
1. Form submits with `multipart/form-data` encoding
2. API validates image file (checks for File object with size > 0)
3. Checks user permissions via `canUploadImages(user, env)`
4. Uploads to R2 bucket with key: `project-replies/{uuid}-{filename}`
5. Inserts reply with `image_key` (or falls back if column doesn't exist)
6. Redirects with error code if any step fails

### Feed Sorting Algorithm
- Calculates `last_activity_at` using SQL: `MAX(project_replies.created_at)`
- Falls back to `projects.created_at` if no replies exist
- Sorts feed items by `lastActivity` descending
- Projects with recent replies automatically move to top

### Responsive Layout Strategy
- Uses CSS media queries with 768px breakpoint
- Desktop: Optimized for 2-row layout
- Mobile: Allows natural wrapping while maintaining structure
- Different CSS classes control visibility per breakpoint
- PostMetaBar handles both layouts with conditional rendering

## Notes

- All changes are backward compatible (fallbacks for missing columns)
- Error logging added throughout for easier debugging
- Mobile-first responsive design improvements
- Consistent wrapping behavior across all screen sizes
- Desktop layout optimized to keep content in 2 rows when possible
- Mobile layout ensures date/time and stats stay on same row
- Event posts properly show post time on mobile without duplicates
- Feed automatically updates when new replies are posted
- Desktop layout optimized to keep content in 2 rows when possible
- Mobile layout ensures date/time and stats stay on same row
- Event posts properly show post time on mobile without duplicates
