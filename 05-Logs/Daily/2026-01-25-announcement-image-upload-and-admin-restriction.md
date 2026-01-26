# Announcement Image Upload and Admin-Only Restriction - January 25, 2026

## Summary
Added image upload capability to announcement posts and restricted announcement creation to admin users only. This ensures only admins can post announcements while allowing them to include images for better visual communication.

## Changes Made

### 1. Timeline API Route (`src/app/api/timeline/route.js`)

#### Admin-Only Restriction
- **Added import**: `import { isAdminUser } from '../../../lib/admin'`
- **Admin check**: Added validation after password check (lines 17-20)
  - If user is not admin, redirects to `/announcements` with `error=admin_required`
  - Prevents non-admin users from creating announcements via API

#### Image Upload Support
- **Added imports**: 
  - `getCloudflareContext` from `@opennextjs/cloudflare`
  - `buildImageKey, canUploadImages, getUploadsBucket, isAllowedImage` from `../../../lib/uploads`
- **Image handling** (lines 31-51):
  - Extracts image file from form data
  - Validates image using `isAllowedImage()` (checks size ≤5MB and image/* MIME type)
  - Checks upload permissions using `canUploadImages(user, env)` (respects IMAGE_UPLOAD_ALLOWLIST)
  - Uploads to R2 bucket with key prefix `timeline-updates`
  - Stores `image_key` in database (or `null` if no image)

#### Redirect Update
- Changed redirect from `/timeline` to `/announcements` (line 10)
- Ensures users stay on announcements page after posting

#### Database Insert
- Updated INSERT statement to include `image_key` (line 58)
- Stores image key or `null` if no image uploaded

### 2. Announcements Page (`src/app/announcements/page.js`)

#### Admin-Only Restriction
- **Added import**: `import { isAdminUser } from '../../lib/admin'`
- **Updated `canCreate` logic** (line 121):
  - Changed from: `!!user && !!user.password_hash`
  - Changed to: `!!user && !!user.password_hash && isAdminUser(user)`
  - "New Announcement" button is now disabled for non-admin users

#### Image Upload UI
- **Enabled image field**: Changed `showImage={false}` to `showImage={true}` (line 135)
- Users can now select an image file when creating announcements
- Image upload is optional (not required)

#### Error Handling
- **Added error message** (lines 109-110):
  - `error === 'admin_required'` → `'Only admins can post announcements.'`
- Displays appropriate message when non-admin users attempt to post

### 3. Existing Display Support (No Changes Needed)

#### Detail Page (`src/app/announcements/[id]/page.js`)
- Already displays images: Line 200 shows `<img src={`/api/media/${update.image_key}`} ... />`
- Images render correctly when `image_key` is present

#### List Page (`src/app/timeline/TimelineClient.js`)
- Already displays image thumbnails: Lines 71-77 show images in list view
- Images appear in announcement list when present

## Security Considerations

### Admin Restriction
- **Frontend**: Button disabled for non-admins (`canCreate` check)
- **Backend**: API route validates admin status before processing
- **Defense in depth**: Both frontend and backend enforce the restriction

### Image Upload Security
- **File validation**: Size limit (5MB) and MIME type checking
- **Permission check**: Respects `IMAGE_UPLOAD_ALLOWLIST` environment variable
- **Storage**: Images stored in R2 bucket with unique keys
- **Access**: Images served via `/api/media/[...key]/route.js` (existing route)

## Important Notes

### Image Upload Permissions
⚠️ **Admin users must be in `IMAGE_UPLOAD_ALLOWLIST` to upload images**

The `canUploadImages()` function checks:
- If `IMAGE_UPLOAD_ALLOWLIST` is `*`, all signed-in users can upload
- If it's a comma-separated list, only usernames in that list can upload
- Admin users need to be explicitly listed (or use `*`)

**Recommendation**: Ensure admin usernames are in the allowlist, or set `IMAGE_UPLOAD_ALLOWLIST=*` if all signed-in users should be able to upload.

### Error Flow
1. Non-admin user clicks "New Announcement" → Button is disabled (frontend)
2. Non-admin user bypasses frontend → API returns `error=admin_required` → Redirects to announcements page with error message
3. Admin user uploads invalid image → API validates and returns appropriate error (`too_large`, `invalid_type`, or `upload`)
4. Admin user uploads valid image but not in allowlist → API returns `error=upload`

## Testing Checklist

- [x] Admin can create announcement without image
- [x] Admin can create announcement with image
- [x] Non-admin cannot create announcement (button disabled)
- [x] Non-admin cannot bypass frontend (API rejects)
- [x] Images display correctly on announcement detail page
- [x] Images display correctly in announcement list
- [x] Image validation works (size, type)
- [x] Upload permission check works (allowlist)
- [x] Error messages display correctly
- [x] Redirect goes to `/announcements` after posting

## Database Schema
No migrations required. The `timeline_updates` table already has:
- `image_key TEXT` column (existing)
- All other required fields

## Files Changed
1. `src/app/api/timeline/route.js` - Added admin check and image upload
2. `src/app/announcements/page.js` - Added admin restriction and enabled image upload

## Backward Compatibility
- ✅ Existing announcements without images continue to work
- ✅ Existing image display code already handles `image_key` field
- ✅ No breaking changes to API or database schema

## Deployment Notes
- No migrations required
- Ensure `IMAGE_UPLOAD_ALLOWLIST` includes admin usernames (or is set to `*`)
- All changes are backward compatible
