# Errl Portal Forum - Development Update #11

Hey everyone. This update covers work completed on February 16, 2026 and beyond. Focus areas were private messaging (DMs), threaded comments across more sections, the Errl Boombox experiment, notification controls, and a lot of mobile and layout polish.

## New Features

### Private Messaging (DMs)
- The Messages page is now fully functional. You can send direct messages to other users and have group conversations with multiple recipients.
- Admin broadcast: Admins can send messages to a role (all users, Driplets, Drip Nomads, Mods, or Admins).
- In-app notifications when you receive a DM, with links that open the conversation.
- Leave a conversation or (admin) delete it when needed.
- New notification preferences: opt in to email/SMS when someone sends you a DM, and get notified when someone leaves a conversation or a conversation is deleted.
- Role-based messaging: Driplets can message other Driplets; Drip Nomads can message Driplets and Nomads; Mods can message Driplets, Nomads, and Mods; Admins can message everyone.

### Errl Boombox (early experiment)
- A draggable music player for YouTube, SoundCloud, and Spotify links is available as an opt-in experiment under Account Settings > Additional Features.
- This is still an early idea and hasn't been fully worked out yet. You can turn it on if you're curious, but it's really not worth it yet.
- I'll update everyone when it's ready for real use.

### Threaded Replies Everywhere
- Event comments now support nested replies. You can reply to a specific comment and see the thread structure.
- Announcements (Timeline), Music, and all section comments (Lore, Memories, Art, Bugs, Rant, Nostalgia, Lore Memories, Nomads) now use threaded replies too.
- Visual connector lines show the relationship between parent and child replies.

### Music & Profile Song: Single URL Field
- Music posts and profile song now use a single URL field. Paste a link and the provider (YouTube, YouTube Music, SoundCloud, Spotify) is detected automatically.
- No more separate "URL" and "provider" dropdown. The form shows "Detected: [Provider]" when a URL is present.
- Spotify supports tracks, albums, playlists, artists, episodes, and shows with correct embed heights.

### Notification Controls
- **New forum threads**: Toggle notifications for new forum threads, with per-section choices (Lobby General, Shitposts, Art, Nostalgia, Bugs, Rant, Lore, Memories, About, Nomads).
- **Nomad section activity**: Opt in to get notified when there is new content in the Nomad section.
- **Admin notifications**: Admins can choose which moderation events to be notified about (post deleted, edited, hidden, locked, moved, pinned, restored; user deleted; user role changed).
- **Edit notifications modal**: Collapsible sections for forum sections and admin events so the modal is shorter by default.
- **Dirty state**: The Save button highlights when you have unsaved notification changes.

### Custom Neon Color Picker
- If you use the "Custom Neon" color theme, you now have a color picker and hex input to choose your accent color.

## Enhancements & Improvements

### Messages Page Polish
- Mobile layout: single-pane view (inbox or conversation) with a "Back to inbox" button when viewing a conversation.
- User picker: recent conversations list for quick recipient selection; search by typing 2+ characters.
- Group messaging UI: group badge and "(N people)" in the inbox; subject/group name prompt when 2+ recipients.
- Compose modal matches forum modals (gradient border, shared styling, Escape to close).
- Formatting toolbar (Bold, Italic, Code, Link) on compose and inline reply; markdown supported in message display.

### Feed and Post Cards
- Feed layout: title on row 1; stats (views, replies, likes) top right; "by user" and event info on row 2; last activity bottom right when present.
- Event cards: event info centered; "Invite People" hidden when the event has passed.
- Feed small viewport: "by" line and stats stay in correct order; no gap between title and by line.
- Compact timestamps on reply meta rows for mobile.

### Home Explore Sections
- Post count + optional 24h badge (green dot) only when there is activity in the last 24 hours.
- Latest drip list: up to 3 items, deduplicated by post; variable card height; tighter spacing.
- Desktop: "Open section" removed; click the card or drip links to navigate.
- Mobile: space between post count and 24h badge.

### Section Intros and Layout
- Section descriptions wrap to multiple lines while keeping action buttons on the right.
- Removed the blue divider line under section headers.
- Development "Show hidden" no longer overlaps the description on mobile.

### Keyboard and Accessibility
- Search results: Enter/Space activate; Escape closes.
- Post action menu: Escape closes.
- Library menu: Arrow keys and Home/End to move focus.
- Tab switcher: Arrow keys and Home/End to switch tabs.
- Create post modal: focus trap when open; Tab/Shift+Tab wrap inside.
- User popover and Boombox track row: Escape to close; Enter/Space to activate.

### Account and Profile
- Edit Profile tab: added "Edit Profile" header and divider, matching Account tab style.
- Removed "View Public Profile" and "Edit profile" from breadcrumb (available in kebab menu).
- Account page modals: mobile glitch fix (no recursive screenshot / overlap); same flow as create/edit modals.
- Account/Edit Profile title: centered, equal padding; reduced glow on sub-tab section titles.
- Profile page: padding between profile card and tab switcher.

### Event and Engagement
- Event reply/comment cards: adjusted padding; Attending section has reduced bottom padding.
- Engagement section parity: same reduced bottom padding for Replies/Comments blocks across all post types (events, forum, devlog, projects, etc.).
- Event detail: "Event happened" and date on same row; Attending and attendee list on same row; visual connector for nested replies.

### Other Polish
- Mobile: pink tap highlight removed on section cards and tappable elements.
- Library dropdown: centered list item text and larger font.
- Reply meta row: compact on mobile; shorter timestamp format.

## Bug Fixes

- Fixed notification cleanup: unlike, un-RSVP, delete (post/thread/event/music/project/timeline/devlog), and comment/reply delete now remove the corresponding notifications so there are no broken links.
- Fixed account and Create post modals on mobile (compositing glitches, overlapping duplicate modals).
- Fixed Section intro "Show hidden" overlapping description on Development section.

## Technical Improvements

### Migrations
- **0070**: event_comments.reply_to_id for threading.
- **0071**: notifications.target_sub_id for precise cleanup on comment/reply delete.
- **0073**: timeline_comments.reply_to_id for threading.
- **0074**: music_comments.reply_to_id for threading.
- **0075**: dm_conversations, dm_participants, dm_messages.
- **0076**: notify_private_message_enabled.
- **0077**: notify_conversation_updates_enabled.
- **0078**: user_activity_log for audit/system log consistency.
- **0067–0069**: notify_new_forum_threads_enabled, notify_nomad_activity_enabled, notify_new_content_sections, notify_admin_events.

### New/updated routes and utilities
- `src/app/api/messages/` (conversations, create, leave, users)
- `src/lib/notificationCleanup.js` (delete on unlike, un-RSVP, content delete, comment/reply delete)
- `src/lib/siteNotifications.js`, `src/lib/adminNotifications.js`, `src/lib/notificationSections.js`, `src/lib/adminNotificationEvents.js`
- `src/lib/roles.js` (canMessageByRole)
- `src/lib/embeds.js` (detectProviderFromUrl, Spotify/YouTube expansion)
- `src/components/ThreadedCommentsSection.js` (shared for sections, announcements, music)
- `src/components/MessagesClient.js`, `src/components/BoomboxPrefsProvider.js`, `src/components/boombox/`
- `insertNotificationWithOptionalSubId` for comment/reply notifications with target_sub_id

### Notification wiring
- Site: new forum threads (per-section), nomad activity.
- Admin: post/content manipulation and user change events.
- Private messages: in-app and outbound (email/SMS when pref enabled).
- Conversation: participant left, conversation deleted.

## Known Issues & Notes

- This update touches many shared surfaces (messages, notifications, feed, home, account, threading).
- Extra mobile and desktop QA is recommended after deployment.
- Run migrations 0070, 0071, 0073, 0074, 0075, 0076, 0077, 0078 before or with deploy.
- `npm test -- --run` is still unavailable in this repository (no `test` script).

---

Thanks for all the feedback. If something looks off, include the page and viewport width in your bug note so it can be reproduced quickly.
