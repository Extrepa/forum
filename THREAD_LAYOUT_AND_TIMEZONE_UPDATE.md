# Thread Layout and Timezone Update

## Summary
Reorganized forum thread layout to unify post and replies into a single section (Reddit-style), and fixed timezone display to show PST/PDT times correctly.

## Changes Made

### 1. Created Date Formatting Utility (`src/lib/dates.js`)
**New file** - Centralized date/time formatting functions:
- `formatDateTime(timestamp)`: Formats timestamps to PST/PDT timezone with 12-hour format
  - Uses `America/Los_Angeles` timezone (handles PST/PDT automatically)
  - Format: `M/D/YYYY, H:MM AM/PM`
  - Example: `1/19/2026, 8:01 PM`
- `formatTimeAgo(timestamp)`: Formats relative time (e.g., "2 hours ago")
  - Used for home page section stats

**Key Features:**
- Consistent timezone handling across the application
- Automatically handles daylight saving time (PST/PDT)
- Reusable utility for future date formatting needs

### 2. Unified Thread Layout (`src/app/forum/[id]/page.js`)
**Restructured** - Combined original post and replies into one unified section:

**Before:**
- Two separate `<section className="card">` elements
- Original post in first card
- Replies in second card below

**After:**
- Single `<section className="card thread-container">` element
- Original post in `.thread-post` div (with bottom border separator)
- Replies section in `.thread-replies` div
- All content flows together in one unified card

**Structure:**
```
<section className="card thread-container">
  <div className="thread-post">
    <!-- Original post content -->
  </div>
  <div className="thread-replies">
    <h3>Replies (count)</h3>
    <div className="replies-list">
      <!-- Reply items -->
    </div>
    <form className="reply-form">
      <!-- Reply form -->
    </form>
  </div>
</section>
```

**Date Formatting Updates:**
- Replaced `new Date(thread.created_at).toLocaleString()` with `formatDateTime(thread.created_at)`
- Replaced `new Date(reply.created_at).toLocaleString()` with `formatDateTime(reply.created_at)`
- All dates now display in PST/PDT timezone

### 3. CSS Styling Updates (`src/app/globals.css`)
**Added** - New CSS classes for unified thread layout:

**Thread Container:**
- `.thread-container`: Flex container for unified layout
- `.thread-post`: Original post section with bottom border separator
- `.thread-replies`: Replies section container
- `.replies-list`: Container for reply items list

**Reply Styling:**
- `.reply-form`: Form styling with top border separator
- Maintained existing `.reply-item`, `.reply-meta`, `.reply-author`, `.reply-time`, `.reply-body` styles

**Visual Improvements:**
- Subtle border separators between post and replies
- Consistent spacing and padding
- Unified visual flow (Reddit-style)

## Technical Details

### Timezone Handling
- **Timezone**: `America/Los_Angeles` (PST/PDT)
- **Format**: 12-hour format with AM/PM
- **Automatic DST**: JavaScript's `toLocaleString` with `timeZone` option automatically handles daylight saving time transitions
- **Locale**: `en-US` for consistent formatting

### Layout Flow
1. **Original Post**: Displayed at top with title, author, timestamp, image (if any), and body
2. **Visual Separator**: Border between post and replies
3. **Replies Header**: Shows count of replies
4. **Replies List**: All replies displayed in chronological order
5. **Reply Form**: Always visible at bottom, separated by border
6. **Empty State**: "No replies yet" message when no replies exist

## Files Modified
1. `src/lib/dates.js` (NEW) - Date formatting utility
2. `src/app/forum/[id]/page.js` - Thread page layout and date formatting
3. `src/app/globals.css` - Thread container and reply styling

## Verification Checklist
- ✅ Timezone set to PST/PDT (`America/Los_Angeles`)
- ✅ All dates use `formatDateTime()` utility
- ✅ Thread layout unified into single card
- ✅ Visual separators between post and replies
- ✅ Reply form positioned at bottom
- ✅ No linter errors
- ✅ Consistent styling with existing theme

## Notes
- The timezone is hardcoded to PST/PDT. If timezone detection is needed in the future, client-side JavaScript would be required to detect user's timezone and format accordingly.
- The unified layout creates a more cohesive reading experience similar to Reddit's thread view.
- All date formatting is now centralized in the `dates.js` utility for easy maintenance and consistency.
