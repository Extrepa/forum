# Forum Redesign Implementation Notes

## Overview
Complete redesign of the forum to use a Reddit-style threaded discussion model with modal post creation, conditional home page flow, search functionality, and a dedicated "Shitposts" section for image-heavy content.

## ✅ Completed Features

### 1. Forum Threading System (Reddit-style)
- **Thread Detail Pages**: `/forum/[id]/page.js` - Full thread view with replies
- **Replies API**: `/api/forum/[id]/replies/route.js` - Handles posting replies
- **Clickable Posts**: Forum list page shows post previews that link to detail pages
- **Reply Counts**: Displayed on list items
- **Database**: Uses existing `forum_threads` and `forum_replies` tables

**Files:**
- `src/app/forum/[id]/page.js` - Thread detail page
- `src/app/api/forum/[id]/replies/route.js` - Reply posting API
- `src/app/forum/ForumClient.js` - Client component with clickable posts

### 2. Home Page Conditional Flow
- **Username Check**: Uses `getSessionUser()` to check if user has claimed username
- **Conditional Rendering**: 
  - Shows username claim form ONLY if no username claimed
  - Shows "Where to start" section ONLY after username is claimed
- **Clickable Links**: All "Where to start" items are clickable buttons linking to sections

**Files:**
- `src/app/page.js` - Conditional rendering based on username status

### 3. Modal Post Creation
- **Modal Component**: `CreatePostModal.js` - Reusable modal with backdrop, close button
- **All Sections Updated**: Forum, Timeline, Events, Music, Projects, Shitposts
- **Posts First**: All sections show posts immediately, form is in modal
- **Create Post Button**: Consistent button placement in header of each section

**Files:**
- `src/components/CreatePostModal.js` - Modal component
- `src/app/forum/ForumClient.js` - Uses modal
- `src/app/timeline/TimelineClient.js` - Uses modal
- `src/app/events/EventsClient.js` - Uses modal
- `src/app/music/MusicClient.js` - Uses modal
- `src/app/projects/ProjectsClient.js` - Uses modal (admin only)
- `src/app/shitposts/ShitpostsClient.js` - Uses modal

### 4. Shitposts Section
- **New Page**: `/shitposts/page.js` - Shows only posts with images
- **API Route**: `/api/shitposts/route.js` - Handles image uploads
- **Image Upload**: Only section that allows image uploads
- **Navigation**: Added to header and home page

**Files:**
- `src/app/shitposts/page.js` - Shitposts listing page
- `src/app/shitposts/ShitpostsClient.js` - Client component
- `src/app/api/shitposts/route.js` - Image upload API

### 5. Image Upload Restrictions
- **Removed from**: Forum (General), Timeline (Announcements), Events
- **API Protection**: All three API routes reject image uploads with error message
- **Only Allowed**: Shitposts section

**Files:**
- `src/app/api/threads/route.js` - Rejects images
- `src/app/api/timeline/route.js` - Rejects images
- `src/app/api/events/route.js` - Rejects images
- `src/app/api/shitposts/route.js` - Allows images

### 6. Search Functionality
- **Search Page**: `/search` - Full search interface
- **Search Bar**: Added to header for quick access
- **Multi-Table Search**: Searches across:
  - Forum threads (General)
  - Timeline updates (Announcements)
  - Events
  - Music posts (including tags)
  - Projects
  - Forum replies (with thread context)
- **Results Display**: Shows type, author, date, preview, with links to original posts

**Files:**
- `src/app/search/page.js` - Search page wrapper
- `src/app/search/SearchResults.js` - Server-side search queries
- `src/app/search/SearchClient.js` - Client-side search UI
- `src/components/SearchBar.js` - Header search bar

### 7. Renamed "Forum" to "General"
- **Navigation**: Updated link text
- **Page Title**: Changed to "General"
- **Description**: Updated to clarify it's for general discussion
- **Home Page**: Updated "Where to start" section
- **Search Results**: Updated type labels

**Files:**
- `src/app/forum/ForumClient.js` - Updated titles and descriptions
- `src/app/layout.js` - Updated navigation
- `src/app/page.js` - Updated home page
- `src/app/search/SearchClient.js` - Updated labels

## Section Structure Verification

All sections follow the same pattern:
1. ✅ **Posts shown first** - List of posts is the first thing users see
2. ✅ **Create Post button** - Button in header opens modal
3. ✅ **Modal form** - Post creation happens in modal, not inline

**Sections:**
- ✅ General (formerly Forum) - Text-only posts, general discussion
- ✅ Announcements (Timeline) - Text-only posts, official updates
- ✅ Events - Text-only posts, event planning
- ✅ Music - Music posts with embeds (has own form)
- ✅ Projects - Project listings (admin-only creation)
- ✅ Shitposts - Image-enabled posts, free-form content

## Database Schema
- Uses existing tables: `forum_threads`, `forum_replies`, `timeline_updates`, `events`, `music_posts`, `projects`
- `forum_threads.image_key` - Used to identify shitposts (posts with images)
- All tables have proper indexes (from migrations)

## API Routes Summary

| Route | Method | Purpose | Image Upload |
|-------|--------|---------|--------------|
| `/api/threads` | POST | Create General post | ❌ Rejected |
| `/api/timeline` | POST | Create Announcement | ❌ Rejected |
| `/api/events` | POST | Create Event | ❌ Rejected |
| `/api/shitposts` | POST | Create Shitpost | ✅ Allowed |
| `/api/forum/[id]/replies` | POST | Reply to thread | N/A |
| `/api/music/posts` | POST | Create Music post | ✅ (existing) |
| `/api/projects` | POST | Create Project | ✅ (existing, admin only) |

## Navigation Structure

Header Navigation:
- Home
- Announcements
- Events
- General (formerly Forum)
- Shitposts
- Music
- Projects
- Search

Header Right:
- Search Bar (quick search)
- Forum Logo
- Session Badge

## Known Issues / Notes

1. **Search Page**: Fixed duplicate code issue - now properly uses Suspense boundary
2. **Shitposts Query**: Filters by `image_key IS NOT NULL` to show only image posts
3. **General Section**: Shows all forum_threads (both with and without images), but only non-image posts can be created there
4. **Reply System**: Only available for General/Forum threads (not for Announcements, Events, etc.)

## Testing Checklist

- [x] Forum threading - posts are clickable, detail pages work
- [x] Replies - can post replies, they display correctly
- [x] Home page - shows claim form only if no username
- [x] Home page - shows "Where to start" only after username claimed
- [x] All sections - posts shown first
- [x] All sections - Create Post button opens modal
- [x] Image uploads - rejected in General, Timeline, Events
- [x] Image uploads - allowed in Shitposts
- [x] Search - works across all content types
- [x] Navigation - all links work correctly
- [x] Renamed Forum to General throughout

## Future Considerations

- Could add reply system to other sections (Announcements, Events)
- Could add upvote/downvote system (currently not implemented per user request)
- Could add pagination for search results
- Could add filtering by content type in search
