# Changes Since Development Update #7
(Covering changes from Jan 31, 2026 to Feb 3, 2026)

## Profile Overhaul
Significant updates to the user profile experience, introducing customization and new social features.

### New Features
- **Guestbook**: Users can now leave messages on other users' profiles (Migration 0056).
- **Gallery**: Users can upload/link images to a personal gallery tab (Migration 0057).
- **Profile Customization**:
  - **Mood & Song**: Set a current mood and profile song (Migration 0054).
  - **Headline**: distinct from bio.
  - **Default Tab**: Users can choose which tab (Feed, About, Guestbook, Gallery) opens by default (Migration 0055).
  - **Display Settings**: Options to control visibility of elements like User Role (Migration 0059).

### UI/UX
- **Tabbed Interface**: Implemented `ProfileTabsClient` and `AccountTabsClient` for navigating profile sections.
- **Avatar & Popovers**: Enhanced `AvatarCustomizer`, `AvatarImage`, and `UserPopover` components.
- **Styling**: Extensive updates to `globals.css` to support the new profile layout and themes.

## Notifications
- Updates to `NotificationsMenu` and the notifications API (`src/app/api/notifications/route.js`).

## Other Changes
- **Easter Eggs**: Added `errl-bubbles-header.html` and updated `SiteHeader.js`.
- **Music**: Updates to `MusicPostForm` and `ProfileSongPlayer`.
- **Infrastructure**: Added various API routes to support the new profile data (`profile-extras`, `profile-show-role`, `guestbook`, `gallery`).
