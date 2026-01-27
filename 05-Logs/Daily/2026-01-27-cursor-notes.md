# Development Notes - January 27, 2026

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

## Feed Mobile Layout Improvements

### Issue
- Inconsistent wrapping behavior on mobile
- Views/replies/likes were appearing under title/author instead of with date/time
- Event information and attending lists were wrapping unpredictably

### Solution

#### 1. PostMetaBar Component: `src/components/PostMetaBar.js`

**New Layout Structure:**
- **Row 1**: Title + "by [author]" (always together, wraps together)
- **Row 2**: Date/time on left, views/replies/likes on right (same row, wraps together)
- **Row 3**: Last activity (bottom right, only if present)

**Changes:**
- Removed views/replies/likes from top row
- Moved them to second row alongside date/time
- Last activity moved to its own row, right-aligned
- Updated component documentation

#### 2. Feed Event Handling: `src/app/feed/page.js`

**Event Post Layout:**
- **Row 1**: Title + author (from PostMetaBar)
- **Row 2**: Date/time + views/replies/likes (from PostMetaBar)
- **Row 3**: Event information (calendar icon + start date/time) - separate row
- **Row 4**: Attending list - separate row (if attendees exist)
- **Row 5**: Last activity - bottom right (if present)

**Changes:**
- Event info moved to its own row (not inline with attending list)
- Attending list moved to separate row below event info
- Last activity for events shown separately (not in PostMetaBar for events)
- Better spacing and wrapping behavior

---

## Summary of All Files Modified

1. `src/app/api/projects/[id]/replies/route.js` - Image upload handling, error logging, flexible reply types
2. `src/components/CollapsibleReplyForm.js` - Made textarea optional when image upload enabled
3. `src/app/projects/[id]/page.js` - Updated error messages for new error codes
4. `src/components/ProjectRepliesSection.js` - Added error logging to console
5. `src/app/feed/page.js` - Fixed sorting by lastActivity, improved event layout
6. `src/components/PostMetaBar.js` - Restructured layout for consistent mobile wrapping

---

## Testing Checklist

- [x] Image-only replies work
- [x] Text-only replies work  
- [x] Combined text + image replies work
- [x] Error messages display correctly
- [x] Feed sorts by last activity (projects with new replies move to top)
- [x] Mobile layout wraps consistently
- [x] Event posts display correctly with proper row structure
- [x] Last activity shows in bottom right for all post types

---

## Environment Variable Required

**`IMAGE_UPLOAD_ALLOWLIST`** - Must be set in Cloudflare Workers environment variables
- Format: Comma-separated usernames (case-insensitive) or `*` for all users
- Example: `ashley,geofryd,extrepa` or `*`

---

## Notes

- All changes are backward compatible (fallbacks for missing columns)
- Error logging added throughout for easier debugging
- Mobile-first responsive design improvements
- Consistent wrapping behavior across all screen sizes
