# 2026-02-02 - Cursor Notes

## Recent Changes

Our recent work, which involved numerous "Update forum application" commits and a dedicated "Profile edit flow, guestbook, gallery" commit, primarily focused on enhancing the user profile page and refining the overall forum UI/UX.

### Profile Page Enhancements
- **Unified ProfileSongPlayer:** Integrated and unified the rendering of `ProfileSongPlayer` across YouTube, SoundCloud, and Spotify, ensuring consistent styling (compact/full), sizing, embed iframe support, and stabilized autoplay/pause behavior.
- **Public Profile Layout:** Ensured consistent header order (username → role → mood → song), pinned player to the top-right on desktop, and maintained a stacked column layout on mobile.
- **Edit Profile Mini-Preview:** Refined the compact bar preview, tightened play/pause visibility, and ensured clean truncation of long song/provider labels.
- **Profile Extras Persistence:** Implemented saving and reading back mood, song, and headline data via `profile-extras` GET/POST APIs, with rollout-safe fallbacks for missing columns.
- **Gallery & Notes:** Limited gallery uploads to 10 with modal previews, renamed "Guestbook" to "Notes," and compacted the delete button.
- **Cover Modes:** Added cover mode buttons (fill/fit/stretch), new API, and migration for profile header cover images.

### UI/UX Improvements
- **Username Hover/Popup:** Tightened the hover hitbox to prevent accidental popover triggers and ensured fixed popover positioning.
- **Notifications Panel:** Stabilized popover width and alignment, preventing unexpected shrinking on mobile/desktop.
- **Follow-up UI Fixes:** Addressed double borders on profile player embeds, tightened notifications popover to content, and fixed username popover width.
- **Popover Polish:** Restyled notifications panel buttons, resized user hover card, and adjusted typography.
- **Layout and Responsiveness:** Resolved issues with vertical stacking, layout clipping (especially on edit-profile screens), and ensured usernames display horizontally on all viewport sizes. Addressed mobile overflow issues in `Account/Edit profile` and tab rows.

### Tab and Content Management
- **Tabs + Defaults:** Implemented default profile tab behavior to support "no default selected" and ensured the pill indicator hides when none is set. Tabs were reordered alphabetically and padding tightened.
- **Stats + Activity Parity:** Ensured consistency between account edit and public profile stats/labels (including total contribution) and verified recent activity list behavior.
- **Edit Profile Tabs:** Added Username/Avatar sub-tabs and removed header buttons to reduce clutter.

These changes collectively aimed to improve the visual consistency, responsiveness, and overall user experience of the forum's profile and notification features.
