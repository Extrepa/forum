# Development Notes - January 28, 2026

## Summary
Finalized avatar integration across the platform, including global username display, refined account previews, and enhanced customization logic. Implemented site-wide avatar visibility in post headers and interactive mini-profile popovers for all username clicks.

## Site-Wide Avatar & Profile Preview Implementation

### 1. Post Header Avatar Integration
- **File**: `src/components/PostHeader.js`
- **Changes**:
  - Added `authorAvatarKey` prop.
  - Passes `authorAvatarKey` to the `Username` component to display the avatar next to the name.
- **Pages Updated**: Updated 13 detail pages (Lobby, Devlog, Music, Projects, Announcements, Events, Art, Bugs, Rant, Nostalgia, Memories, Lore, Lore-Memories) to fetch `users.avatar_key` and pass it to `PostHeader`.
- **Visibility Policy**: Avatars are explicitly enabled for post headers but remain disabled (null `avatarKey`) for replies, comments, feeds, and the home page to maintain the requested focus.

### 2. Mini Profile Preview Popover
- **New Component**: `src/components/UserPopover.js`
- **New API Route**: `src/app/api/user/[username]/route.js`
- **Changes**:
  - Clicking any username now opens a "mini profile preview" instead of immediate navigation.
  - The popover displays the user's custom avatar, their username in their selected color, and a "View Profile" link.
  - If the `avatarKey` isn't immediately available (e.g., in a comment), the popover fetches the user's data from the new API route.
  - Implemented smooth animation (`popoverIn`) and outside-click detection for closing.

### 3. Username Component Interactive Update
- **File**: `src/components/Username.js`
- **Changes**:
  - Converted the username to a button-like trigger for the `UserPopover`.
  - Used `e.preventDefault()` to stop immediate navigation, allowing the user to interact with the popover first.
  - Maintained the existing color coding and styling logic while adding the popover anchor.

## Avatar Integration Finalization (Earlier Today)

### 1. Global Username Component Refinement
- **File**: `src/components/Username.js`
- **Changes**:
  - Standardized URL generation using the `getAvatarUrl` utility.
  - Added `inline-flex` and `align-items: center` for perfect alignment.
  - Ensured consistent gap between avatar and username.

### 2. Standardized Media Utilities
- **File**: `src/lib/media.js`
- **Changes**:
  - Created `getAvatarUrl(avatarKey)` to centralize avatar image path resolution.
  - Handles null/undefined keys safely, construction API paths like `/api/media/avatars/`.

### 3. Account & Profile Integration
- **File**: `src/app/account/AccountTabsClient.js`
  - Integrated `getAvatarUrl` for consistent preview rendering.
  - Restored large preview and mini-preview on the account page so users can see their avatar before editing.
- **File**: `src/app/profile/[username]/page.js`
  - Implemented the `ProfileAvatarHero` with a dynamic parallax effect.
  - Background aura, drop shadow, and text shadows now match the user's chosen outline color.

### 3. Default Avatar & Visual Consistency
- **New Asset**: `public/icons/default-avatar.svg`
- **Changes**:
  - Implemented a default avatar SVG that matches the "Reset" state (white face, black features).
  - Updated `src/lib/media.js` to return this default SVG path when a user hasn't set an avatar (`avatarKey` is null or empty).
  - Synchronized the `INITIAL_LAYERS` in `src/components/AvatarCustomizer.js` to match the default SVG colors (`#ffffff` face, `#0a0a0a` features).
  - Fixed a bug on the Profile page where a default avatar was showing next to the username despite the big hero version above it.
  - Fixed a similar issue on the Account page (Profile tab) where the small avatar was appearing next to the username; it is now hidden to avoid redundancy with the preview above it.

## Verification Checklist
- [x] Username avatars display correctly in post headers.
- [x] Clicking a username anywhere opens the mini profile preview.
- [x] Mini profile preview shows the custom avatar and a link to the profile.
- [x] Avatars do not appear in replies, comments, or feeds (except when clicked for the popover).
- [x] Users who haven't set an avatar now display the "default" (white/black) look.
- [x] Database queries on all 13 detail pages fetch the `avatar_key`.
- [x] Parallax effect and color-matching on profile pages remain functional.
- [x] Account page previews are restored and accurate.
- [x] Profile page no longer shows a redundant small avatar next to the username.
- [x] Resetting in the customizer correctly reverts to the white/black default look.
