# SoundCloud Embed Style Implementation Notes
## Date: 2026-01-21

## Overview

Implemented dynamic embed height system for SoundCloud posts, allowing users to choose between compact (166px) and full (450px) player styles, with automatic detection for playlists vs single tracks.

## Implementation Summary

### Features
1. **Auto-detection**: Automatically detects if SoundCloud URL is a playlist (`/sets/`) or single track
2. **Manual override**: Users can choose "Auto", "Compact", or "Full" embed style
3. **Database storage**: Embed style preference is stored in `music_posts.embed_style` column
4. **Dynamic heights**: CSS classes and inline styles adjust embed height based on selection
5. **Rollout-safe**: All database queries include try/catch fallbacks for missing columns

## Files Modified

### Core Logic
- **`src/lib/embeds.js`**
  - Added `isSoundCloudPlaylist()` function to detect playlists
  - Updated `safeEmbedFromUrl()` to accept `embedStyle` parameter
  - Returns `height` and `aspect` (CSS class) based on style selection
  - Auto-detection: playlists → full (450px), tracks → compact (166px)

### Form Component
- **`src/components/MusicPostForm.js`**
  - Added `embedStyle` state (defaults to 'auto')
  - Added "Player style" dropdown (only shows for SoundCloud)
  - Shows detection message: "Detected: Playlist/Track - will use X player"
  - Preview updates in real-time based on selection
  - Form submits `embed_style` field

### API Route
- **`src/app/api/music/posts/route.js`**
  - Reads `embed_style` from form data (defaults to 'auto')
  - Validates embed with selected style
  - Rollout-safe INSERT: tries with `embed_style`, falls back to old query if column missing
  - Stores embed style preference in database

### Database
- **`migrations/0020_music_embed_style.sql`**
  - Adds `embed_style TEXT DEFAULT 'auto'` column to `music_posts` table
  - Default value ensures backward compatibility

### Display Components
- **`src/app/music/page.js`**
  - Updated SELECT queries to include `embed_style` (with rollout-safe fallback)
  - Maps posts with `safeEmbedFromUrl(type, url, embed_style || 'auto')`
  - Passes embed style to client component

- **`src/app/music/[id]/page.js`**
  - Updated SELECT query to include `embed_style`
  - Uses stored embed style when rendering embed
  - Applies dynamic height via inline styles

- **`src/app/music/MusicClient.js`**
  - Applies dynamic height to embed frames via inline styles
  - Uses `embed.height` property from embed object

### CSS
- **`src/app/globals.css`**
  - Added `.embed-frame.soundcloud-compact` (166px height)
  - Added `.embed-frame.soundcloud-full` (450px height)
  - Kept legacy `.embed-frame.soundcloud` (450px) for backward compatibility
  - Mobile responsive: compact (150px), full (400px)

### Modal
- **`src/app/music/page.js`**
  - Changed modal to `variant="wide"` (900px) to accommodate taller embeds

## Technical Details

### Embed Style Options
- **`auto`** (default): Automatically chooses based on URL
  - Playlists (`/sets/` in URL) → full (450px)
  - Single tracks → compact (166px)
- **`compact`**: Always uses 166px height (good for single tracks)
- **`full`**: Always uses 450px height (shows tracklist/comments)

### Height Values
- **Desktop**: Compact = 166px, Full = 450px
- **Mobile**: Compact = 150px, Full = 400px

### CSS Class Names
- Compact embeds use class: `embed-frame soundcloud-compact`
- Full embeds use class: `embed-frame soundcloud-full`
- Legacy embeds (no style stored) use: `embed-frame soundcloud` (defaults to full)

### Detection Logic
```javascript
function isSoundCloudPlaylist(url) {
  // Checks if URL pathname contains '/sets/'
  return parsed.pathname.includes('/sets/');
}
```

## Rollout Safety

All database operations are rollout-safe:
1. **API INSERT**: Tries new query with `embed_style`, falls back to old query if column missing
2. **SELECT queries**: Primary query includes `embed_style`, fallback query omits it (uses default 'auto')
3. **Display logic**: Always provides fallback `|| 'auto'` when using embed_style

## Migration Required

**File**: `migrations/0020_music_embed_style.sql`

**Command**:
```bash
npx wrangler d1 execute errl_forum_db --remote --file=./migrations/0020_music_embed_style.sql
```

**What it does**: Adds `embed_style TEXT DEFAULT 'auto'` column to `music_posts` table.

## Testing Checklist

### Form Testing
- [ ] Select SoundCloud → Player style dropdown appears
- [ ] Paste single track URL → Auto detects "Single track - will use compact player"
- [ ] Paste playlist URL → Auto detects "Playlist - will use full player"
- [ ] Select "Compact" → Preview shows 166px height
- [ ] Select "Full" → Preview shows 450px height
- [ ] Select "Auto" with playlist → Preview shows 450px height
- [ ] Select "Auto" with track → Preview shows 166px height
- [ ] Submit form → Post is created with selected style

### Display Testing
- [ ] New post with compact style → Shows 166px embed on detail page
- [ ] New post with full style → Shows 450px embed on detail page
- [ ] New post with auto style (playlist) → Shows 450px embed
- [ ] New post with auto style (track) → Shows 166px embed
- [ ] Old posts (no embed_style) → Default to 'auto' behavior
- [ ] Listing page → Embeds show correct heights
- [ ] Mobile view → Compact (150px) and Full (400px) work correctly

### Edge Cases
- [ ] YouTube posts → No embed style selector (correct)
- [ ] Invalid SoundCloud URL → Shows error (correct)
- [ ] Missing embed_style column → Falls back gracefully (rollout-safe)
- [ ] Empty embed_style value → Defaults to 'auto'

## Known Issues / Future Improvements

### Current Limitations
1. **No edit capability**: Once posted, embed style cannot be changed (would need edit functionality)
2. **Admin tools**: `admin/move` and `seed-test-posts` don't set embed_style (use defaults)
3. **Search results**: May not include embed_style in queries (uses default 'auto')

### Potential Enhancements
1. Add edit functionality to change embed style after posting
2. Update admin tools to support embed_style
3. Add embed_style to search result queries
4. Consider adding more embed styles (e.g., "mini" at 100px)

## Code Quality

- ✅ No linter errors
- ✅ Rollout-safe database queries
- ✅ Proper error handling
- ✅ Consistent naming conventions
- ✅ Follows existing code patterns
- ✅ Mobile responsive

## Files Summary

### New Files (1)
- `migrations/0020_music_embed_style.sql`

### Modified Files (8)
1. `src/lib/embeds.js` - Core embed logic
2. `src/components/MusicPostForm.js` - Form with style selector
3. `src/app/api/music/posts/route.js` - API with rollout-safe INSERT
4. `src/app/music/page.js` - Listing page with embed_style
5. `src/app/music/[id]/page.js` - Detail page with embed_style
6. `src/app/music/MusicClient.js` - Client component with dynamic heights
7. `src/app/globals.css` - CSS classes for compact/full
8. `src/components/CreatePostModal.js` - Wider modal (from previous fix)

## Bugs Fixed During Review

1. **Fixed**: `soundCloudPlayerSrc()` was being called with `embedStyle` parameter that doesn't exist
2. **Fixed**: First query in `music/page.js` was missing `embed_style` in SELECT
3. **Fixed**: Fallback query in `music/[id]/page.js` now sets `embed_style = null` for proper default handling

## Verification Status

- ✅ All code reviewed
- ✅ All queries updated
- ✅ All bugs fixed
- ✅ Rollout safety verified
- ✅ CSS classes verified
- ✅ Form logic verified
- ✅ Display logic verified
- ✅ No linter errors
- ⚠️ Migration not yet applied (needs to be run)

## Next Steps

1. **Apply migration**: Run `0020_music_embed_style.sql` on production database
2. **Test thoroughly**: Verify all scenarios work as expected
3. **Monitor**: Check for any issues with existing posts (should default to 'auto')
4. **Document**: Update user-facing docs if needed
