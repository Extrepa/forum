# Missing Updates Summary (2026-01-30)

## User Report

User reported not seeing:
1. Home page updates (discussed)
2. Feed page updates (discussed)
3. Number of attending next to date on event thread previews (events page, before clicking in)
4. Thread previews with additional activity information (any page, feed)

---

## Implemented in This Session

### 1. Event attendee count on Events page (`/events`)

- **events/page.js**: Added `attendee_count` subquery to both primary and fallback SQL
- **EventsClient.js**: Display "· X attending" next to the event date in the preview row

### 2. Event attendee count on Feed page

- **feed/page.js**: Added "· X attending" next to event start date in the event info row (feed already had attendeeCount/attendeeNames; now shown inline with date)

---

## Current State of Other Items

### Home page

- **HomeSectionCard**: Shows section title, activity description, post count, timeAgo. No views/replies/likes/lastActivity.
- **HomeRecentFeed**: Shows recent activity with author, title, timeAgo, section. No views/replies/likes.
- **Gap**: The specific "home page updates" from your discussion are not in the implementation plan or transcript. To add more (e.g. views/replies/likes on section cards or recent feed), the home page section queries would need to return those fields for each "recent" item, and the components would need to render them.

### Feed page

- Feed already includes:
  - `last_activity_at` in all queries, mapped to `lastActivity`
  - Sort by last activity (not just created date)
  - PostMetaBar with views, replies, likes for all types
  - For events: event date, attendee count/names, last activity in custom layout
  - `hideDateOnDesktop` for events
- **Change made**: Attendee count now appears next to the event date (in addition to the existing "X attending: [names]" row).

### Thread previews – last activity

- **Lobby** (ForumClient): Passes `lastActivity` to PostMetaBar ✓
- **Timeline/Announcements**: Passes `lastActivity` ✓
- **Events**: Uses custom layout; shows "Last activity" in a separate row (not in PostMetaBar) ✓
- **Music, Projects, DevLog, Art, Bugs, Rant, Lore, Memories, LoreMemories, Nostalgia, Shitposts**: All pass `lastActivity` to PostMetaBar ✓

---

## Clarification Needed

To implement further changes, it would help to know:

1. **Home page**: What should change? (e.g. views/replies/likes on section cards, different recent activity layout, attendee count for events)
2. **Feed page**: What is still missing or incorrect? (layout, data, ordering, etc.)
3. **Thread previews**: Beyond last activity, what extra info should appear? (reply count, like count, etc. are already shown in PostMetaBar)
