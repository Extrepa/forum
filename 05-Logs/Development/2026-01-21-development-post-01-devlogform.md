Title:
Errl Portal Forum - Initial Release

GitHub URL (optional):

Demo URL (optional):

Extra links (one per line, optional):

Body (paste into the Development editor):

Today we're shipping the first major release of **Errl Portal Forum**: a lightweight, fast community space built on Next.js and Cloudflare.

## New Features

### A full set of community sections
- **Feed**: a unified stream that combines posts across Announcements, Lobby, Events, Music, and Projects.
- **Lobby**: general discussion with thread detail pages and replies.
- **Announcements**: official updates with dedicated pages.
- **Events**: an events list with detail pages and discussion.
- **Music**: rich embeds (YouTube/SoundCloud) and ratings.
- **Projects**: share ideas to build with friends, with updates and replies.
- **Shitposts**: the only place images are enabled (by design).
- **Development**: admin-published development posts, readable by signed-in users.

### Accounts (email + password)
- Sign up, sign in, and manage your account from a dedicated `/account` page.
- Smooth upgrade path for legacy sessions: keep your existing content ownership and set credentials when you're ready.
- Posting guardrails: posting requires a password to be set (legacy sessions can still browse).

### Notifications
- In-app notifications for thread replies (with unread count in the header).
- Preference toggles for email and SMS notifications (delivery is best-effort when providers are configured).
- Phone number storage for future SMS support; SMS toggle stays disabled until a phone number is provided.

### Development posts with links
- Development posts support optional **GitHub**, **Demo**, and **extra links** fields, plus an optional image.
- Per-post comment locking for keeping threads tidy when needed.

### Admin moderation: move anything, keep URLs working
- A centralized admin move tool to relocate content between sections.
- Old URLs automatically redirect to the new canonical destination.
- Moved items disappear from source lists/search (once migrations are applied), keeping sections clean.

## Improvements

### Replies and discussion
- Thread replies now respect locks (reply form hides and the API rejects new replies when locked).
- One-level threaded replies in Projects and Development, with quote-prefill reply links for fast context.

### Navigation and discovery
- Breadcrumbs across pages for clear orientation.
- Cleaner header navigation (reduced crowding; Search remains first-class).
- Mobile detail pages use a condensed header and a Menu popover for faster access to content.

### Search
- Unified search across posts and replies (with deep links to the right destination pages).
- Better UX for empty search: submitting an empty query closes the search UI to provide immediate feedback.

## Design & UI

### Errl identity, everywhere
- Consistent Errl-themed username colors across the UI (with adjacent-repeat avoidance).
- Header and footer polish, including tightened spacing and cleaner brand presentation.
- Subtle rainbow drift animation on the Errl face (respects `prefers-reduced-motion`).

### UI density and layout fixes
- Cleaner thread cards and tighter reply spacing.
- Header popover button sizing fixed on small viewports (prevents squishing).

### Microcopy: Text Pack + lore mode
- Integrated an Errl forum text pack for consistent UI copy.
- Lore mode can be globally forced via env, or enabled per-user as an account preference.

## Performance & Reliability

### Rollout-safe migrations
- Pages and queries that depend on new tables/columns fall back gracefully if the database hasn't been migrated yet.
- Clear "not available yet" messaging instead of hard crashes during rollout.

### Production migration hygiene
- Improved migration handling and tracking notes for Cloudflare D1, including safe reconciliation when schemas are already present.

