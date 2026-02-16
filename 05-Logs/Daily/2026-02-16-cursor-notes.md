# Daily Log - 2026-02-16 - Cursor Notes

## Account page pop-out modals: mobile glitch fix + same flow as create/edit posts

### Request
- Fix glitchy pop-out modals on the account page on mobile (recursive screenshot / overlapping duplicate modals, Delivery channels / Admin notifications / Edit notifications).
- Copy the look and flow of these modals for creating and editing posts so they match.
- Ensure notification options are clear and support users who want to be reminded about forum activity (forum-wide, delivery channels, etc.).

### Root cause (mobile glitch)
- Account modals use `CreatePostModal` with `className="account-edit-modal"` but did not use the same CSS overrides as `.create-post-modal` / `.edit-post-modal`. So they still had global `.modal-content::before` / `::after` neon pseudo-elements, which on mobile (especially Android Chrome) can cause compositing glitches and a “nested screenshot” effect.
- `backdrop-filter: blur(12px)` on the modal content can trigger similar compositing bugs on some mobile browsers.

### Implementation

1. **`src/components/CreatePostModal.js`**
   - Disable `backdrop-filter` on mobile (`isMobile ? 'none' : 'blur(12px)'`) to avoid recursive viewport capture.
   - Use a more opaque background on mobile for the modal content (`rgba(7, 27, 37, 0.98)`) so the overlay does not show through when blur is off.

2. **`src/app/globals.css`**
   - Applied the same modal treatment to `.account-edit-modal` as for create/edit modals:
     - Single gradient border (no neon pseudo-elements on the modal shell).
     - `.account-edit-modal::before` and `::after` set to `content: none !important; display: none !important`.
     - `.account-edit-modal .card` and `.account-edit-modal .card::before/::after` included in the card-flattening rules so inner notification cards don’t double-render borders.

3. **`src/app/account/AccountSettings.js`**
   - Added a short tip in the Edit notifications sheet: “Enable email and the triggers you want to get reminded about activity across the forum (replies, mentions, likes, etc.). Add a phone number to also get SMS.”

### Flow alignment
- Create/edit post modals and account sheets (contact, password, notifications) already use the same `CreatePostModal` component. The fix was to give account modals the same CSS (no pseudo-elements, same border treatment) so they look and behave the same and no longer glitch on mobile.

### Notifications
- Existing options kept as-is: Site (RSVP, Like, Project update, Mention, Reply, Comment), Delivery (Email, SMS with phone), Admin (new user, new forum threads, new forum replies). Tip copy clarifies how to get maximum reminders. Forum-wide or nomad-specific digest options would require backend/API support and are not in this pass.

### Verification
- `npm run lint` (pass).
- No new linter errors in modified files.

## Section intro: Development "Show hidden" overlapping description on mobile

### Request
- On the Development section, the "Show hidden" button overlapped the descriptive subtitle ("Updates, notes, and in progress."). Nomads wrapped correctly with the longer description.

### Fix
- `src/app/globals.css`: At `max-width: 600px`, stack section-intro so meta (title + desc) is full-width on top and actions are below. Prevents overlap regardless of description length.

## Home Explore Sections: glow, description wrap, empty CTA row, post count

### Request
- Remove pink/hover glow on section cards (hover and click).
- When expanded, show full description wrapped (no truncation).
- On mobile, put "Open section" and "The goo is quiet here..." on the same row (smaller text if needed).
- Condense post count; show (24h) when recent; dot color for recent (last 24h).

### Implementation

1. **`src/app/globals.css`**
   - `.home-section-card::after` and `:hover::after` / `:focus-within::after`: set `opacity: 0` and `box-shadow: none` so section cards have no neon glow.
   - `.home-section-card.is-expanded .home-section-card__headline-description`: `white-space: normal`, `overflow: visible`, `text-overflow: unset` so description wraps when expanded.
   - Empty state: moved CTA into `.home-section-card__details-head.is-empty`; in `@media (max-width: 640px)` same-row layout with smaller font (10px), CTA and "Open section" in one row.
   - `.section-card-recent-badge`: green (#57ffbe) for "(24h)" label.

2. **`src/components/HomeSectionCard.js`**
   - Count: show number only plus ` (24h)` when `hasRecentInLast24h`; `title={countLabel}` for a11y.
   - Empty expanded state: render "The goo is quiet here..." inside `.details-head.is-empty` next to "Open section" (no separate paragraph below).
   - Dot already had `.is-recent` for last-24h; kept as-is.

## Feed page: mobile/narrow viewport layout (PostMetaBar + events)

### Request
- Keep "by username at time" as one block; when the title wraps, put it on the next row (never split mid-line).
- Keep view/reply/like counts on the right; when wrapping, stack them in a column on the right.
- Three-row layout when needed: row 1 = title, row 2 = by user at time, row 3 = last activity (bottom left) + views/replies/likes (right, stacked).
- Event posts: event info centered; attended above last activity (bottom left); view and reply counts stacked in a column on the right.

### Implementation

1. **`src/components/PostMetaBar.js`**
   - Restructured to three explicit rows. Row 1: title only (no inline author) so title wraps cleanly. Row 2: "by username at time" in a single block (`white-space: nowrap`) plus stats column on the right when there is no last activity. Row 3 (when last activity): last activity text on the left, stats as a column (one line per stat, `align-items: flex-end`) on the right.
   - Stats rendered as a column of spans instead of one joined string.
   - Added `hideStats` prop so feed can hide stats in PostMetaBar for events and show them in the event block.
   - Removed condensed desktop/mobile variants and standalone date row; date lives inside "by user at time".

2. **`src/app/feed/page.js`**
   - PostMetaBar for events: `hideStats={true}`.
   - Event block: event info row stays centered. New bottom row: left = attended + last activity (stacked in a column), right = views and replies stacked in a column. Bottom row only renders when there are attendees, last activity, or stats.

3. **`src/app/globals.css`**
   - Replaced old PostMetaBar desktop/mobile media rules (condensed-author, stats-desktop/mobile, date-mobile-only, etc.) with minimal rules: `.post-meta-title-row`, `.post-meta-by-row`, `.post-meta-row3`, `.post-meta-stats-column` for min-width and alignment; smaller font for last-activity on mobile; event-info-row center.
