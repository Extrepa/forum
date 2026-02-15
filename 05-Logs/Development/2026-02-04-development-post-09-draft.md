# Errl Portal Forum - Development Update #9 (Draft)

Hey everyone. This update covers the major UI and flow overhaul that landed after Update #8, with a heavy focus on the header/navigation system, signup improvements, section-page consistency, and cross-forum editing/moderation reliability.

## New Features

### Header & Navigation Flow Overhaul
- **Signed-out vs signed-in header modes**: The header now renders a dedicated guest variant (`site-header--guest`) and a richer signed-in variant so each state has the right amount of UI.
- **Centered primary nav**: Signed-in header layout now holds a stable three-zone structure (brand left, Home/Feed/Library center, actions right) with improved behavior across breakpoints.
- **Library popout upgrade**: The Library menu now includes a built-in forum search trigger and search field, with width/position clamped so it stays on-screen on small viewports.
- **Notifications trigger + menu redesign**: Notifications are on a bell trigger, with a cleaner panel that prioritizes unread activity and tighter actions.
- **Guest easter egg flow**: Signed-out users can still trigger the feed easter egg path from the compact guest controls.

### Signup Flow Improvements
- **Confirm password** field added to signup.
- **Username availability checks** now run with debounced API calls and inline feedback.
- **Field-level validation messages** now display directly on problematic inputs.
- **Signup requirements clarified**: email required, phone optional, first/last name optional.
- **More compact form layout**: name fields and password fields share responsive paired rows for faster completion on desktop/mobile.

### Account Hub Refactor
- **New `AccountSettings` structure** in `/account`: Account Summary, Notifications, Site & UI, and Danger Zone are now separated into focused cards.
- **Unified notification editing**: Site and admin notification preferences are handled in one place with validation rules.
- **Edit sheets improved**: Better scroll behavior, improved desktop height handling, and cleaner modal ergonomics.

## Enhancements & Improvements

### Forum-Wide Page Flow Consistency
- **Section intro unification**: Section landing pages moved away from mixed breadcrumb/top-row patterns to a shared intro layout (title, description, actions in one card).
- **Action controls consolidated**: Buttons like `Show hidden` and `New ...` now live in the section intro area for more predictable placement.
- **Post-page context cleanup**: Detail pages now use a compact context row (`Section > Post`) instead of the older full breadcrumb strip.

### Editing & Posting UX
- **`PostActionMenu` rollout**: lock/hide/pin/delete actions are now grouped in one managed popover near the edit trigger across detail pages.
- **`editModal` pattern adoption**: detail pages were migrated to a shared modal-control pattern to reduce duplicate toggle logic.
- **Modal layering hardening**: Create/Edit and delete confirmation modals use portal rendering and stronger z-index behavior so they reliably appear above headers/popovers.
- **Mobile edit form fixes**: toolbar/button wrapping and input sizing were updated to prevent overflow on narrow screens.

### Home, Feed, and Surface Polish
- **Guest home flow tightened**: signed-out users now get a focused signup/sign-in experience with reduced extra UI and lighter data work.
- **Feed access behavior**: guest feed access is routed back through home/sign-in flow.
- **Errl message surface cleanup**: removed old top-of-page greeting/message cards from Home and Feed, and simplified related notification copy.
- **Neon animation staggering**: list/card outline timing now varies per row/card so motion does not pulse in lockstep.
- **Home section card linking**: section cards and their “Latest drip” paths now route more clearly to either section landing or latest item targets.

## Bug Fixes

- **Next.js 15 compatibility fixes**:
  - addressed async `params`/`searchParams` handling in updated pages/routes
  - fixed serializability issues (including BigInt pass-through cases)
- **Header runtime fix**: resolved a `ReferenceError` caused by memoized Library data being referenced before initialization in `SiteHeader`.
- **Delete flow reliability**:
  - fixed modal stacking context issues (portal + overlay layering)
  - added delete route fallbacks for schemas missing newer audit/timestamp columns (`updated_at`, `edited_at`, `updated_by_user_id`)
  - fixed forum delete route param awaiting for Next.js 15 behavior

## Technical Improvements

### Migrations
- **0063_user_soft_delete.sql**: user soft-delete support for admin tooling.
- **0064_add_click_events.sql**: click telemetry table + indexes for admin system-log visibility.

### API & System
- Added `GET /api/auth/username-availability` usage to signup UX with inline checks.
- Added click telemetry ingestion route (`/api/telemetry/click`) and global tracker wiring.
- Expanded admin move/delete/restore paths and fallback behavior for mixed schema states.
- Continued content-type registry rollout so routing/actions are centralized across admin, likes, notifications, and activity surfaces.

### Components
- **`SiteHeader`**: major structure/state rewrite for guest/signed-in modes, library search flow, and responsive stability.
- **`NotificationsMenu`**: cleaner action rows, improved small-screen behavior, reduced clutter.
- **`PostActionMenu`**: unified admin action container tied to edit affordances.
- **`CreatePostModal` / `DeleteConfirmModal`**: portal-based rendering for consistent layering.
- **`ClickTracker`**: global interactive click capture integrated into app layout.

## Known Issues & Notes

- **Dense change surface**: this update touched a large number of shared layout and flow files, so more visual pass-through testing is still useful on very small devices.
- **Schema variance support is intentional**: several delete/edit paths now include compatibility fallbacks because production and preview environments may not always be on identical column sets during rollout windows.

---

Thanks for all the testing feedback while this one was in motion. If you notice odd behavior in header/nav, modals, or section intro actions on a specific viewport, drop a bug post with the page + device width and I can tighten it quickly.
