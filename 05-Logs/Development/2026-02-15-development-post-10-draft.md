# Errl Portal Forum - Development Update #10 (Draft)

Hey everyone. This update focuses on search reliability and mobile usability, based on live forum testing feedback.

## What changed

### Events now prioritize pinned first, then newest posts
- Event listing now keeps pinned events at the top and otherwise sorts by newest-created first.
- This ensures newly created events show at the top card position, with older items moved into the existing `More` section.

### Event scheduling now supports optional end time
- Event create/edit forms now support an optional end-time toggle.
- End time is validated server-side:
  - must parse correctly when provided,
  - cannot be before the event start time.

### Passed events now switch to completion state
- After an event passes (using end time when present, otherwise start time):
  - relative wording shifts to `Event happened`,
  - RSVP attendance toggling is closed by default,
  - comments remain enabled.
- Attendance summary wording updates from `attending` to `attended` for completed events.
- Attendee names are available via hover title text in compact surfaces.
- Admins can reopen attendance for completed events when needed.

### Event invites added for authors/admins
- Event authors/admins can invite:
  - individual users,
  - role groups,
  - all users.
- Invites create in-app notifications using a new `event_invite` type.
- Invite send path includes dedupe checks to reduce repeated invite notifications.

### Search now finds posts by author username
- Username queries now match authored content across:
  - forum threads
  - announcements
  - events
  - music posts
  - projects
  - forum replies
  - shared posts (`art`, `bugs`, `rant`, `nostalgia`, `lore`, `memories`)
- Result: searching a username (for example `extrepa`) now returns the profile plus authored posts/replies instead of only content where the name appears in body text.

### Search relevance ranking improved
- Added rank scoring so stronger username matches appear first:
  - exact profile/username matches
  - content authored by that username
  - weaker title/body matches after that
- Recency (`created_at`) remains the tie-breaker.

### Mobile search form usability fixed
- The `/search` page input/button layout was reworked with scoped classes and mobile overrides.
- This resolves the compact “tiny bubble” input issue caused by shared mobile button sizing rules.

### Username color + mini profile behavior consistency
- Search surfaces now carry and render `preferred_username_color_index` so usernames use each person’s custom selected color.
- Username taps/clicks in search result rows now prioritize opening the mini profile popover instead of being swallowed by parent row navigation.
- Feed and attendee surfaces were tightened so usernames shown in metadata (like attendees and last-activity author) resolve preferred colors consistently.

### Popover viewport safety follow-up
- Hardened account and action popovers with explicit viewport clamping so they stay on-screen across mobile and desktop.
- Username mini profile popovers remain compact/no-scroll while still using viewport-aware positioning clamps.
- Added global CSS guard for `.user-popover.card` to enforce compact non-scroll behavior.

### Notifications moved + reliability pass
- Notifications are now centered around the right-side header Messages icon (with unread badge), replacing the old logo-trigger expectation.
- Admin “new post” alerts were expanded so section posts (including Events) notify admins when the toggle is enabled.
- Fixed silent notification failures in several comment/reply routes caused by SQL alias mismatches in recipient lookups.
- Added one-time navigation guidance notifications:
  - Existing users can receive it via admin trigger.
  - New users get it automatically on signup.

### New admin broadcast tool
- Added a Settings-tab tool in Admin to send forum-wide in-app notifications any time.
- Includes a pop-out composer modal with custom message text and send/cancel flow.
- Added a dedicated admin API route for custom broadcasts to all active users.

### Admin Console tabs rebuilt for mobile
- Replaced the long stacked Admin tab strip with the shared `ErrlTabSwitcher` used by Edit Profile.
- Applied the neon tab indicator/color sequence so active state is clearer on phones.
- Preserved existing Admin tab behavior and routing (`Overview`, `System Log`, `Posts`, `Users`, `Reports`, `Media`, `Settings`).

### Homepage sections are now compact + expandable on mobile
- The Explore Sections list now defaults to a denser mobile layout so users can scan far more sections before scrolling.
- Each section row still keeps title, post count, and description context in collapsed form.
- Full details are still available with a tap-to-expand panel (single-open accordion behavior), including latest activity or empty-state CTA.
- Desktop behavior remains unchanged.

### Modal pop-outs are now consistent across create/edit/settings/admin/profile
- Standardized major pop-out flows onto the shared modal shell so create/edit/settings/admin/profile overlays behave the same.
- Backdrop interaction is consistent: tap-out close works while keeping page context visible behind the modal.
- Added shared unsaved-change safeguards so backdrop tap, close button, and `Escape` follow confirm-before-discard behavior where applicable.
- Fixed mobile frame mismatch where the neon outline could look detached from content by removing forced card-height behavior inside modal contexts.

### Header popovers now open from the trigger and stay inside the viewport
- Library and Notifications panel placement now use the same anchor-and-clamp positioning behavior.
- Panels open directly from the control you click/tap, and clamp to viewport bounds instead of drifting at full desktop width.
- Added desktop hover-open support for Library while preserving click-to-open/click-to-close behavior.
- Hover-close uses a short delay so moving from the button into the menu does not cause flicker.

## Root cause
- Event lists were sorted by event start date ascending, which did not reflect “latest post first” behavior.
- Events had only a required start timestamp and no explicit end timestamp for completion logic.
- RSVP controls had no built-in event-complete lock state, and invite tooling did not exist for events.
- Notification rendering had no mapping for event invite messages.
- Search SQL was mostly keyed to text fields (`title`, `body`, etc.), not author username columns.
- A global mobile layout rule (`main button { width: 100%; }`) conflicted with the inline search form layout on the search page.
- Homepage section cards were information-rich but vertically tall, which reduced mobile first-view discoverability of all available sections.
- Modal implementations had diverged over time (shared shell in some places, custom overlays in others), and global card sizing (`height: 100%`) leaked into modal internals on mobile.
- Header popovers had diverged positioning logic (separate per-component math + different anchor refs), so menu placement could drift on large desktop viewports.

## Technical changes
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/search/SearchResults.js`
  - Added username and normalized-username matching to content queries.
  - Added rank-based sorting function for stronger username relevance.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/api/search/route.js`
  - Mirrored the same matching + ranking logic so API and server-rendered results stay consistent.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/search/SearchClient.js`
  - Replaced inline styles with scoped form classes.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/globals.css`
  - Added `search-page` form styles and phone breakpoints for stable sizing.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/SiteHeader.js`
  - Verified the right-side Messages icon is the active notification trigger and unread badge anchor.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/lib/adminNotifications.js`
  - Added shared helper for admin “new section post” notification inserts.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/api/events/route.js`
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/api/posts/route.js`
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/api/projects/route.js`
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/api/music/posts/route.js`
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/api/shitposts/route.js`
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/api/threads/route.js`
  - Wired/standardized admin new-post notifications across these create routes.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/NotificationsMenu.js`
  - Added rendering for `admin_post`, `navigation_tip`, and custom `broadcast` messages.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/api/auth/signup/route.js`
  - Added automatic `navigation_tip` insert for newly created users.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/api/admin/test-notification/route.js`
  - Added one-time deduped navigation-tip broadcast mode.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/api/admin/notifications/broadcast/route.js`
  - New endpoint for custom admin broadcasts to all active users.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/AdminConsole.js`
  - Added “Send navigation tip to all users” and pop-out “Compose broadcast notification” tools.
  - Replaced the custom Admin tab row with `ErrlTabSwitcher` and admin tab color mapping.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/globals.css`
  - Added/tuned `.admin-tabs-switcher` + `.admin-tab` styles for compact mobile tab density using the shared pill switcher.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/HomeSectionsList.js`
  - New mobile-aware client wrapper for homepage sections.
  - Detects phone viewport and manages single-open accordion state.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/HomeSectionCard.js`
  - Added compact mobile rendering mode with:
    - dense row layout
    - `Open` section shortcut
    - inline expandable details panel
  - Preserved existing desktop card behavior.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/page.js`
  - Swapped direct section-card mapping to `HomeSectionsList` for mobile compact/expand behavior.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/globals.css`
  - Added scoped `home-section-card` styles and mobile density rules.
  - Added subtle expand animation for detail reveal.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/CreatePostModal.js`
  - Added shared close-guard flow for backdrop/close button/`Escape`.
  - Added form snapshot dirty detection with configurable confirm-on-unsaved behavior.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/account/AccountSettings.js`
  - Replaced custom settings sheets with the shared modal shell.
  - Added dirty checks for contact/password/notification edits so accidental close prompts first.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/AdminConsole.js`
  - Moved admin pop-outs (edit post, user details, move dialog, broadcast composer) onto the shared modal shell.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/ProfileTabsClient.js`
  - Converted public profile gallery full-size pop-out to the shared modal shell.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/account/AccountTabsClient.js`
  - Converted account gallery full-size pop-out to the shared modal shell.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/globals.css`
  - Added modal-safe card sizing overrides (`height: auto`, `min-height: 0`) for create/edit modal content.
  - Added `.admin-drawer--wide` variant for larger admin composer modal width.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/lib/anchoredPopover.js`
  - New shared popover layout utility for trigger anchoring + viewport clamping.
  - Supports horizontal alignment modes and vertical flip when below-space is constrained.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/SiteHeader.js`
  - Library menu now uses shared popover positioning helper.
  - Notifications panel now anchors to the actual message icon button ref.
  - Added desktop-only hover-open + delayed hover-close handling for Library.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/NotificationsMenu.js`
  - Replaced local positioning math with shared helper for consistent desktop/mobile behavior.
  - Removed legacy anchor mode prop and standardized trigger-based fixed positioning.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/PostForm.js`
  - Added optional event end-time toggle/input plumbing (`showOptionalEndDate`).
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/events/page.js`
  - Changed event ordering to pinned-first then newest-created.
  - Added attendee-name aggregation for hover summaries.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/events/EventsClient.js`
  - Added completed-event wording (`Event happened`) and attended/attending label switching.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/events/[id]/page.js`
  - Added end-time display, completion-state messaging, invite capability data loading, and attendance reopen controls.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/EventCommentsSection.js`
  - Added invite panel UI (users/roles/all).
  - Added RSVP-closed state messaging for completed events.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/api/events/route.js`
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/api/events/[id]/route.js`
  - Added optional `ends_at` handling and validation.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/api/events/[id]/rsvp/route.js`
  - Added completion-based RSVP close guard (with reopen override support).
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/api/events/[id]/comments/route.js`
  - Preserved commenting while preventing RSVP side-effects after completion (unless reopened).
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/api/events/[id]/attendance/route.js`
  - New admin endpoint to reopen/close attendance for completed events.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/api/events/[id]/invites/route.js`
  - New invite endpoint with role/user/all targeting and dedupe behavior.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/api/events/[id]/attendees/route.js`
  - Next.js 15 params handling hardening (`await params`).
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/feed/page.js`
  - Updated event feed presentation for completion wording + attended labeling.
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/NotificationsMenu.js`
  - Added `event_invite` notification rendering label + routing.
- `/Users/extrepa/Projects/errl-portal-forum-docs/migrations/0065_events_end_time_and_invites.sql`
  - Added schema support for event end time, attendance reopen flag, and event invite records.

## Verification
- `npm run lint` passed after the changes.
- Query placeholder/bind counts were rechecked after expanding `WHERE` clauses.
- Popover overflow/clamp behavior was audited after hardening changes in:
  - `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/UserPopover.js`
  - `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/HeaderAccountButton.js`
  - `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/PostActionMenu.js`
- `npm run build` passed after the notification + admin broadcast additions.
- Additional targeted recheck for tab switcher conversion:
  - `npx eslint src/components/AdminConsole.js` passed.
  - `npm run build` passed after replacing the Admin tab strip.
- Additional targeted recheck for homepage compact accordion:
  - `npm run lint` passed.
  - `npm run build` passed.
- Additional targeted recheck for modal consistency pass:
  - `npm run lint` passed after modal refactor.
  - `npm run lint` passed again during final audit.
- Additional targeted recheck for header popover positioning + library hover-open:
  - `npm run lint` passed.
  - `npm run build` passed.
- Additional targeted recheck for events completion/invite pass:
  - `npm run lint` passed.
  - `npm run build` passed.

## Current Uncommitted Scope Checklist (for this draft)
- Daily logs included:
  - `05-Logs/Daily/2026-02-15-cursor-notes.md`
  - `05-Logs/Daily/2026-02-15-admin-console-tab-switcher-mobile.md`
  - `05-Logs/Daily/2026-02-15-events-ordering-endtime-rsvp-invites.md`
  - `05-Logs/Daily/2026-02-15-homepage-mobile-sections-accordion.md`
  - `05-Logs/Daily/2026-02-15-library-notification-popover-positioning.md`
  - `05-Logs/Daily/2026-02-15-modal-popout-consistency-and-audit.md`
  - `05-Logs/Daily/2026-02-15-notification-audit-and-broadcast-tools.md`
  - `05-Logs/Daily/2026-02-15-search-mobile-sizing-and-author-results.md`
  - `05-Logs/Daily/2026-02-15-username-color-and-popover-consistency.md`
- Development draft:
  - `05-Logs/Development/2026-02-15-development-post-10-draft.md`
- New migration:
  - `migrations/0065_events_end_time_and_invites.sql`
- New utility libs:
  - `src/lib/adminNotifications.js`
  - `src/lib/anchoredPopover.js`
- New API routes:
  - `src/app/api/admin/notifications/broadcast/route.js`
  - `src/app/api/events/[id]/attendance/route.js`
  - `src/app/api/events/[id]/invites/route.js`
- Updated API routes:
  - `src/app/api/admin/test-notification/route.js`
  - `src/app/api/auth/signup/route.js`
  - `src/app/api/devlog/[id]/comments/route.js`
  - `src/app/api/events/route.js`
  - `src/app/api/events/[id]/attendees/route.js`
  - `src/app/api/events/[id]/comments/route.js`
  - `src/app/api/events/[id]/route.js`
  - `src/app/api/events/[id]/rsvp/route.js`
  - `src/app/api/music/comments/route.js`
  - `src/app/api/music/posts/route.js`
  - `src/app/api/posts/route.js`
  - `src/app/api/posts/[id]/comments/route.js`
  - `src/app/api/projects/route.js`
  - `src/app/api/projects/[id]/comments/route.js`
  - `src/app/api/projects/[id]/replies/route.js`
  - `src/app/api/search/route.js`
  - `src/app/api/shitposts/route.js`
  - `src/app/api/threads/route.js`
  - `src/app/api/timeline/[id]/comments/route.js`
- Updated app pages:
  - `src/app/account/AccountSettings.js`
  - `src/app/account/AccountTabsClient.js`
  - `src/app/events/page.js`
  - `src/app/events/EventsClient.js`
  - `src/app/events/[id]/page.js`
  - `src/app/feed/page.js`
  - `src/app/page.js`
  - `src/app/search/SearchClient.js`
  - `src/app/search/SearchResults.js`
  - `src/app/globals.css`
- Updated components:
  - `src/components/AdminConsole.js`
  - `src/components/CreatePostModal.js`
  - `src/components/EventCommentsSection.js`
  - `src/components/EventRSVP.js`
  - `src/components/HeaderAccountButton.js`
  - `src/components/HomeSectionCard.js`
  - `src/components/HomeSectionsList.js`
  - `src/components/NotificationsMenu.js`
  - `src/components/PostActionMenu.js`
  - `src/components/PostForm.js`
  - `src/components/ProfileTabsClient.js`
  - `src/components/SearchResultsPopover.js`
  - `src/components/SiteHeader.js`
  - `src/components/UserPopover.js`
  - `src/components/Username.js`

## Notes
- Manual final signoff should be done on mobile viewport using `/search?q=extrepa`.
- Manual final signoff should also be done on homepage mobile viewport for compact section scanning + expand/collapse interaction.
- Manual signoff is also recommended for modal-heavy routes (`/events`, `/projects`, content edit views, `/account`, profile gallery, and admin drawers/composer) to confirm mobile touch behavior feels right end-to-end.
- Manual signoff is recommended on desktop full-width header interactions:
  - Library click-open and hover-open placement
  - Notifications placement from the Messages icon
  - Viewport edge behavior when resizing
