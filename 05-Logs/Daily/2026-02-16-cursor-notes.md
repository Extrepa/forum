# Daily Log - 2026-02-16 - Cursor Notes

## Section intro: remove blue divider line (2026-02-16)

**Request:** Remove the blue line divider below section headers (Art & Nostalgia, Bugs & Rants, etc.).

**Change:** Removed `border-bottom: 1px solid var(--border);` from `.section-intro` in `@media (max-width: 600px)` block in `src/app/globals.css`. The divider had been added in the small-viewport compact layout pass (see `05-Logs/Daily/2026-02-16-section-intro-small-viewport-compact-and-divider.md`).

**Scope:** All section-intro pages (Feed, Music, Events, Art, Art & Nostalgia, Shitposts, Projects, Timeline, Dev log, Memories, Lore, Lore Memories, Rant, Bugs & Rants, Bugs, Forum)—single shared class, so removal applied to all.

---

## Feed: small viewport gap between title and "by" line (2026-02-16)

**Request:** Fix layout on smallest viewport where a row/space appeared between the "by [author] at [date]" line and the post title on feed cards.

**Change:**

1. **PostMetaBar** (`src/components/PostMetaBar.js`): For non-event items, stats (views/replies/likes) moved from row 1 into row 2. Row 1 = title only; row 2 = "by" line + stats (stats in `.post-meta-stats-in-row2` with `marginLeft: 'auto'`). Events (custom row 2) unchanged: title + stats stay on row 1.
2. **CSS** (`src/app/globals.css`): `.post-meta-stats-in-row2` added; at `max-width: 480px` that block gets `flex-basis: 100%` and `text-align: right` so wrapped stats sit on their own line, right-aligned.

**Result:** On narrow viewports order is title → by line → stats (no row between title and "by"). Wide viewports: "by" and stats on one line with stats right-aligned.

### Verification (double-check)

| Item | Check |
|------|--------|
| **statsInRow1 / statsInRow2** | `statsInRow1 = hasCustomRow2 && hasStats`; `statsInRow2 = !hasCustomRow2 && hasStats` so events keep current behavior. |
| **Row 1** | Title only when `!hasCustomRow2`; title `flex` only when `statsInRow1` so no extra flex when title is solo. |
| **Row 2** | `row2Content` (by + optional last-activity second line) then `statsInRow2` span; stats after content so order is by → stats on same line, last-activity still gets full-width line when `row2HasActivity`. |
| **CSS** | `.post-meta-stats-in-row2` at 480px forces own line + right align; no conflict with `.post-meta-last-activity-second-line` (both can wrap in row 2). |

**Lint:** No linter errors on modified files.

---

## Keyboard controls across forum (2026-02-16)

**Request:** Add keyboard controls wherever appropriate for adaptability/accessibility.

**Changes:**

1. **SearchResultsPopover** (`src/components/SearchResultsPopover.js`): Result items are focusable with `role="button"`, `tabIndex={0}`; Enter/Space activate; Escape closes popover.
2. **PostActionMenu** (`src/components/PostActionMenu.js`): Escape closes the action popover when open.
3. **SiteHeader** (`src/components/SiteHeader.js`): Library menu supports ArrowDown/ArrowUp and Home/End to move focus between search input and library links when menu is open. (Escape already closed all menus.)
4. **ErrlTabSwitcher** (`src/components/ErrlTabSwitcher.js`): Tab list supports ArrowLeft/ArrowRight (and ArrowUp/ArrowDown), Home and End to switch tabs from keyboard.
5. **CreatePostModal** (`src/components/CreatePostModal.js`): Focus trap when open—focus moves to first focusable element; Tab/Shift+Tab wrap inside modal so focus cannot leave. (Escape already closed.)
6. **UserPopover** (`src/components/UserPopover.js`): Escape closes the popover.
7. **BoomboxWidget** (`src/components/boombox/BoomboxWidget.js`): Track row clickable area has `role="button"`, `tabIndex={0}`, Enter/Space to select/play; `aria-label` for play/now-playing.

Existing keyboard support kept/unchanged: NotificationsMenu items (Enter/Space), CreatePostModal and DeleteConfirmModal (Escape), HomeSectionCard (Enter/Space on card, button for toggle), ProfileTabsClient gallery tiles (Enter/Space).

### Verification (double-check)

| Component | What was verified | Notes |
|-----------|-------------------|--------|
| **SearchResultsPopover** | Escape listener (doc), result items role/tabIndex/onKeyDown/aria-label | Escape only registered when `results.length > 0`; inner Username span uses stopPropagation so clicking author doesn't trigger card navigate. |
| **PostActionMenu** | handleEscape in same effect as handlePointerDown, clears menu + hovering + timer | Listener only when `hasExtras && menuOpen`; cleanup removes both pointerdown and keydown. |
| **SiteHeader** | Library menu ArrowUp/Down, Home/End on focusable (input + links) | `focusable` includes search input when `libraryFilterOpen`; effect deps `[libraryOpen, libraryFilterOpen]`; Escape left to existing global handler. |
| **ErrlTabSwitcher** | handleTabListKeyDown on tablist div; role=tab check; index from tabButtonsRef | Arrow Left/Up = prev, Right/Down = next; Home/End; onTabChange(tabs[nextIndex].id) then focus tab button. Ref array matches tabs order. |
| **CreatePostModal** | Focus trap effect: focus first focusable on open; Tab only prevented when wrapping (first->last or last->first) | getFocusable() used on open and in handler (fresh list); no preventDefault when focus moves naturally inside modal. |
| **UserPopover** | Escape listener with onClose; cleanup on unmount | Document-level listener; no conflict with other Escape handlers (order of handlers undefined but all call their onClose). |
| **BoomboxWidget** | errl-boombox__trackLeft: role=button, tabIndex=0, Enter/Space, aria-label | Play/Remove remain real buttons; track row is additional focusable target for same action. |

**Lint:** No linter errors reported on modified files.

---

## Messages page: mobile layout, user picker, group UI, design polish (2026-02-16)

**Request:** Reorganize messages page; fix broken mobile layout; add user list in To section; improve group messaging UI; align with forum design (less square/boxy).

**Changes:**

1. **Mobile-responsive layout** (`src/components/MessagesClient.js`):
   - On viewports &lt; 720px: single-pane view—show either Inbox list OR conversation (not side-by-side)
   - Added `mobileView` state: `'list'` | `'conversation'`
   - "Back to inbox" button when viewing a conversation on mobile
   - Breakpoint constant `MOBILE_BREAKPOINT = 720`

2. **User picker in To section**:
   - **API** (`src/app/api/messages/users/route.js`): Added `?list=recent` param—returns users from recent conversations (up to 20) for quick picker without typing
   - Compose modal: "Recent conversations" list shown by default (people you've messaged)
   - Search results (2+ chars) labeled "Search results"
   - Placeholder: "Search users or choose from list below..."

3. **Group messaging UI**:
   - When 2+ recipients selected: prominent "Group conversation (N recipients)" hint with subject prompt
   - Subject label: "Group name (recommended)" for groups vs "Subject (optional, for groups)" for DMs
   - Inbox list: "Group" badge (pill-shaped) and "(N people)" for group conversations

4. **Design consistency (less square)**:
   - **Inputs**: borderRadius 8px → 12px (matches forum `.notice`, create-post inputs)
   - **Pills/chips**: Group badge and selected-user chips use `borderRadius: '999px'`
   - **Layout**: Removed heavy nested card styling; sidebar and main are sub-regions of the page card with a subtle divider and light background tint on sidebar
   - **Message bubbles**: 14px radius (was 12px)
   - **Dropdowns**: User picker lists use 12px radius
   - **Compose modal**: Uses `card` class and `messages-compose-modal` for forum-consistent modal styling

5. **CSS** (`src/app/globals.css`): `.messages-layout`, `.messages-sidebar`, `.messages-main`; `@media (max-width: 719px)`; `.messages-compose-modal` for modal radius and input styling.

### Additional polish (2026-02-16)

6. **Markdown formatting**:
   - Formatting toolbar (Bold, Italic, Code, Link) on both inline reply and compose modal—borrowed pattern from ReplyForm
   - Message display: `dm-message-body` uses same markdown styling as `post-body` (links, blockquotes, code blocks)
   - Placeholder: "Write a message... (Markdown supported)"

7. **UX details**:
   - Escape key closes compose modal
   - Error shown in conversation view when send fails; cleared on success and on conversation switch
   - Compose validation: "Select at least one recipient" when To is empty (non-broadcast)

### Full audit: messages feature coverage

| Feature | Status | Notes |
|--------|--------|------|
| Single (DM) messages | OK | Create with 1 recipient; inbox shows direct convos |
| Group messages | OK | 2+ recipients; subject/group name; Group badge in inbox |
| Composing | OK | New message modal; inline reply in conversation; user picker + recent list |
| Deleting | OK | Admin: delete conversation; Any: leave conversation |
| Markdown display | OK | renderMarkdown + dm-message-body CSS |
| Markdown input | OK | Formatting toolbar on both compose areas |
| Editing messages | Not implemented | Would need PATCH API + UI; dm_messages has no edited_at |
| Delete own message | Not implemented | Would need PATCH/soft-delete API; dm_messages has is_deleted |
| Broadcast (admin) | OK | Send to role (all, user, drip_nomad, mod, admin) |
| Mobile layout | OK | Single-pane; Back to inbox |
| Error handling | OK | Shown in modal and conversation view |
| Escape to close | OK | Compose modal |

### Verification checklist (2026-02-16)

- [ ] **Mobile (< 720px)**: Inbox shows full-width; tapping a conversation switches to conversation view; "Back to inbox" returns to list; no truncated "Select conver or st new" text
- [ ] **Desktop**: Two-column layout; sidebar has light background tint and right border; main area clean
- [ ] **Compose modal**: Opens with "Recent conversations" list when no search; typing 2+ chars shows search results; selecting users adds pills; 2+ users shows group hint; Escape closes
- [ ] **Formatting**: Bold/Italic/Code/Link buttons work on inline reply and compose modal
- [ ] **Markdown display**: Links, code, blockquotes render correctly in message bubbles
- [ ] **API `/api/messages/users?list=recent`**: Returns recent conversation participants; respects role-based messageability
- [ ] **Design**: Inputs, buttons, and dropdowns use 12px+ radius; no harsh 6–8px corners; pill shapes for badges/chips

### Files changed (messages work – 2026-02-16)

| File | Changes |
|------|---------|
| `src/components/MessagesClient.js` | Mobile layout (mobileView, isMobile, showSidebar/showMain); user picker (recent + search); group UI (badge, subject label); applyFormatting + formatting toolbar (replyBodyRef, composeBodyRef); Escape key listener; error display in conversation view; design constants (INPUT_STYLE, BUTTON_STYLE); refactored layout (no nested CARD_STYLE) |
| `src/app/api/messages/users/route.js` | `?list=recent` param; query for recent conversation participants; role-based filtering |
| `src/app/globals.css` | `.messages-layout`, `.messages-sidebar`, `.messages-main`; `@media (max-width: 719px)`; `.messages-compose-modal`; `.dm-message-body` (links, blockquote, pre, code styling) |

### Implementation notes

- **applyFormatting**: Wraps selected text with markdown delimiters; uses ref + setState for controlled textarea; `setTimeout(0)` to restore cursor after React re-render.
- **Formatting toolbar**: Two instances—inline reply (replyBodyRef) and compose modal (composeBodyRef); uses `.formatting-toolbar` class from globals.css.
- **Escape listener**: `useEffect` adds keydown listener when composeOpen; removes on cleanup.
- **Recent users**: Fetched on modal open via `GET /api/messages/users?list=recent`; SQL joins dm_participants/dm_conversations to get other participants, ordered by `c.updated_at DESC`.

---

## Feed post cards: event centering, last activity row (2026-02-16)

**Request:** At large viewports: (1) center event information on event post cards and keep last activity on the same row (condensed); (2) on regular posts (Lobby, Lore, etc.) put last activity on the second row (wrap to second line). At shrunken viewports: keep event information centered; leave everything else as is.

---

### Double-check summary

- **PostMetaBar.js**: Row 3 removed in all cases. When custom (events), row 2 = custom only. When no custom + has last activity, row 2 = byUser + `<span class="post-meta-last-activity-second-line">` wrapping lastActivityEl; row 2 gets `post-meta-row2-with-activity`. JSDoc updated to describe two-row layout and no row 3.
- **feed/page.js**: Event custom row returns a single `<div class="event-row2 [event-row2-with-activity]">` containing byUser, `event-row2-middle` (event info), and conditionally eventLastActivityEl. `item.attendeeNames` only used when `item.attendeeCount > 0` (no unsafe .join). Last activity uses same format as PostMetaBar (formatDateTimeShort, Username with color indices from usernameColorMap/preferredColors).
- **globals.css**: `.event-row2` has `width: 100%`; `.event-row2-middle` unchanged (flex: 1 1 auto, justify-content: center). New `.post-meta-last-activity-second-line` (flex-basis: 100%, display: block, text-align: right). `.post-meta-row3` and `.event-row3` remain in CSS but PostMetaBar no longer renders a row 3 div.
- **Other consumers of PostMetaBar**: Feed is the only caller that passes `customRowsAfterTitle`. All others (MusicClient, EventsClient, ForumClient, LoreClient, etc.) use default row 2; they now get last activity on the second line of row 2 when they have lastActivity and replies > 0. No props or API changes required.

---

### Full change log

| File | Change |
|------|--------|
| **src/components/PostMetaBar.js** | **JSDoc (lines 7–14):** Updated to describe two-row layout only; when custom, row 2 = custom (caller includes last activity); when no custom + has last activity, row 2 = by user + last activity on second line via `.post-meta-last-activity-second-line`; no row 3. **Logic (lines 68–88):** `lastActivityEl` still built the same. Introduced `hasCustomRow2 = customRowsAfterTitle != null`, `row2HasActivity = !hasCustomRow2 && hasLastActivity`. `row2Content` = customRowsAfterTitle if custom; else if row2HasActivity then `byUserAtTime` + `<span className="post-meta-last-activity-second-line">{lastActivityEl}</span>`; else `byUserAtTime`. **JSX (lines 89–121):** Removed the row 3 block entirely. Row 2 div now gets conditional class `post-meta-row2-with-activity` when `row2HasActivity`. Comment updated to "when not custom and has last activity, last activity wraps to second line". |
| **src/app/feed/page.js** | **Event custom row (lines 589–664):** Added `hasEventLastActivity = item.lastActivity && item.replies > 0`. Built `eventLastActivityEl` when true (same structure as PostMetaBar: "Last activity" + optional "by &lt;Username&gt;" + " at &lt;formatDateTimeShort(item.lastActivity)&gt;", with usernameColorMap and preferredColors for lastActivityBy). Return value changed from fragment `<>...</>` to single `<div className={\`event-row2${hasEventLastActivity ? ' event-row2-with-activity' : ''}\`}>` containing byUser, `<span className="event-row2-middle">{eventInfo}</span>`, and `{eventLastActivityEl}`. No change to byUser, eventInfo, or attendee rendering; `item.attendeeNames.join` only used when `item.attendeeCount > 0`. |
| **src/app/globals.css** | **~4809–4834:** Comment before `.event-row2` updated to "Event row 2: by user (left) + event info (centered in middle) + last activity (right); full width so middle can center". `.event-row2` given `width: 100%` (new). `.event-row2-middle` unchanged (flex: 1 1 auto, justify-content: center, min-width: 0). New block: "Regular posts: last activity on row 2, wraps to second line (right-aligned)" for `.post-meta-last-activity-second-line` with `flex-basis: 100%`, `display: block`, `text-align: right`. **~4913–4926:** Existing `@media (max-width: 640px)` for `.event-row2` (column, align-items: flex-start), `.event-row2-with-activity .post-meta-last-activity-inline` (align-self: flex-end), `.event-row2-middle` (width: 100%, justify-content: center) left as-is so event info stays centered when stacked. |

---

### Scope and behavior

- **Feed:** Event cards use custom row with event info centered and last activity on same row (right); regular feed items use default PostMetaBar row 2 with last activity on second line. Shrunken viewport: event row stacks; event-row2-middle stays centered.
- **All other PostMetaBar usages** (Music, Events, Art, Forum, Lore, Projects, Timeline, DevLog, Memories, etc.): No custom row; when they have lastActivity and replies > 0, last activity appears on the second line of row 2 (right-aligned). No code changes needed in those callers.

---

## Reply meta row: compact on mobile (2026-02-16)

**Request:** On small viewports, threaded replies had unnecessary height because the Reply/Like buttons wrapped to a new row and the post time was too large. User wanted Reply/Like in top-right corner and smaller/condensed time.

**Changes:**
1. **`src/app/globals.css`** (inside `@media (max-width: 640px)`):
   - `.reply-top-row`: `flex-wrap: nowrap` (was `wrap`) so actions stay on same row; `align-items: center`; `gap: 8px`.
   - `.reply-meta-inline`: `font-size: 11px`; `min-width: 0` for shrink.
   - `.reply-actions-inline`: `flex-shrink: 0` so Reply/Like stay anchored top-right.

2. **Timestamp format:** Switched reply metadata from `formatDateTime` to `formatDateTimeShort` (e.g. "2/15 9:02 PM" vs "2/15/2026, 9:02 PM"):
   - `EventCommentsSection.js`
   - `ThreadedCommentsSection.js`
   - `ProjectRepliesSection.js`
   - `src/app/lobby/[id]/page.js`
   - `src/app/devlog/[id]/page.js`
   - `src/app/music/[id]/page.js` (formattedDate in serialized comments)

**Scope:** All threaded reply/comment cards (events, lobby, devlog, projects, announcements, music, etc.).

### Double-check / verification (2026-02-16)

**CSS:** Confirmed `@media (max-width: 640px)` block (lines ~8484-8498) contains: `.reply-top-row` (flex-wrap: nowrap, align-items: center, gap: 8px), `.reply-meta-inline` (font-size: 11px, min-width: 0), `.reply-actions-inline` (margin-left: auto, flex-shrink: 0).

**Timestamp format:** All reply/comment meta rows now use `formatDateTimeShort`:
- EventCommentsSection.js (events)
- ThreadedCommentsSection.js (announcements, music, lore, nomads, nostalgia, rant, bugs, art, memories, lore-memories)
- ProjectRepliesSection.js (projects)
- lobby/[id]/page.js (forum threads)
- devlog/[id]/page.js (devlog comments)
- music/[id]/page.js (music comments; formattedDate in serialized data; ThreadedCommentsSection formats c.created_at directly so both paths covered)

**Reply structure (reply-top-row, reply-meta-inline, reply-actions-inline):** All 5 reply/comment renderers use the same structure, so the mobile CSS applies consistently.

**Not changed (intentionally):** formatDateTime still used for PostHeader, AccountTabsClient, ProfileTabsClient, SearchClient, AdminConsole, EventsClient—those are not reply meta rows.

---

## Section intro: description wrap and compact height (2026-02-16)

**Request:** Section headers (e.g. Development, Bugs & Rants) should wrap the description onto multiple rows while keeping the action buttons on the right in the same band as the title and description, for a compact height.

**Changes (`src/app/globals.css`):**
- **Lines 2391–2397** (`.section-intro`): `grid-template-columns` set to `minmax(0, min(1fr, 72ch)) auto` so the meta column is capped at 72ch and the description wraps; `align-items: start` so buttons align with the top of the title+description block when the description wraps to multiple lines.
- **Lines 2409–2416** (`.section-intro__desc`): added `overflow-wrap: break-word` and `word-wrap: break-word` so long words break and wrap within the meta column.
- **Lines 8881–8885** (inside the `@media` block that overrides section-intro): same `grid-template-columns` and `align-items: start` so behavior is consistent at medium widths.

**Scope:** Section intro is used on Feed, Music, Events, Art, Art & Nostalgia, Shitposts, Projects, Timeline (Announcements), Dev log, Memories, Lore, Lore Memories, Rant, Bugs & Rants, Bugs, and Forum (lobby) section headers. All share the same `.section-intro` / `__meta` / `__title` / `__desc` / `__actions` structure.

**Responsive behavior (unchanged):** At `max-width: 600px` the layout stacks (meta full width, actions below) so description has full width; at `max-width: 520px` only action button spacing/sizing is adjusted.

**Verification:** On sections with long descriptions (e.g. Bugs & Rants: "Report issues, weirdness, and broken stuff. Or vent. Get it out. Be kind."), confirm the description wraps to multiple lines, the "Show hidden" and "New Post" (or section-specific) buttons remain on the right and top-aligned with the text block, and the header stays one compact block. At &lt;600px width, meta and actions should stack.

**Update (same day):** At `max-width: 600px` the small-viewport behavior was changed: instead of stacking meta then actions on two full-width rows, the layout now puts **title and button on the same row** and **description on the row below** (same rows area, reduced card height). A **divider line** (`border-bottom` on `.section-intro`) was added between the header and the list. See `05-Logs/Daily/2026-02-16-section-intro-small-viewport-compact-and-divider.md` for full implementation and verification notes.

**Update (same day, later):** The divider line was removed per user request. See "Section intro: remove blue divider line" above.

## Event post: reply and Attending padding (2026-02-16)

**Request:** Adjust padding on event post page: (1) more top/left on reply cards for username and time, (2) less vertical padding above/below reply body text, (3) less bottom padding on Attending section.

**Changes:**

1. **Reply/comment cards** (`src/app/globals.css`, ~5901–5924)
   - `.list-item.comment-card`: padding set to `14px 14px 8px 16px` (was inheriting `.list-item` 4px 10px 5px). Gives more top (14px) and left (16px), less bottom (8px).
   - `.list-item.comment-card .reply-top-row`: `margin-bottom: 4px` (tighter gap between meta row and body; base `.reply-top-row` remains 8px elsewhere).
   - `.list-item.comment-card .post-body`: `margin-top: 0`.
   - `.list-item.comment-card .post-body p`: `margin: 0 0 4px`; `p:last-child` `margin-bottom: 0`. Reduces vertical bulk of the text block.

2. **Attending section**
   - `src/app/globals.css` (~2340–2342): added `.event-attending-section { padding-bottom: 8px; }` (card default is 12px).
   - `src/components/EventEngagementSection.js`: section `className` updated from `"card"` to `"card event-attending-section"`.

**Scope:** Comment cards use `list-item comment-card` on event replies, project replies, lobby thread replies, and devlog comments, so the new padding applies to all of those. Attending section is only the event RSVP block.

**Verification:** Confirmed selectors are scoped so only comment cards and the Attending section are affected; no other `.list-item` or `.card` layouts changed.

### Engagement section parity (all post types)

**Request:** Apply the same engagement updates (reduced bottom padding on the section card) to all post types, not just events.

**Changes:**
- Renamed `.event-attending-section` to `.engagement-section` in `src/app/globals.css` (same rule: `padding-bottom: 8px`). Comment updated to: "Shared reduced bottom padding for Attending / Replies / Comments sections (all post types)".
- Added `engagement-section` to the section card in:
  - `EventEngagementSection.js` (Attending) — replaced `event-attending-section` with `engagement-section`
  - `EventCommentsSection.js` (Replies — events)
  - `ThreadedCommentsSection.js` (Comments — used by announcements, music, nomads, lore-memories, nostalgia, rant, bugs, art, memories, lore)
  - `ProjectRepliesSection.js` (Replies — projects)
  - `src/app/lobby/[id]/page.js` (Replies — forum threads)
  - `src/app/devlog/[id]/page.js` (Replies — devlog)

**Result:** Every Attending, Replies, or Comments block now uses `card engagement-section` and gets the same reduced bottom padding (8px).

## Errl Boombox (Additional Features – opt-in)

### Request
- Add an "Additional Features" card in account settings for opt-in experiments.
- First feature: Errl Boombox – draggable music player for YouTube, SoundCloud, and Spotify links.
- Checkbox in settings (unchecked by default); when checked, Boombox widget appears.
- Lets early adopters test and report bugs before making it default.

### Implementation

1. **`src/components/boombox/`** (new)
   - `storage.js` – localStorage load/save/clear for boombox state (pos, queue, activeIndex, minimized)
   - `BoomboxWidget.css` – panel styles aligned with forum design (neon-outline-card, var(--radius), rgba(7, 27, 37))
   - `BoomboxWidget.js` – draggable fixed widget; add tracks via URL; queue + iframe player; Min/Open

2. **`src/components/BoomboxPrefsProvider.js`** (new)
   - Client context for `boomboxEnabled` / `setBoomboxEnabled`; persists to `errl_boombox_enabled` in localStorage.
   - Renders `BoomboxWidget` only when enabled; uses `dynamic(..., { ssr: false })`.

3. **`src/app/layout.js`**
   - Import `BoomboxPrefsProvider`; wrap site content inside `UiPrefsProvider` with `BoomboxPrefsProvider`.

4. **`src/app/account/AccountSettings.js`**
   - Import `useBoomboxPrefs`.
   - New "Additional Features" card with checkbox for "Errl Boombox" (description: draggable music player, off by default).

### Refactor: reuse forum code and align design (follow-up)

**Audit of existing music features:**
- `src/lib/embeds.js`: `detectProviderFromUrl(url)` and `safeEmbedFromUrl(type, url, embedStyle, autoPlay)` – single source of truth for URL → embed. Used by MusicPostForm, ProfileSongPlayer, music pages, profile song.
- `src/lib/songProviders.js`: `getSongProviderMeta(value)` – provider labels, colors, icons. Used by MusicClient, ProfileMoodSongBlock, ProfileSongPlayer.
- Forum design: `neon-outline-card`, `--radius`, `rgba(7, 27, 37, 0.96)`, `rgba(22, 58, 74, 0.6)` (notifications-popover-errl), `var(--errl-text)`, `var(--muted)`.

**Changes made:**
- **Replaced custom boombox/providers/** – Removed `youtube.js`, `soundcloud.js`, `spotify.js`, `providers/index.js`. Boombox now uses `detectProviderFromUrl` + `safeEmbedFromUrl` from `embeds.js`; `parseTrackUrl` is a small local helper (~15 lines) that delegates to these.
- **Replaced custom providerLabel** – Uses `getSongProviderMeta(provider).label` from `songProviders.js`.
- **Removed clamp.js** – Inlined `Math.max(min, Math.min(max, n))` in BoomboxWidget (clamp is only used there).
- **CSS aligned with forum** – Panel uses `neon-outline-card`; background `rgba(7, 27, 37, 0.96)`; border `rgba(22, 58, 74, 0.6)`; `backdrop-filter: blur(14px)`; `var(--radius)`, `var(--errl-text)`, `var(--muted)`; input focus/placeholder match forum form styling; active track outline uses accent `rgba(52, 225, 255, 0.3)`.
- **Minor cleanup** – ASCII chars for middot (&#x2022;), × (&#xD7;); `aria-hidden` on emoji; `providerLabel` helper uses getSongProviderMeta.

**Files removed:** `boombox/clamp.js`, `boombox/providers/index.js`, `boombox/providers/youtube.js`, `boombox/providers/soundcloud.js`, `boombox/providers/spotify.js`.

### Double-check verification (2026-02-16)

**Data flow**
- BoomboxPrefsProvider: `errl_boombox_enabled` in localStorage; default false; reads on mount.
- BoomboxWidget: loads `errl_boombox_v1` state on mount; persists on state change; dynamic import with ssr: false.
- Layout: UiPrefsProvider > BoomboxPrefsProvider > site content; Account page is under main, so useBoomboxPrefs works.

**Load validation**
- On load, saved state is merged with defaults: `pos` validated as numbers; `queue` filtered to items with `embedUrl` and `provider`; `activeIndex` clamped to queue bounds; `minimized` coerced to boolean. Avoids crashes from corrupted or old localStorage.

**Imports and deps**
- BoomboxWidget: embeds.js (detectProviderFromUrl, safeEmbedFromUrl), songProviders.js (getSongProviderMeta), storage.js.
- AccountSettings: useBoomboxPrefs from BoomboxPrefsProvider.
- Layout: BoomboxPrefsProvider imported and wraps content.

**Drag**
- Pointer capture on dragbar; only left button or touch; pos clamped to viewport; resize handler re-clamps pos.

**Files verified**
- `src/components/boombox/BoomboxWidget.js`, `storage.js`, `BoomboxWidget.css`
- `src/components/BoomboxPrefsProvider.js`
- `src/app/layout.js`, `src/app/account/AccountSettings.js`

### Verification
- Unchecked by default; checkbox persists across sessions via localStorage.
- When checked, Boombox widget appears (fixed, draggable); paste YouTube/SoundCloud/Spotify link → Add → Play.
- Min/Open collapses/expands the body; queue and position persist in localStorage.
- URL parsing and embed URLs match forum music posts and profile song (same embeds.js logic).
- Panel styling matches notifications popover and forum card aesthetic.
- Load validation guards against corrupted localStorage.
- Lint passes.

### Files touched
- `src/components/boombox/BoomboxWidget.js` (refactored; uses embeds.js, songProviders.js; load validation for saved state)
- `src/components/boombox/BoomboxWidget.css` (refactored; forum design tokens)
- `src/components/boombox/storage.js` (kept; boombox-specific)
- `src/components/BoomboxPrefsProvider.js` (new)
- `src/app/layout.js` (BoomboxPrefsProvider wrap)
- `src/app/account/AccountSettings.js` (Additional Features card + Boombox checkbox)

---

## Home section cards – 24h dot behavior

- **Desired:** Post count always shown; dot only when there has been a post in the last 24 hours.
- **Format:** `11 (24h •)` – dot integrated inside the "(24h)" badge.
- **No dot** on sections without recent (24h) activity.

### Files changed

**`src/components/HomeSectionCard.js`** (compact mode only)
- Removed standalone `home-section-card__status-dot` span that was always rendered (dim when no recent, lit when recent).
- Badge and dot are now conditional: only render when `hasRecentInLast24h` is true.
- Structure: `{countShort}` then `{hasRecentInLast24h ? <span className="section-card-recent-badge"> (24h <span className="home-section-card__status-dot is-recent" />)</span> : null}`.
- Dot is nested inside the badge so it reads "11 (24h •)" with the green dot.
- Chevron (+/-) remains after the count-wrap.
- Logic unchanged: `hasRecentInLast24h` = `latestActivityTs` from `recentItems[0]?.createdAt` or `recentActivity?.createdAt`, and within 24h.

**`src/app/globals.css`**
- `.home-section-card__status-dot`: added `display: inline-block`, `vertical-align: middle`, `margin-inline: 2px` so the dot renders correctly when inline inside the badge text.
- `.home-section-card__status-dot.is-recent` unchanged (green #57ffbe, glow).

### Verification

- Sections with no activity: `latestActivityTs` is 0 → `hasRecentInLast24h` false → only count shown (e.g. "0", "1"), no "(24h)" or dot.
- Sections with activity older than 24h: `hasRecentInLast24h` false → same as above.
- Sections with activity within 24h: `hasRecentInLast24h` true → count + "(24h •)" with lit dot.
- Non-compact modes (standard card, no-recent-activity card) are unchanged; they use `countLabel` and do not show the 24h badge.

## Home Explore Sections (compact): post count + 24h badge for smallview/mobile

- **Ask:** Tighten compact row for smallview/pores/mobile: show "number" + word "post"/"posts", 24h indicator smaller and clearer that it only lights up when there's been activity in last 24h.
- **JS (HomeSectionCard.js):** Compact count now shows `countLabel` (e.g. "11 posts") instead of count only. 24h badge: removed parentheses; added `section-card-recent-badge__label` for "24h"; tooltip `title="Activity in last 24 hours"`. Removed unused `countShort`.
- **CSS (globals.css):** `.section-card-recent-badge` – inline-flex, smaller font (10px), uppercase, tighter letter-spacing; dot inside badge scoped to 4px and reduced glow so it fits better on narrow viewports. Base `.home-section-card__status-dot` (6px, full glow) unchanged elsewhere.
- **Verification:** Compact row displays e.g. "11 posts" then optional "24h" + dot only when `hasRecentInLast24h`; non-compact cards unchanged; scoped CSS only affects badge dot.

## Feed layout (consolidated – all changes)

Summary of feed layout changes made this session:

### Current structure (after follow-up: three-row, last activity bottom right)

- **Row 1:** Title (left) + stats inline on right (e.g. "21 views · 1 reply · 1 like").
- **Row 2:** Non-events: by user (left) + last activity (right) when present; single row, wraps on narrow. Events: by user (left) + event info (centered in remaining space) + last activity (right) when present.

### Files changed

**`src/lib/dates.js`**
- Added `formatDateTimeShort(timestamp)` for compact date/time in feed/meta. Uses `toLocaleDateString` + `toLocaleTimeString` (en-US, FORUM_TIME_ZONE). Omits year when same as current year; uses 2-digit year when different. Joins with a single space (e.g. "2/15 9:02 PM") to avoid locale odd characters.

**`src/components/PostMetaBar.js`**
- Row 1: title + `statsInline` (statLines joined with middot).
- Row 2: `byUserAtTime` only. Row 3: last activity, right-aligned, when `hasLastActivity`.
- Uses `formatDateTimeShort` for createdAt and lastActivity.
- `customRowsAfterTitle` prop overrides rows 2 and 3 (used for events).

**`src/app/feed/page.js`**
- Non-events: passes `lastActivity`, etc.; PostMetaBar renders row 2 (by user) and row 3 (last activity right).
- Events: passes `customRowsAfterTitle` with single event-row2 (by user left + event info centered + last activity right when present).
- Completed events (`hasPassed`): "Yesterday 6:00 PM (Event happened) · N attended" (no "Starts"); "N attended" has `title={attendeeNames}` so names show on hover; class `event-attendee-count--hover-only` for cursor.
- Upcoming events: "Starts ... (relative) · N attending: name1, name2".
- All timestamps use `formatDateTimeShort`.
- `item.meta` still rendered for non-events when present.

**`src/app/globals.css`**
- `.list-item h3`: margin 0 to reduce title-to-by spacing.
- `.post-meta-row2`: flex, flex-wrap wrap, gap 4px 10px (no nowrap; allows wrapping).
- `.post-meta-row3`: flex, justify-content flex-end, min-width 0.
- `.event-row2`, `.event-row2-middle`: event row layout (event-row2-centered and event-row3 removed).
- `.event-details-inline`: inline-flex for event info; `.event-details-icon` color and spacing.
- `.event-attendee-count--hover-only`: cursor help for completed-event attendee count.
- overflow-wrap and word-break on post-meta-row2, post-meta-row3, event-row2 to prevent overlap.
- At 640px: event-row2 stacks as column, align-items center.

### Double-check (verification)

- **PostMetaBar:** Row 1 = title + statsInline. When `customRowsAfterTitle` is null: row 2 = byUserAtTime only, row 3 = last activity (flex, justify-content flex-end) when `hasLastActivity`. When `customRowsAfterTitle` provided (events): replaces rows 2 and 3 entirely.
- **Non-events:** lastActivity passed; hasLastActivity = lastActivity && replies > 0; row 3 renders with right-aligned "Last activity by X at [time]".
- **Events:** lastActivity=undefined to PostMetaBar; customRowsAfterTitle returns single event-row2 div (byUser + event-row2-middle with eventInfo + last activity when item.lastActivity && item.replies > 0).
- **Event row 2 content:** hasPassed ? "date time (Event happened) · N attended" : "Starts date time (relative) · N attending: names". Completed: "N attended" has title=names, event-attendee-count--hover-only.
- **formatDateTimeShort:** Used for createdAt, lastActivity in PostMetaBar and feed; formatEventDate/formatEventTime for event dates.
- **CSS:** post-meta-row2 has flex-wrap wrap. post-meta-row2-with-activity uses justify-content space-between; post-meta-last-activity-inline has margin-left auto. event-row2 uses justify-content flex-start; event-row2-middle centers event info in remaining space. At max-width 640px, event-row2 becomes flex-direction column, align-items flex-start.
- **Overlap prevention:** overflow-wrap: break-word, word-break: break-word on row2, row3, event-row2.

### Follow-up: three-row layout, last activity bottom right, responsive cleanup

- **Request:** Events stay three rows; event info and attended list centered in row 2; last activity in bottom right for all items; fix overlap when viewport narrows.
- **PostMetaBar:** Reverted to three-row structure. Row 2 = by user only. Row 3 = last activity, right-aligned (justify-content: flex-end). Replaced `row2Suffix` with `customRowsAfterTitle` – when provided, replaces rows 2 and 3 (used for events).
- **Events:** Use `customRowsAfterTitle` with event-row2 (by user left + event info centered via event-row2-middle + last activity right when present). Event info includes icon, date/time, attended/attending.
- **CSS:** `.event-row2` with justify-content flex-start; `.event-row2-middle` flex: 1 1 auto for centered event info. Removed `event-row2-centered`. At 640px, event-row2 stacks as column with align-items flex-start.
- **Responsive:** event-row2 uses flex-wrap; on narrow viewports it becomes flex-direction: column so by user and event info stack without overlapping.

## Profile page: padding between profile card and tab switcher

- **`src/app/globals.css`**: `.profile-tabs-wrapper` `margin-top` changed from `0` to `12px` so the tab switcher (Activity, Gallery, Notes, Socials, Stats) has spacing above it. Media queries still reduce to 8px/4px on smaller viewports.

### Double-check
- **Padding amount:** Stack uses `gap: 10px`; profile-card-bio uses `16px`. Using `12px` for the tab wrapper adds visible breathing room without over-spacing (avoids increasing things too much).
- **Square glow on tab switcher:** The glow around the selected tab (Activity, etc.) can appear rectangular/square rather than smoothly rounded. Likely cause: `.tabs-pill-inner` has `overflow-y: hidden`, which clips the vertical extent of the sliding indicator’s `box-shadow` (`0 0 24px`). The indicator has `border-radius: 999px` but when the glow is clipped by the parent, it shows sharp horizontal cut-offs. Possible fix for later: add vertical padding to `.tabs-pill-inner` to give the glow room, or revisit overflow so the glow isn’t clipped.

## Edit notifications modal: collapsible sections to reduce height

### Request
- Tighten up the Edit notifications modal; many options made it long. Hide some content behind a click to reduce height.

### Implementation (`src/app/account/AccountSettings.js`)

1. **`CollapsibleSection` component**
   - Reusable control: clickable label + chevron (▲/▼). When expanded, renders children. Used for two long blocks.

2. **Forum thread sections (Site notifications)**
   - "Choose which types below" (Lobby + Sections toggles) is now behind a collapsible: "Choose which forum sections..." / "Hide forum sections". Collapsed by default so the modal is shorter; user can expand to pick sections.

3. **Post manipulation & user changes (Admin notifications)**
   - The list of admin event toggles (deleted, edited, hidden, locked, moved, pinned, restored, user deleted, user role changed) is now behind a collapsible: "Post manipulation & user changes..." / "Hide post/user alerts". Collapsed by default.

4. **State**
   - `showForumSections` and `showAdminEvents` (useState, default false) in `NotificationsEditor` control expansion.

### Verification
- No new linter errors. Modal shows fewer lines by default; expanding each section reveals the same toggles as before.

## Account Settings: Custom Neon color picker

### Issue
- Color theme dropdown included "Custom Neon" but there was no UI to choose the neon color, so the option did nothing useful.

### Implementation (`src/app/account/AccountSettings.js`)

1. **Neon color row (only when Color theme = Custom Neon, value 2)**
   - **Color picker:** `<input type="color">`; value is validated hex or fallback `#34e1ff`. On change: update local hex input state, `setUiBorderColor`, and `handleSaveSiteUi({ borderColor })` so choice persists and applies immediately.
   - **Hex text input:** Controlled by `customNeonHexInput` (local state). User can type/paste with or without `#`. On blur: normalize to `#rrggbb`, revert to current saved or `#34e1ff` if invalid; if normalized value differs from saved, call `setUiBorderColor` and `handleSaveSiteUi({ borderColor })`.

2. **State**
   - `customNeonHexInput` keeps the hex field editable without saving on every keystroke. Synced from context via `useEffect` when `uiColorMode` or `uiBorderColor` changes so picker and context stay in sync.

3. **Default when switching to Custom Neon**
   - Color theme dropdown `onChange`: when `mode === 2` and current `uiBorderColor` is missing or not a valid 6-digit hex, set `payload.borderColor = '#34e1ff'` so the first time a user selects Custom Neon they get a default and it is persisted.

4. **Save path**
   - `handleSaveSiteUi(patch)` now supports `patch.borderColor`. Builds `newUi.borderColor` from patch or existing `uiBorderColor`, includes `borderColor` in `uiPrefsDirty` when present, sends `newUi` to `POST /api/auth/ui-prefs`. On success, calls `setUiBorderColor(patch.borderColor)` when provided. API and `UiPrefsProvider` already supported `borderColor` / `ui_border_color`; only the Account Settings UI was missing the controls.

### Double-check (verification)
- `useUiPrefs()` supplies `uiBorderColor` / `setUiBorderColor`; `/api/auth/ui-prefs` accepts `borderColor` and writes `ui_border_color`; `/api/auth/me` returns `uiBorderColor`; layout passes `initialBorderColor` into `UiPrefsProvider`. No API or provider changes required.
- Color picker value is always a valid 6-digit hex (or fallback) so native input never receives invalid value.
- Hex input onBlur normalizes and only saves when normalized !== current, avoiding redundant requests.
- Lint: no new errors in `AccountSettings.js`.

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
   - Restructured to three explicit rows. Row 1: title only (no inline author) so title wraps cleanly. Row 2: "by username at time" block plus stats column on the right when there is no last activity. Row 3 (when last activity): last activity text on the left, stats as a column (one line per stat, `align-items: flex-end`) on the right.
   - Stats rendered as a column of spans instead of one joined string.
   - Added `hideStats` prop so feed can hide stats in PostMetaBar for events and show them in the event block.
   - Removed condensed desktop/mobile variants and standalone date row; date lives inside "by user at time".

2. **`src/app/feed/page.js`**
   - PostMetaBar for events: `hideStats={true}`.
   - Event block: event info row stays centered. New bottom row: left = attended + last activity (stacked in a column), right = views and replies stacked in a column. Bottom row only renders when there are attendees, last activity, or stats.

3. **`src/app/globals.css`**
   - Replaced old PostMetaBar desktop/mobile media rules (condensed-author, stats-desktop/mobile, date-mobile-only, etc.) with minimal rules: `.post-meta-title-row`, `.post-meta-by-row`, `.post-meta-row3`, `.post-meta-stats-column` for min-width and alignment; smaller font for last-activity on mobile; event-info-row center.

### Follow-up: no extra rows, tighter spacing

- **Stats stay on same row:** Row 2 and row 3 use `flexWrap: 'nowrap'` so the stats column never wraps to an additional row; left side uses `flex: '1 1 auto', minWidth: 0` so it absorbs space and wraps internally. Same for feed event bottom row (`event-bottom-row`): `flexWrap: 'nowrap'` so views/replies stay on the right of the same row as attended/last activity.
- **"By user at time" wrapping:** Removed `white-space: nowrap` from the by-block so it can wrap inside its cell on narrow viewports instead of forcing overflow; stats remain right-aligned on the same row.
- **Tighter vertical gap:** PostMetaBar column gap reduced from 4px to 2px between title row, by-user row, and last-activity row (less space between title/section label and "by username at time").

## Account / Edit Profile: header + remove breadcrumb buttons

### Request
- Add "Edit Profile" header and divider to the Edit Profile tab, mirroring the Account tab's "Account Settings" style.
- Remove "View Public Profile" and "Edit profile" buttons from the breadcrumb row under the header (now available in kebab menu).

### Implementation

1. **`src/app/account/AccountTabsClient.js`**
   - Added "Edit Profile" h2 with `section-title` class and matching hr divider above the Edit profile card content.
   - Styling matches Account tab: `marginBottom: 16px` on header div, `hr` with `marginTop/Bottom: 16px`, `borderTop: 1px solid rgba(255, 255, 255, 0.1)`.

2. **`src/app/account/page.js`**
   - Removed `page-top-row` block that contained the "View Public Profile" link.
   - Removed unused `Link` import.
   - Page now renders stack > AccountTabsClient only.

3. **`src/app/profile/[username]/page.js`**
   - Removed `page-top-row` block that contained the "Edit profile" link (when `isOwnProfile`).
   - Removed unused `Link` import.
   - Page now renders stack > section.card.profile-card directly.

### Verification (double-check)
- **Account page**: No `page-top-row`, no "View Public Profile" link. `Link` import removed; `stack` wraps `AccountTabsClient` directly.
- **Profile page**: No `page-top-row`, no "Edit profile" button. `Link` import removed; `stack` wraps `section.card.profile-card` directly. Profile page itself had no other `Link` usage; child components (e.g. ProfileTabsClient) import their own.
- **AccountTabsClient**: Edit Profile tab content (when `activeTab === 'profile'`) has "Edit Profile" h2 + hr + account-edit-card, matching Account tab structure.
- **page-top-row**: Still used by `PageTopRow.js` and other pages (e.g. projects, forum); only removed from account and profile pages.

## Additional notification types (Edit notifications modal)

### Request
- User expected additional notification types in the Edit notifications modal; only the original set (RSVP, Like, Project update, Mention, Reply, Comment, Delivery, Admin) was visible.

### Implementation

1. **Migration `migrations/0067_add_forum_nomad_notification_prefs.sql`**
   - Added `notify_new_forum_threads_enabled` and `notify_nomad_activity_enabled` (INTEGER NOT NULL DEFAULT 0) to `users`.

2. **API and auth**
   - **`src/app/api/auth/notification-prefs/route.js`**: Accept and persist `newForumThreadsEnabled`, `nomadActivityEnabled`; return them in the JSON response.
   - **`src/lib/auth.js`**: Main and admin SELECTs include the new columns; fallback paths set both to 0 when columns are missing.
   - **`src/app/api/auth/me/route.js`**: Return `notifyNewForumThreadsEnabled`, `notifyNomadActivityEnabled`.
   - **`src/app/api/admin/users/[id]/delete/route.js`**: When anonymizing a user, set both new prefs to 0.

3. **UI `src/app/account/AccountSettings.js`**
   - **notifPrefs**: Added `site.newForumThreads` and `site.nomadActivity` (default false; support snake_case and camelCase from API).
   - **handleSaveNotifs**: Payload includes `newForumThreadsEnabled`, `nomadActivityEnabled`.
   - **NotificationsEditor**: In the Site notifications card, added:
     - **New forum threads** with helper text: "When someone starts a new thread in the forum."
     - **Nomad section activity** with helper text: "When there's new content in the Nomad section."

### Deploy note
- Run migration 0067 before or with deploy; notification-prefs UPDATE and auth SELECTs expect the new columns. Fallback auth path handles missing columns (defaults to 0).

### Follow-up (not in this pass)
- **Sending**: When a new forum thread is created, notify users with `notify_new_forum_threads_enabled = 1` (in addition to existing admin notifications). When nomad-scoped content is created, notify users with `notify_nomad_activity_enabled = 1`. Requires wiring in thread-creation and nomad-post creation APIs plus outbound (email/SMS) if desired.

## New forum threads: per-section / per–thread-type toggles

### Request
- "New forum threads" should have additional toggles for specific thread types, section types, or whatever across the forum.

### Implementation

1. **`migrations/0068_add_notify_new_content_sections.sql`**
   - Added `notify_new_content_sections` TEXT NOT NULL DEFAULT '{}' to `users`. JSON object keyed by section/thread type (e.g. `lobby_general`, `lobby_shitposts`, `art`, `rant`, `lore`, …).

2. **`src/lib/notificationSections.js`**
   - Central list of keys and labels: **Lobby** (General (Lobby), Shitposts), **Sections** (Art, Nostalgia, Bugs, Rant, Lore, Memories, About, Nomads). Helpers: `parseNewContentSectionsJson`, `defaultNewContentSections`, `ALL_NEW_CONTENT_KEYS`.

3. **API and auth**
   - **notification-prefs**: Accepts `newForumThreadSections` (object), sanitizes to allowed keys, saves as JSON. Returns `notifyNewContentSections` in response.
   - **auth.js**: Main and admin SELECTs include `notify_new_content_sections`; fallbacks set to `'{}'` when column missing.
   - **/api/auth/me**: Returns `notifyNewContentSections` (parsed object).
   - **admin user delete**: Sets `notify_new_content_sections = '{}'` when anonymizing.

4. **AccountSettings.js**
   - **notifPrefs**: Added `newForumThreadSections` (parsed from user, merged with default keys).
   - **anySiteNotifsEnabled(prefs)**: Now treats "site notifs on" when either any site toggle is on or (newForumThreads master on and any section toggle on).
   - **handleSaveNotifs**: Payload includes `newForumThreadSections`.
   - **NotificationsEditor**: Under "New forum threads" master toggle, added indented block "Lobby" (General (Lobby), Shitposts) and "Sections" (Art, Nostalgia, Bugs, Rant, Lore, Memories, About, Nomads) with a ToggleLine per key.

### Deploy
- Run migration 0068 with 0067; notification-prefs and auth expect `notify_new_content_sections`. Fallback auth path uses `'{}'` if column missing.

## Admin notifications: post manipulation and user changes

### Request
- Add admin notification options for posts being deleted and other post manipulation (edit, hide, lock, move, pin, restore), plus user-related events (user deleted, user role changed).

### Implementation

1. **Migration `migrations/0069_add_notify_admin_events.sql`**
   - Added `notify_admin_events` TEXT NOT NULL DEFAULT '{}' to `users`. JSON object keyed by event type.

2. **`src/lib/adminNotificationEvents.js`**
   - Event keys and labels: Post/content deleted, edited, hidden, locked, moved, pinned, restored; User deleted; User role changed. Helpers: `parseAdminEventsJson`, `defaultAdminEvents`, `ADMIN_EVENT_KEYS`, `ALL_ADMIN_EVENT_KEYS`.

3. **API and auth**
   - **notification-prefs**: For admins, accepts `adminEvents` (object), sanitizes to allowed keys, saves as JSON in `notify_admin_events`. Non-admins get `notify_admin_events = '{}'`. Response includes `notifyAdminEvents`.
   - **auth.js**: Main and admin SELECTs include `notify_admin_events`; fallbacks set to `'{}'`.
   - **/api/auth/me**: Returns `notifyAdminEvents` (parsed object).
   - **admin user delete**: Sets `notify_admin_events = '{}'` when anonymizing.

4. **AccountSettings.js**
   - **notifPrefs**: Added `adminEvents` (parsed from user, merged with default keys).
   - **handleSaveNotifs**: Payload includes `adminEvents` for admins.
   - **Admin notifications card**: After the existing three toggles (New user signups, New forum threads, New forum replies), added subsection "Post manipulation & user changes" with a ToggleLine per event (post_deleted, content_edited, content_hidden, content_locked, content_moved, content_pinned, content_restored, user_deleted, user_role_changed).

5. **`src/lib/adminNotifications.js`**
   - **notifyAdminsOfEvent({ db, eventType, actorUser, targetType, targetId })**: Loads admins, filters by `notify_admin_events` JSON for the given `eventType`, inserts notifications with type `admin_event`. For use when wiring delete/edit/hide/lock/move/pin/restore/role routes.

6. **`src/components/NotificationsMenu.js`**
   - Added branch for `n.type === 'admin_event'`: resolve href from target_type/target_id, label "Moderation: [content type] updated" or "Moderation activity".

### Follow-up (sending)
- In each relevant route (e.g. post delete, forum delete, edit, hide, lock, move, pin, restore, user delete, user role change), call `notifyAdminsOfEvent({ db, eventType: 'post_deleted' | 'content_edited' | ... })` with the appropriate event type and target. No routes were wired in this pass; prefs and helper are in place.

## Song links & music posts: auto-detect provider from URL

### Request
- Replace separate "URL" + "provider dropdown" with a single URL field that auto-detects provider (YouTube, YouTube Music, SoundCloud, Spotify).
- Optionally improve how music posts display the embed (provider label).

### Implementation

1. **`src/lib/embeds.js`**
   - **`detectProviderFromUrl(url)`**: Returns `'youtube' | 'youtube-music' | 'soundcloud' | 'spotify' | null` from URL host/path (spotify.com, music.youtube.com, youtube.com/youtu.be, soundcloud.com).

2. **Music posts**
   - **MusicPostForm.js**: Single "Song or embed URL" field; type is derived via `detectProviderFromUrl(url)` and shown as "Detected: [Provider]"; hidden `name="type"` for submit. SoundCloud player-style dropdown still shown when SoundCloud is detected.
   - **POST /api/music/posts**: If `type` is missing, set `type = detectProviderFromUrl(url)`; if still missing, return `error=invalid`. Requires only title + url.

3. **Profile song (account)**
   - **AccountTabsClient.js**: Single Song URL field; on change, set `profileSongProvider` to `detectProviderFromUrl(url)`; removed provider dropdown; show "Detected: [Provider]" under the input when URL is present. `getProfileSongProviderLabel` now uses `getSongProviderMeta(value).label` (removed `PROFILE_SONG_PROVIDERS` list).
   - **POST /api/account/profile-extras**: When `songUrl` is set and `songProvider` is empty, set `songProvider = detectProviderFromUrl(songUrl) || 'soundcloud'` (was hardcoded `'soundcloud'`).

4. **Display on music posts**
   - **music/[id]/page.js** and **MusicClient.js**: Show a small muted "PROVIDER" label (e.g. "YouTube", "SoundCloud") above the embed iframe on detail page and feed cards.

5. **`src/lib/songProviders.js`**
   - **getSongProviderMeta**: Prefer direct lookup by raw value so `'youtube-music'` returns "YouTube Music" label instead of being normalized to `'youtube'` for display.

### Follow-up: URL and content-type coverage

6. **`src/lib/embeds.js`** (second pass)
   - **Spotify embed URL**: Fixed to use `/embed/{type}/{id}` (was `/embed/{id}`). **parseSpotifyEmbed(url)** returns `{ type, id }` for: track, album, playlist, artist, episode, show. **spotifyPlayerSrc(embedType, id, autoPlay)** builds correct URL.
   - **Spotify detection**: **detectProviderFromUrl** now recognizes Spotify URLs with `/artist/`, `/episode/`, `/show/` in addition to track/album/playlist (SPOTIFY_EMBED_PATH_PREFIXES).
   - **Spotify embed height by type**: track 152px, episode/show 232px, album/playlist/artist 380px (**spotifyEmbedHeight**).
   - **YouTube video ID**: **parseYouTubeId** now also handles `/live/VIDEO_ID` and `/v/VIDEO_ID`; youtu.be path trimmed and first segment used so IDs with query params still work.

### Verification & coverage checklist

**Files touched (all verified):**

| File | Role |
|------|------|
| `src/lib/embeds.js` | detectProviderFromUrl, parseYouTubeId/PlaylistId, parseSpotifyEmbed, safeEmbedFromUrl, Spotify/SoundCloud helpers; single source of truth for URL → embed. |
| `src/lib/songProviders.js` | getSongProviderMeta (display labels); direct lookup so youtube-music shows "YouTube Music". |
| `src/components/MusicPostForm.js` | Single URL field; type from detectProviderFromUrl; hidden type input; "Detected: [Provider]"; SoundCloud player-style when SoundCloud. |
| `src/app/api/music/posts/route.js` | Infers type from URL when missing; validates with safeEmbedFromUrl. |
| `src/app/api/account/profile-extras/route.js` | Infers songProvider from detectProviderFromUrl(songUrl) when URL set and provider empty. |
| `src/app/account/AccountTabsClient.js` | Single Song URL field; provider set on change via detectProviderFromUrl; "Detected: [Provider]"; no provider dropdown. |
| `src/app/music/page.js` | Feed: builds embed with safeEmbedFromUrl(row.type, row.url, row.embed_style). |
| `src/app/music/MusicClient.js` | Feed cards: provider label above embed via getSongProviderMeta(row.type).label. |
| `src/app/music/[id]/page.js` | Detail: safeEmbedFromUrl(post.type, post.url, post.embed_style); provider label above embed. |
| `src/components/ProfileSongPlayer.js` | safeEmbedFromUrl(provider, songUrl, embedStyle, autoPlay) for profile player. |

**URL / content-type coverage:**

| Provider | Detection (host/path) | Single item | Playlist / album / show | Embed behaviour |
|---------|------------------------|-------------|--------------------------|-----------------|
| **YouTube** | youtu.be, *youtube.com | watch?v=, embed/, shorts/, live/, v/, youtu.be | list= or /playlist/ | video + optional list; playlist-only → videoseries. |
| **YouTube Music** | music.youtube.com | same as YouTube | same | same embed logic as YouTube. |
| **SoundCloud** | *soundcloud.com | any track URL | path contains /sets/ | isSoundCloudPlaylist → height 450 when auto; else compact/artwork by embed_style. |
| **Spotify** | spotify.com + /track/, /album/, /playlist/, /artist/, /episode/, /show/ | track, episode | album, playlist, artist, show | parseSpotifyEmbed → /embed/{type}/{id}; height by type (152 / 232 / 380). |

**Edge cases covered:**

- Music post form: type required only from URL (or hidden input); API infers type if missing.
- Profile song: provider optional in request; API infers from URL when URL present and provider empty.
- Invalid or unsupported URL: detectProviderFromUrl returns null; safeEmbedFromUrl returns null → API returns error (music posts) or no embed (profile).
- Existing posts: stored `type` and `url` unchanged; display uses post.type for label and safeEmbedFromUrl(type, url, embed_style) for iframe.
- Edit music post: edit form still sends type (from existing post); no change required for edit flow.

## Library dropdown: center list item text and increase font size

### Request
- Library dropdown list items (Announcements, Art & Nostalgia, Bugs & Rants, etc.): text was top-left aligned and small. Center the text in each choice box and make the text a bit bigger. Do not change the size of the option boxes.

### Implementation (`src/app/globals.css`)

1. **`.header-library-list a`**
   - Changed `display: block` to `display: flex; align-items: center; justify-content: center` so the label is centered horizontally and vertically inside each row.
   - Kept `width: 100%`, padding (4px 6px), border-radius, and all other properties; box dimensions unchanged.

2. **`.header-library-item-label`**
   - Increased `font-size` from `10.5px` to `12px`.
   - Added `text-align: center` so the label text is centered (and any future wrap would center).

3. **Desktop override `@media (min-width: 901px)`**
   - `.header-library-list a`: removed redundant `font-size: 10.5px`; left only `padding: 5px 7px` so row size is unchanged.

4. **Small-viewport override** (inside existing nav media block)
   - `.header-library-item-label`: updated from `font-size: 11px` to `12px` to match the new base.

### Double-check
- **Centering**: Parent anchor is flex with `align-items: center` and `justify-content: center`; the inner span (label) is block with `text-align: center`. Text is centered in the box.
- **Box size**: No changes to padding, width, height, or grid; only display/alignment and label font-size.
- **No other overrides**: Grep confirmed no other rules for `.header-library-list a` or `.header-library-item-label` that would conflict.
- **Markup**: `SiteHeader.js` unchanged; list items remain `<a><span class="header-library-item-label">{item.label}</span></a>`.

## Account / Edit Profile: title padding, centering, and sub-tab glow

### Request
- Equal padding above and below the "Account Settings" and "Edit Profile" title text on both tabs.
- Center that title text on all viewports.
- Reduce the glow on the yellow sub-tab section titles (Recent activity, Gallery, Notes, etc.) on the Edit Profile tab.

### Implementation

1. **`globals.css`**
   - Added `.account-page-title-wrap`: `padding: 16px 0`, `text-align: center`; child `.section-title` margin set to 0 so padding defines vertical spacing.
   - `.account-edit-panel .section-title`: reduced glow from `0 0 10px rgba(245, 255, 183, 0.6)` to `0 0 6px rgba(245, 255, 183, 0.35)`.

2. **`AccountTabsClient.js`**
   - Account tab: title wrapper uses `className="account-page-title-wrap"`; hr `marginTop` set to 0 so space below title equals wrapper bottom padding (16px).
   - Edit Profile tab: same wrapper class and hr `marginTop: 0`.

### Double-check / verification

- **Scope of centered titles**: Only the two main page headings use `.account-page-title-wrap` (Account Settings at ~1058, Edit Profile at ~1073). All other `section-title` usages in this file (Username, Avatar, Mood & Song, Socials, Gallery, Notes, Stats, Recent activity) are inside content panels and are not wrapped, so they remain left-aligned as before.
- **Equal padding**: Wrapper has `padding: 16px 0`; hr has `marginTop: 0`, so the gap below the title is only the wrapper’s 16px bottom padding. Net: 16px above title, 16px below title.
- **Glow scope**: `.account-edit-panel .section-title` targets only headings inside `.account-edit-panel` (the sub-tab content). The main "Account Settings" and "Edit Profile" h2s are not inside `.account-edit-panel`, so they keep the default teal `.section-title` glow; only the yellow sub-tab titles (Recent activity, Gallery, Notes, etc.) get the reduced glow.
- **Responsive**: Media queries that alter `.section-title` (e.g. font-size at 3115, 8037) do not override padding or text-align; the wrap’s 16px padding and centering apply at all viewports.
- **Files touched**: `src/app/globals.css` (new class + one rule change), `src/app/account/AccountTabsClient.js` (two wrappers, two hr marginTop values). No other components (e.g. ProfileTabsClient, AccountSettings) use the new class.

## Notification wiring verification (new notification changes)

- **Prefs & UI (all users)**: Edit notifications modal has Site (New forum threads, forum sections collapsible, Nomad section activity), Delivery (email/SMS), and for admins Admin (New user/thread/reply + Post manipulation & user changes collapsible). All toggles save via `POST /api/auth/notification-prefs`; payload includes `newForumThreadsEnabled`, `nomadActivityEnabled`, `newForumThreadSections`, `adminEvents`. Auth/me and auth.js return the new columns; migrations 0067, 0068, 0069 add `notify_new_forum_threads_enabled`, `notify_nomad_activity_enabled`, `notify_new_content_sections`, `notify_admin_events`.
- **Display**: NotificationsMenu handles `admin_event` (and other types); notifications GET uses JOIN on actor_user_id (broadcast/test use admin id so rows are returned).
- **Wiring completed**: (1) **Site new forum threads**: `src/lib/siteNotifications.js` added with `notifyUsersOfNewForumThread()` (sectionKey lobby_general/lobby_shitposts) and `notifyUsersOfNewContent()` (section + nomad). Threads route and shitposts route call the former after create; posts route calls the latter so section toggles and nomad activity both fire. (2) **Admin events**: `notifyAdminsOfEvent()` now called from forum delete, posts delete, admin posts DELETE/POST (edit)/pin/restore, admin move, admin users delete/role, and all hide/lock routes (forum, posts, timeline, events, music, projects, devlog). (3) **Menu**: NotificationsMenu labels added for `new_forum_thread` and `new_content` (post section).

## Event comments: nested (threaded) replies

### Issue
- Event reply form showed "Replying to [username]" and submitted a hidden `reply_to_id`, but the API did not read or store it. Replies always appeared as top-level; no visual threading.

### Implementation (file-by-file)

1. **`migrations/0070_event_comments_threading.sql`** (new file)
   - `ALTER TABLE event_comments ADD COLUMN reply_to_id TEXT;`
   - `CREATE INDEX IF NOT EXISTS idx_event_comments_reply_to ON event_comments(reply_to_id);`
   - Pattern matches 0015 (devlog), 0014 (project_replies), 0029 (forum_replies).

2. **`src/app/api/events/[id]/comments/route.js`**
   - **GET**: SELECT now includes `event_comments.reply_to_id` so API consumers get threading data. If migration not applied, this GET will throw (no such column); event detail page does not use this GET (it uses server-side query in page.js).
   - **POST**:
     - Read `reply_to_id`: `formData.get('reply_to_id')`, trimmed; empty string → `null`.
     - **effectiveReplyTo**: If `replyToId` set, load parent with `SELECT id, reply_to_id FROM event_comments WHERE id = ? AND event_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)`. If no row → `effectiveReplyTo = null`. If `parent.reply_to_id` is set (parent is already a child) → `effectiveReplyTo = parent.reply_to_id` (one-level clamp). On any DB error in this block → `effectiveReplyTo = null`.
     - **INSERT**: First try `INSERT ... (id, event_id, author_user_id, body, created_at, reply_to_id) VALUES (..., effectiveReplyTo)`. On failure (e.g. column missing), fallback `INSERT ... (id, event_id, author_user_id, body, created_at)` with no reply_to_id (comment created as top-level).

3. **`src/app/events/[id]/page.js`**
   - **Main comments query** (around line 177): Adds `event_comments.reply_to_id` to the SELECT. Used when `is_deleted` column exists and migration 0070 is applied.
   - **Fallback comments query** (around line 196): Does **not** include `reply_to_id`. Used when first query fails (e.g. older DB without is_deleted). Comments from fallback have no `reply_to_id` so EventCommentsSection treats all as top-level.
   - **commentsWithHtml**: `return { ...c, ... }` preserves `reply_to_id` from `c`; no change needed. EventCommentsSection receives `comments={commentsWithHtml}`.

4. **`src/components/EventCommentsSection.js`**
   - **Data shape**: Expects each comment to have `id`, optional `reply_to_id`, and existing fields (author_name, body, body_html, created_at, etc.).
   - **byParent map**: `validReplyIds = Set(comments.map(c => c.id).filter(Boolean))`. For each comment, `key = (c.reply_to_id && validReplyIds.has(c.reply_to_id)) ? c.reply_to_id : null` so orphaned or invalid `reply_to_id` → top-level.
   - **Render**: Top-level = `byParent.get(null)`; for each top-level comment, children = `byParent.get(c.id)`. Each thread: wrapper `div.stack` with `key={thread-${c.id}}`, then `renderComment(c, { isChild: false })`, then if children exist `<div className="reply-children">` with `renderComment(child, { isChild: true })` for each. Child divs get class `reply-item--child` in addition to `list-item comment-card`.
   - **Form**: Unchanged; already had hidden `name="reply_to_id"` and "Replying to {author_name}" label. No change to ReplyButton, URL `?replyTo=`, or cancel behavior.

### Double-check / verification
- **Migration**: Single new migration file; no other migrations reference event_comments.reply_to_id.
- **API POST**: Parent check uses same event `id` (event_id) so cross-event reply_to_id is impossible; one-level clamp prevents deep threads.
- **API fallback INSERT**: Does not pass effectiveReplyTo; comment is stored without reply_to_id when column missing.
- **Event page**: Only the primary SELECT (with is_deleted filter) includes reply_to_id; fallback SELECT omits it so DBs without the column still load comments.
- **EventCommentsSection**: Orphan handling (validReplyIds) matches ProjectRepliesSection; CSS classes `reply-item--child` and `reply-children` already exist in globals.css and are used by project replies and lobby/devlog.
- **Ordering**: Comments remain ordered by created_at ASC from the query; byParent groups by parent but does not reorder—top-level order is query order; children under a parent are in query order.

### Edge cases
- **Pre-migration DB**: POST fallback creates comment without reply_to_id; event page fallback query returns comments without reply_to_id; UI shows all as top-level. After migration, new replies can be nested.
- **Existing comments**: No backfill; existing rows have no reply_to_id, so they all render as top-level.
- **Deleted parent**: If reply_to_id points to a deleted (or missing) comment, validReplyIds excludes it so that reply is shown as top-level.
- **GET /api/events/[id]/comments**: If migration not applied, GET fails when selecting reply_to_id. Event detail page does not use this endpoint; only server-side query in page.js is used. If any client fetches comments via this GET, run migration before deploy.

### Files touched (summary)
| File | Change |
|------|--------|
| `migrations/0070_event_comments_threading.sql` | New: add reply_to_id + index on event_comments. |
| `src/app/api/events/[id]/comments/route.js` | GET: select reply_to_id. POST: read reply_to_id, validate/clamp parent, INSERT with reply_to_id and fallback INSERT without. |
| `src/app/events/[id]/page.js` | Main comments SELECT: add event_comments.reply_to_id. Fallback SELECT: unchanged (no reply_to_id). |
| `src/components/EventCommentsSection.js` | Build byParent from reply_to_id, render top-level then reply-children with reply-item--child. |
| `05-Logs/Daily/2026-02-16-cursor-notes.md` | This log entry. |

### Deploy
- Run migration **0070** before or with deploy so event_comments has reply_to_id. Then new "Reply" submissions store the parent and display as nested under the correct comment.

## Threading for all post and reply types (audit and implementation)

### Audit summary
| Type | Table | reply_to_id (DB) | API read/save + clamp | UI threading |
|------|--------|------------------|------------------------|--------------|
| Events | event_comments | Yes (0070) | Yes | EventCommentsSection |
| Projects | project_replies | Yes (0014) | Yes | ProjectRepliesSection |
| Forum/Lobby | forum_replies | Yes (0029) | Yes | lobby/[id] inline |
| Devlog | dev_log_comments | Yes (0015) | Yes | devlog/[id] inline |
| Post comments (sections) | post_comments | Yes (0017) | Saved but no clamp; UI flat | **Fixed** |
| Timeline/Announcements | timeline_comments | No | No | **Fixed** |
| Music | music_comments | No | No | **Fixed** |

### Changes made

1. **post_comments (sections: lore, memories, art, bugs, rant, nostalgia, lore-memories, nomads)**
   - **API** `src/app/api/posts/[id]/comments/route.js`: Added one-level clamp (effectiveReplyTo from parent lookup; if parent is already a child, use parent.reply_to_id). INSERT already had reply_to_id; now passes effectiveReplyTo.
   - **Shared component** `src/components/ThreadedCommentsSection.js`: New client component. Takes comments (with reply_to_id), replyLinkPrefix, action, hiddenFields, likePostType, deleteType, parentId, user, isAdmin, commentNotice, usernameColorMap, isLocked, sectionTitle. Builds byParent map, renders top-level then reply-children with reply-item--child; form with reply_to_id and "Replying to X"; listens to replyToChanged and URL replyTo.
   - **Section pages** (lore, memories, art, bugs, rant, nostalgia, lore-memories, nomads) `[id]/page.js`: Comments query now selects `post_comments.reply_to_id`; comments mapped to add body_html and reply_to_id string; inline comment list + CollapsibleCommentForm replaced with ThreadedCommentsSection. Unused imports (ReplyButton, DeleteCommentButton, CollapsibleCommentForm/CommentFormWrapper, formatDateTime) removed.

2. **timeline_comments (announcements)**
   - **Migration** `migrations/0073_timeline_comments_threading.sql`: Added reply_to_id TEXT and index on timeline_comments. (0071 was already used by notification_target_sub_id.)
   - **API** `src/app/api/timeline/[id]/comments/route.js`: GET selects reply_to_id, author_user_id, author_color_preference. POST reads reply_to_id; effectiveReplyTo with parent lookup and one-level clamp; INSERT with reply_to_id, fallback INSERT without.
   - **Page** `src/app/announcements/[id]/page.js`: Comments query with reply_to_id (try/catch fallback query without for rollout); comments mapped to body_html and reply_to_id; comment section replaced with ThreadedCommentsSection (replyLinkPrefix `/announcements/${id}`, action `/api/timeline/${id}/comments`, likePostType timeline_comment, deleteType timeline). Unused imports removed.

3. **music_comments**
   - **Migration** `migrations/0074_music_comments_threading.sql`: Added reply_to_id TEXT and index on music_comments.
   - **API** `src/app/api/music/comments/route.js`: POST reads reply_to_id; effectiveReplyTo with parent lookup and one-level clamp; INSERT with reply_to_id, fallback INSERT without.
   - **Page** `src/app/music/[id]/page.js`: First comments query selects music_comments.reply_to_id (fallback query unchanged for rollout); safeComments map includes reply_to_id, like_count, liked; comment section replaced with ThreadedCommentsSection (hiddenFields post_id, likePostType music_comment, deleteType music). Unused imports removed.

### Double-check / verification (threading)
- **Migrations**: 0070 (event_comments), 0073 (timeline_comments), 0074 (music_comments). No duplicate migration numbers (0071 = notification_target_sub_id, 0072 unused).
- **APIs**: All four comment/reply types that support threading now use effectiveReplyTo: events, posts (post_comments), timeline, music. Parent lookup scoped to same parent (event_id, post_id, update_id, post_id). One-level clamp (if parent.reply_to_id set, use it). Timeline and music have try/catch fallback INSERT without reply_to_id for pre-migration DBs. Post_comments has no fallback INSERT (0017 assumed applied).
- **ThreadedCommentsSection**: Used in 10 places: lore, memories, art, bugs, rant, nostalgia, lore-memories, nomads, announcements, music. byParent key = (reply_to_id && validReplyIds.has(reply_to_id)) ? reply_to_id : null. Renders top then reply-children with reply-item--child. Form has hidden reply_to_id when replyingTo set; replyToChanged and URL replyTo open form and set replyingTo.
- **Section pages**: All 8 post_comments sections select post_comments.reply_to_id and map comments to body_html and reply_to_id. Announcements: try/catch with fallback query without reply_to_id. Music: first query has reply_to_id, fallback (in existing catch) does not; safeComments includes reply_to_id, like_count, liked.
- **No leftover UI**: Grep confirms no section or announcements or music [id] page still uses CollapsibleCommentForm or CommentFormWrapper for the comments block.

### Deploy (threading)
- Run **0073** for timeline_comments and **0074** for music_comments if not already applied. Post_comments already had reply_to_id (0017); no new migration. Section and announcements pages will show flat comments if reply_to_id column is missing (fallback queries); after migrations, new nested replies will display correctly.

## Notification cleanup on undo (like/unlike, delete, un-RSVP, comment/reply delete)

### Goal
- Keep notifications in sync with actions: when an action is undone (unlike, un-RSVP, post/thread/event/… deleted, comment/reply deleted), remove the corresponding notification so there are no broken links.

### Implementation

1. **`src/lib/notificationCleanup.js`** (new)
   - `deleteNotificationsForLike(db, postType, postId, actorUserId)` – remove like notification when user unlikes.
   - `deleteNotificationsForRsvp(db, eventId, actorUserId)` – remove RSVP notification when user un-RSVPs.
   - `deleteNotificationsForTarget(db, targetType, targetId)` – remove all notifications for a content (post, forum_thread, event, music_post, project, timeline_update, dev_log) when that content is soft-deleted.
   - `deleteNotificationsForTargetSubId(db, targetSubId)` – remove notifications for a specific comment/reply when that comment/reply is deleted (uses `target_sub_id`).
   - `insertNotificationWithOptionalSubId(db, row)` – insert notification with optional `target_sub_id`; if column missing, retries without it (rollout-safe).

2. **`migrations/0071_notification_target_sub_id.sql`**
   - `ALTER TABLE notifications ADD COLUMN target_sub_id TEXT;`
   - Index on `target_sub_id` for deletes.

3. **Undo wiring**
   - **Unlike**: `src/app/api/likes/route.js` – in the “existing like” branch, after `DELETE FROM post_likes`, call `deleteNotificationsForLike(db, postType, postId, user.id)`.
   - **Un-RSVP**: `src/app/api/events/[id]/rsvp/route.js` – when removing attendee, call `deleteNotificationsForRsvp(db, id, user.id)`.
   - **Content delete**: Call `deleteNotificationsForTarget(db, type, id)` in: `posts/[id]/delete`, `forum/[id]/delete`, `admin/posts/[id]` DELETE, `music/[id]/delete`, `events/[id]/delete`, `projects/[id]/delete`, `timeline/[id]/delete`, `devlog/[id]/delete`.
   - **Comment/reply delete**: Call `deleteNotificationsForTargetSubId(db, commentId|replyId)` in: `posts/…/comments/[commentId]/delete`, `events/…/comments/[commentId]/delete`, `forum/…/replies/[replyId]/delete`, `music/comments/[commentId]/delete`, `timeline/…/comments/[commentId]/delete`, `projects/…/replies/[replyId]/delete`, `devlog/…/comments/[commentId]/delete`.

4. **Setting `target_sub_id` on create**
   - Comment/reply notification INSERTs now use `insertNotificationWithOptionalSubId` with `target_sub_id: commentId|replyId` in: event comments, post comments, forum replies, timeline comments, music comments, project comments, project replies, devlog comments. This allows precise removal when that comment/reply is later deleted.

### Double-check (verification)

**Undo paths – all wired:**

| Action undone | Cleanup | Where |
|---------------|---------|--------|
| Unlike | `deleteNotificationsForLike(db, postType, postId, user.id)` | `api/likes/route.js` (existing-like branch) |
| Un-RSVP | `deleteNotificationsForRsvp(db, id, user.id)` | `api/events/[id]/rsvp/route.js` (existing-attendee branch) |
| Post deleted | `deleteNotificationsForTarget(db, 'post', id)` | `api/posts/[id]/delete/route.js` |
| Forum thread deleted | `deleteNotificationsForTarget(db, 'forum_thread', id)` | `api/forum/[id]/delete/route.js` |
| Admin soft-delete (any type) | `deleteNotificationsForTarget(db, type, id)` | `api/admin/posts/[id]/route.js` DELETE |
| Music post deleted | `deleteNotificationsForTarget(db, 'music_post', id)` | `api/music/[id]/delete/route.js` |
| Event deleted | `deleteNotificationsForTarget(db, 'event', id)` | `api/events/[id]/delete/route.js` |
| Project deleted | `deleteNotificationsForTarget(db, 'project', id)` | `api/projects/[id]/delete/route.js` |
| Timeline update deleted | `deleteNotificationsForTarget(db, 'timeline_update', id)` | `api/timeline/[id]/delete/route.js` |
| Dev log deleted | `deleteNotificationsForTarget(db, 'dev_log', id)` | `api/devlog/[id]/delete/route.js` |
| Post comment deleted | `deleteNotificationsForTargetSubId(db, commentId)` | `api/posts/[id]/comments/[commentId]/delete/route.js` |
| Event comment deleted | `deleteNotificationsForTargetSubId(db, commentId)` | `api/events/[id]/comments/[commentId]/delete/route.js` |
| Forum reply deleted | `deleteNotificationsForTargetSubId(db, replyId)` | `api/forum/[id]/replies/[replyId]/delete/route.js` |
| Music comment deleted | `deleteNotificationsForTargetSubId(db, commentId)` | `api/music/comments/[commentId]/delete/route.js` |
| Timeline comment deleted | `deleteNotificationsForTargetSubId(db, commentId)` | `api/timeline/[id]/comments/[commentId]/delete/route.js` |
| Project reply deleted | `deleteNotificationsForTargetSubId(db, replyId)` | `api/projects/[id]/replies/[replyId]/delete/route.js` |
| Dev log comment deleted | `deleteNotificationsForTargetSubId(db, commentId)` | `api/devlog/[id]/comments/[commentId]/delete/route.js` |

**Comment/reply creates using `target_sub_id`:** Event comments, post comments, forum replies (user-facing only), timeline comments, music comments, project comments, project replies, devlog comments. Forum **admin_reply** notifications still use a direct 7-column INSERT (no `target_sub_id`); when that reply is deleted, the admin notification remains but the link goes to the thread, which is still valid.

**Notification INSERTs not changed (no undo or already covered):** Likes and RSVP create then cleanup on undo. Site notifications (new thread, new content), admin notifications, signup/welcome, test/broadcast, mentions, project updates, event invites – either no undo in scope or the target is the parent content (deleted via `deleteNotificationsForTarget` when that content is deleted).

**Edge cases / notes:**
- **Mentions:** Created with `target_type`/`target_id` = parent (e.g. event, post). We do not set `target_sub_id` on mention notifications. If the specific comment containing the mention is deleted, the mention notification stays; link still goes to the parent. Optional future: pass optional `target_sub_id` into `createMentionNotifications` and set it so mention can be removed when that comment is deleted.
- **Event invite:** No “revoke invite” flow wired; if one is added later, remove notifications with `type = 'event_invite'` and `target_type = 'event'` and `target_id = eventId` and `user_id = invitedUserId` (or similar).
- **Project comments:** We set `target_sub_id` on project **comment** notifications, but there is no project comment delete route in this codebase (only project **replies** have a delete). So project comment cleanup is future-proofing only until a delete route is added.

### Files touched (summary)

| File | Change |
|------|--------|
| `src/lib/notificationCleanup.js` | New: like/RSVP/target/targetSubId delete helpers + insertNotificationWithOptionalSubId. |
| `migrations/0071_notification_target_sub_id.sql` | New: add target_sub_id column + index. |
| `src/app/api/likes/route.js` | Import cleanup; call deleteNotificationsForLike on unlike. |
| `src/app/api/events/[id]/rsvp/route.js` | Import cleanup; call deleteNotificationsForRsvp on un-RSVP. |
| `src/app/api/posts/[id]/delete/route.js` | Import cleanup; call deleteNotificationsForTarget('post', id). |
| `src/app/api/forum/[id]/delete/route.js` | Import cleanup; call deleteNotificationsForTarget('forum_thread', id). |
| `src/app/api/admin/posts/[id]/route.js` | Import cleanup; call deleteNotificationsForTarget(type, id) on DELETE. |
| `src/app/api/music/[id]/delete/route.js` | Import cleanup; call deleteNotificationsForTarget('music_post', id). |
| `src/app/api/events/[id]/delete/route.js` | Import cleanup; call deleteNotificationsForTarget('event', id). |
| `src/app/api/projects/[id]/delete/route.js` | Import cleanup; call deleteNotificationsForTarget('project', id). |
| `src/app/api/timeline/[id]/delete/route.js` | Import cleanup; call deleteNotificationsForTarget('timeline_update', id). |
| `src/app/api/devlog/[id]/delete/route.js` | Import cleanup; call deleteNotificationsForTarget('dev_log', id). |
| 7× comment/reply delete routes | Import cleanup; call deleteNotificationsForTargetSubId(commentId\|replyId). |
| 8× comment/reply create routes | Use insertNotificationWithOptionalSubId with target_sub_id (event/post/forum/timeline/music/project comments & project+forum replies, devlog comments). |

### Deploy
- Run migration **0071** with deploy so new comment/reply notifications get `target_sub_id` and comment/reply delete can remove them. Without 0071, `deleteNotificationsForTargetSubId` no-ops (column missing), and new notifications are inserted without `target_sub_id` (helper fallback).

### Notes for maintainers
- Adding a new **content type** that can be deleted: in that delete route call `deleteNotificationsForTarget(db, targetType, id)` after soft-delete (use the same `target_type` string as in notification creation).
- Adding a new **comment/reply type** that can be deleted: (1) when creating the notification use `insertNotificationWithOptionalSubId` with `target_sub_id: commentIdOrReplyId`; (2) in the delete route call `deleteNotificationsForTargetSubId(db, commentIdOrReplyId)`.
- If you add **event invite revoke**: delete notifications with `type = 'event_invite'`, `target_type = 'event'`, `target_id = eventId`, and the invited user (e.g. by `user_id` or a new column). Consider adding a small helper in `notificationCleanup.js` if reused.
- If you want **mentions** to disappear when the containing comment is deleted: pass an optional `targetSubId` (comment/reply id) into `createMentionNotifications` and have it insert with `target_sub_id`; then existing comment/reply delete routes will already remove those notifications via `deleteNotificationsForTargetSubId`.

## Edit notifications: dirty state and Save button highlight

### Issue
- In the Edit notifications sheet, making changes did not visually indicate that save was needed; the Save button did not highlight when there were unsaved changes.

### Implementation (`src/app/account/AccountSettings.js`)

1. **Stable dirty comparison**  
   Replaced `notifDirty = JSON.stringify(notifDraft) !== JSON.stringify(notifPrefs)` with a normalized snapshot so key order in nested objects (e.g. `newForumThreadSections`, `adminEvents`) does not affect the result. Added `notifPrefsSnapshot(prefs)` that builds a comparable string from `site`, `newForumThreadSections`, `delivery`, `admin`, and `adminEvents` with sorted keys so draft vs saved prefs are compared consistently.

2. **Pass `dirty` into NotificationsEditor**  
   `EditSheet` already received `dirty={notifDirty}` for close confirmation. Now `NotificationsEditor` also receives `dirty={notifDirty}` so the Save button can reflect unsaved state.

3. **Save button when dirty**  
   - `title={dirty ? 'You have unsaved changes' : undefined}` for accessibility.  
   - When `dirty`, the Save button gets a cyan outline/glow (`boxShadow`, `outline`) and the label switches to "Save preferences (unsaved changes)" so it’s clear that changes need to be saved.

### Verification
- Toggling any notification option (site, delivery, admin, forum sections, admin events) sets `notifDirty` to true and the Save button shows the highlight and updated label. After save, `notifDirty` is false and the button returns to normal.
- `notifPrefsSnapshot` includes all editable fields: `site`, `newForumThreadSections`, `delivery`, `admin`, `adminEvents`, with sorted keys so key order does not affect the comparison.
- `PrimaryButton` in this file merges `props.style` last, so the dirty-state `boxShadow` and `outline` are applied when `dirty` is true.

### Files touched
- `src/app/account/AccountSettings.js`: added `notifPrefsSnapshot()`, `notifDirty` now uses it; `NotificationsEditor` accepts `dirty` and passes it to the Save `PrimaryButton` (title, style, label); `EditSheet` for notifications passes `dirty={notifDirty}` into `NotificationsEditor`.

---

## Session notes (double-check – feed layout)

**Date:** 2026-02-16

**Scope:** Feed layout (three-row, last activity bottom right, responsive). Verification of implementation and log accuracy.

**Actions taken:**
- Removed stale CSS references from the feed section: no `flex-wrap: nowrap` on post-meta-row2; no `row2Suffix` (replaced by `customRowsAfterTitle`).
- Expanded "Double-check (verification)" in the feed layout section with detailed behavior for PostMetaBar, non-events vs events, customRowsAfterTitle, formatDateTimeShort, and overlap prevention.
- Confirmed: non-events use row2 + row3; events use customRowsAfterTitle with event-row2 and event-row3; last activity is right-aligned in row 3.

**Recommended manual checks (when convenient):**
- Feed at narrow width: event-row2 should stack vertically; no overlap between by-user and event info.
- Completed events: "N attended" shows names on hover; no "Starts yesterday" wording.
- Last activity appears bottom-right when replies > 0.

---

## Feed layout: event "by" alignment, attended spacing, row consolidation (2026-02-16)

### Issues addressed
1. **Event "by" text**: Was centered with event info; should stay left-aligned like non-events.
2. **Attended spacing**: No space between "(Event happened)" and "2 attended" around the middot.
3. **Row consolidation**: On larger viewports, "by user" and "last activity" should share a row when there's room.

### Changes

**`src/app/feed/page.js`**
- Removed `event-row2-centered` so by-user stays left; event info centered in remaining space via `event-row2-middle` flex.
- Wrapped middot separators in `<span className="event-details-sep">` for consistent spacing (prevents collapse).
- Events: merged row 3 into row 2; last activity now in same row as by-user + event info when present, with `margin-left: auto` for right alignment.

**`src/components/PostMetaBar.js`**
- Non-events: merged row 2 and row 3; by-user (left) and last activity (right) share one row with `post-meta-row2-with-activity` and `post-meta-last-activity-inline`.

**`src/app/globals.css`**
- `.event-row2`: `justify-content: flex-start`; `.event-row2-middle`: `flex: 1 1 auto` to center event info in remaining space.
- `.event-details-sep`: `margin: 0 2px; white-space: pre` for middot spacing.
- `.post-meta-row2-with-activity`, `.post-meta-last-activity-inline`: consolidate by + last activity on one row.
- `.event-row2-with-activity .post-meta-last-activity-inline`: last activity right in event row 2.
- At 640px: event-row2 `align-items: flex-start`; last activity `align-self: flex-end` when stacked.

### Double-check (verification)

- **Event "by" alignment**: `event-row2-centered` removed; `event-row2` uses `justify-content: flex-start`. `byUser` is first child, left-aligned. `event-row2-middle` has `flex: 1 1 auto` and `justify-content: center` – event info (icon, date, attended) centered in remaining space.
- **Attended spacing**: `event-details-sep` wraps `{' \u00B7 '}` with `margin: 0 2px` and `white-space: pre`; applied to both hasPassed and upcoming branches. Prevents collapse; visible gap before "N attended"/"N attending".
- **Non-events row consolidation**: PostMetaBar row 2 has `post-meta-row2-with-activity` when `hasLastActivity`. Single div contains `byUserAtTime` and `post-meta-last-activity-inline`; `justify-content: space-between` + `margin-left: auto` on last activity pushes it right. When viewport narrows and row wraps, last activity goes below (flex-wrap).
- **Events row consolidation**: Events use `customRowsAfterTitle`; single `event-row2` div with `byUser`, `event-row2-middle` (eventInfo), and `eventLastActivityEl`. `event-row2-with-activity` when `hasEventLastActivity`. Last activity has `margin-left: auto` for right alignment. No separate row 3 for events.
- **Narrow viewport (640px)**: event-row2 becomes `flex-direction: column`, `align-items: flex-start`; by-user left-aligned; event info centered via event-row2-middle `justify-content: center`. Last activity `align-self: flex-end` when stacked.
- **Dead CSS**: `.post-meta-row3` and `.event-row3` rules remain (used in overflow-wrap selector); separate row3 divs no longer rendered. `.event-row2-centered` removed.

### Feed: stats always right, “by” above stats (2026-02-16)

**Request:** On small viewports, view count (and stats) should stay on the right; stats were ending up above the “by”/event line and looked messy.

**Changes:**

- **`src/components/PostMetaBar.js`**
  - Row 1: title only (stats removed from title row).
  - Row 2: left block (by user + last activity, or `customRowsAfterTitle` for events) + stats block (right). Stats rendered in `.post-meta-stats-right` with `flex: 1 1 auto`, `justify-content: flex-end` so they stay right on one line and stay right when they wrap to their own line.
  - Docstring updated: “Row 1 = title only. Row 2 = by/custom (left) + stats (right always).”

- **`src/app/globals.css`**
  - Removed 480px media block that stacked `.post-meta-title-row` (title + stats) into a column (stats were left-aligned below title).
  - Added `.post-meta-row2-with-stats` (flex, wrap, gap) and `.post-meta-stats-right` (flex-shrink: 0) so row 2 lays out left content + stats and stats stay right when wrapped.

**Result:** Title on line 1; line 2 = “by user” / event info (left) and “X views · Y replies” (right). On wrap, stats move to their own line but remain right-aligned. “By”/event info is no longer below the view count.

### Feed: stats top right, last activity bottom right (2026-02-16)

**Request:** Stats (view/reply/like count) must always be **top right**; last activity must always be **bottom right** (was ending up left or mid when stacked on small viewports).

**Changes:**

- **`src/components/PostMetaBar.js`**
  - Row 1: title (left) + stats in `.post-meta-stats-top-right` (top right). Stats wrapper uses `flex: 1 1 auto`, `justify-content: flex-end` so they stay right when row 1 wraps.
  - Row 2: by user or `customRowsAfterTitle` only (no last activity in row 2).
  - Row 3: last activity only, in `.post-meta-row3.post-meta-last-activity-row` (existing `.post-meta-row3` has `justify-content: flex-end` → bottom right).
  - Docstring: "Row 1 = title + stats (top right). Row 2 = by/custom. Row 3 = last activity (bottom right)."

- **`src/app/feed/page.js`**
  - Events: pass `lastActivity` and `lastActivityBy` (no longer `undefined`) so PostMetaBar renders row 3 for events with replies.
  - Event `customRowsAfterTitle`: only byUser + eventInfo (removed `eventLastActivityEl` from event row). Last activity now only in row 3.

- **`src/app/globals.css`**
  - Removed `.post-meta-row2-with-stats` / `.post-meta-stats-right` (stats no longer in row 2). Comment for `.post-meta-stats-top-right` (row 1 stats wrapper).

**Result:** On all viewports: line 1 = title + stats (top right); line 2 = by/event info; line 3 = last activity (bottom right) when present.

### Double-check: feed small-viewport CSS (2026-02-16)

**Verified:**

1. **Event info centering (≤640px)**  
   - `src/app/globals.css` @media (max-width: 640px): `.event-row2` → column, `align-items: flex-start`; `.event-row2-middle` → `width: 100%`, `justify-content: center`.  
   - Feed event row structure (`src/app/feed/page.js`): single `event-row2` with `byUser` and `event-row2-middle` (eventInfo) only; no last-activity in event row (last activity is in PostMetaBar row 3). Event info (date, "Event happened", "N attended") centers on narrow viewports.

2. **Stats top right, last activity bottom right (all viewports)**  
   - PostMetaBar: row 1 = title + `.post-meta-stats-top-right` (stats; wrapper keeps them right when row wraps). Row 2 = by/custom only. Row 3 = last activity in `.post-meta-row3` (justify-content: flex-end → bottom right). Events get last activity in row 3 via feed passing lastActivity/lastActivityBy; event custom row is by + event info only.

**Manual checks:** Feed at ~358px: row 1 = title + stats (top right); row 2 = by/event info; row 3 = last activity (bottom right). Event info centered in event row.

### Double-check: full feed layout verification (2026-02-16)

**PostMetaBar.js**
- Row 1 (lines 81–104): `.post-meta-title-row` with title (flex 1 1 auto) and optional `.post-meta-stats-top-right` wrapper (flex 1 1 auto, justify-content: flex-end inline). Stats stay top right; when row wraps, wrapper takes full width and keeps stats right.
- Row 2 (lines 106–109): `.post-meta-row2.post-meta-by-row` renders `row2Content` only (customRowsAfterTitle ?? byUserAtTime). No last activity here.
- Row 3 (lines 111–116): When `lastActivityEl` (hasLastActivity = lastActivity && replies > 0), rendered in `.post-meta-row3.post-meta-last-activity-row`. CSS gives row 3 `justify-content: flex-end` → bottom right.

**feed/page.js**
- Lines 579–582: `lastActivity` and `lastActivityBy` passed for all items (including events); no longer undefined for events.
- Lines 652–657: Event `customRowsAfterTitle` returns single `event-row2` with `byUser` and `event-row2-middle` (eventInfo) only. No `eventLastActivityEl` in event row; last activity comes from PostMetaBar row 3 when item has replies.

**globals.css**
- `.post-meta-row3` (ca. 4724–4728): `display: flex; justify-content: flex-end` → last activity row is bottom right.
- `.post-meta-title-row`: no 480px stack; row 1 is flex wrap, stats in wrapper.
- `.event-row2`, `.event-row2-middle` (ca. 4732–4748): event row layout; at 640px (ca. 4827–4841) event-row2 column, event-row2-middle full width, justify-content center for event info.
- `.event-row2-with-activity` (ca. 4822–4824, 4834–4836): still defined but feed event row no longer uses this class; harmless if left for other consumers.

**Summary:** Stats always top right (row 1). Last activity always bottom right (row 3). Event row is by + event info only; events with replies show last activity in row 3.

### Session notes (double-check)

- **2026-02-16**: Verified all feed layout changes (event "by" alignment, attended spacing, row consolidation). Updated log section "Feed layout (consolidated)" to remove stale row 3 references. Updated PostMetaBar docstring. Double-check section above documents current behavior.
- **2026-02-16**: Double-checked feed small-viewport fixes (event info center at 640px, stats stack at 480px); added "Double-check: feed small-viewport CSS" subsection with file/line references and manual check notes.
- **2026-02-16**: Feed layout tweak: stats moved from title row to row 2 (with “by”/event), always right-aligned; reverted 480px title+stats stack. Logged in “Feed: stats always right, by above stats”.
- **2026-02-16**: Feed layout: stats back to row 1 (top right), last activity to row 3 (bottom right). PostMetaBar row 2 = by/custom only. Events pass lastActivity so row 3 shows; event custom row is by + event info only. Logged in “Feed: stats top right, last activity bottom right”.
- **2026-02-16**: Double-checked full feed layout: verified PostMetaBar.js (row 1/2/3), feed/page.js (lastActivity for events, event row without last activity), globals.css (row3 flex-end, event-row2 640px, no 480px title stack). Fixed stale “optional last-activity span” in event row description. Added “Double-check: full feed layout verification” with file/line refs.

## Event post detail: tighter layout, hide Invite when past, reply connector (2026-02-16)

### Request
- Put "Event happened" and event date/time on same row with similar styling.
- Put "Attending" heading and attendee list on same row (list on right).
- Hide "Invite People" when event has passed (RSVP closed).
- Add a visual connector line for nested replies.

### Changes

**`src/app/events/[id]/page.js`**
- Removed separate "Event happened" block. Event date row now: when `eventHasPassed`, shows calendar icon + "Event happened" (and optional "Attendance reopened") + " · " + formatted date/time in same row and style. When upcoming, unchanged (date/time + relative).

**`src/components/EventEngagementSection.js`**
- Attending: single flex row with `justify-content: space-between`; "Attending" (left), attendee list on right (same line when space allows, wraps with gap). No attendees: "No one has marked attending yet." below.
- Invite People block only rendered when `canInvite && !eventHasPassed` (hidden after event).

**`src/app/globals.css`**
- `.reply-children`: border-left 2px with `var(--border)`; `position: relative`.
- `.reply-children::before`: horizontal connector line (14px left, 2px tall at top) so nested replies have a visible branch from parent.

## Private messaging (DMs) – full implementation (2026-02-16)

### Request
- Wire out the Messages page (currently a placeholder). Enable private messaging between users with:
  - Individual DMs and group conversations
  - Admin: send to role (all users, Driplets, Drip Nomads, Mods, Admins)
  - In-app notifications when someone sends a DM; NotificationsMenu links to the conversation

### Implementation

1. **Migration `migrations/0075_dm_tables.sql`**
   - `dm_conversations`: id, type ('direct'|'group'), subject (nullable), created_at, updated_at
   - `dm_participants`: conversation_id, user_id, joined_at, left_at; composite PK
   - `dm_messages`: id, conversation_id, author_user_id, body, created_at, is_deleted
   - Indexes on dm_participants(user_id), dm_messages(conversation_id, created_at)

2. **API routes**
   - **GET /api/messages/conversations**: List conversations for current user (last message preview, participants, display name)
   - **GET /api/messages/conversations/[id]**: Get conversation + messages (paginated via ?before=&limit=)
   - **POST /api/messages/conversations/[id]**: Send message; create notification for other participants
   - **POST /api/messages/conversations/create**: Create conversation. Body: participantIds, subject?, body?, broadcastRole? (admin only)
   - **GET /api/messages/users?q=**: Search users for compose (excludes self, min 2 chars)

3. **Messages page and client**
   - **`src/app/messages/page.js`**: Renders MessagesClient with user and isAdmin; Suspense fallback
   - **`src/components/MessagesClient.js`**: Two-pane layout (sidebar inbox + main conversation). Sidebar: conversation list with last preview and time; main: selected conversation with messages + reply form. Compose modal: user search, add multiple for group, optional subject, message body; admins get "Send to role" dropdown (all, user, drip_nomad, mod, admin). Deep-link via ?conversation=id from notifications.

4. **Notifications**
   - **NotificationsMenu.js**: Added branch for `type === 'private_message'` and `target_type === 'dm_conversation'`: href `/messages?conversation=${target_id}`, label "${actor} sent you a message"
   - **Create/send flows**: Use `insertNotificationWithOptionalSubId` with type `private_message`, target_type `dm_conversation`, target_id conversation id, target_sub_id message id

5. **Create flow logic**
   - Direct (1 recipient, no subject): Reuse existing 1:1 conversation if present
   - Group (2+ recipients or subject): New conversation
   - Admin broadcast: Resolve role to user IDs, create group conversation with all matching users

### Deploy
- Run migration **0075** before or with deploy.

### Files touched
- `migrations/0075_dm_tables.sql` (new)
- `src/app/api/messages/conversations/route.js` (new)
- `src/app/api/messages/conversations/[id]/route.js` (new)
- `src/app/api/messages/conversations/create/route.js` (new)
- `src/app/api/messages/users/route.js` (new)
- `src/app/messages/page.js` (updated)
- `src/components/MessagesClient.js` (new)
- `src/components/NotificationsMenu.js` (private_message branch)

### Role-based messaging restrictions (2026-02-16)

- **Driplets (user)**: Can only message other Driplets.
- **Drip Nomads**: Can message Driplets and other Nomads.
- **Mods**: Can message Driplets, Nomads, and Mods.
- **Admins**: Can message everyone.

**Implementation:**
- **`src/lib/roles.js`**: Added `canMessageByRole(senderRole, recipientRole)` and `MESSAGEABLE_ROLES` map.
- **`api/messages/conversations/create`**: Validates each recipient's role before creating; returns 403 if any recipient is not messageable. Also validates when reusing existing direct conversation. Rejects if any recipient ID is invalid/deleted (400).
- **`api/messages/users`**: Search results filtered to only include users the sender can message (`role IN (allowed roles)`).

### Double-check / verification (private messaging)

**Migration 0075**
- Tables: dm_conversations, dm_participants, dm_messages. PKs and FKs correct. Indexes for participants by user, messages by conversation+created_at. CASCADE on conversation delete.

**API routes – auth and validation**
- All routes require `getSessionUser()`; 401 if not logged in.
- **conversations GET**: Returns only conversations where user is participant (left_at IS NULL). Enriched with display_name, participants, last_message_preview.
- **conversations/[id] GET**: Participant check; 404 if not in conversation. Messages paginated via ?before=&limit= (default 50, max 100).
- **conversations/[id] POST**: Participant check; body required. Creates notification for each other participant with target_sub_id=messageId.
- **conversations/create POST**: Admin broadcast only when isAdminUser; broadcastRole resolves to user IDs. Role check on all recipients. Rejects invalid/deleted recipient IDs (validRecipientIds.size < uniqueRecipients.length → 400). Existing direct-conv reuse also runs role check.
- **users GET**: role IN (allowed for sender); excludes self; min 2 chars for q.

**Role matrix (canMessageByRole)**
| Sender   | Can message                 |
|----------|-----------------------------|
| user     | user                        |
| drip_nomad | user, drip_nomad         |
| mod      | user, drip_nomad, mod       |
| admin    | user, drip_nomad, mod, admin |

**Notifications**
- NotificationsMenu: private_message + dm_conversation → href /messages?conversation=id, label "{actor} sent you a message".
- create/send flows use insertNotificationWithOptionalSubId with target_sub_id for precise cleanup if message deletion is added later.

**Edge cases**
- Non-admin sending broadcastRole: block skipped; participantIds stays empty → 400 "At least one recipient required".
- Invalid/deleted recipient ID: 400 "One or more recipients could not be found."
- Role change after conversation created: validated on create and on reuse of existing direct; no re-check when sending in existing conv (user already participant).
- User with unknown role: canMessageByRole uses MESSAGEABLE_ROLES[senderRole]; unknown sender → false. recipientRole null/undefined → treated as ROLE_DRIPLET.

**Follow-up / not implemented**
- ~~No "delete conversation" or "leave conversation" API~~ (implemented below)
- ~~No notify_private_message pref for email/SMS~~ (implemented below)

### Private messaging – completion (leave, delete, outbound, pref) (2026-02-16)

1. **Leave conversation**
   - **POST /api/messages/conversations/[id]/leave**: Sets left_at for current user. User is removed from conversation list.
   - **MessagesClient**: "Leave" button in conversation header; on success, clears selection and refetches.

2. **Admin delete conversation**
   - **DELETE /api/messages/conversations/[id]**: Admin only. Hard-deletes conversation, participants, messages; calls deleteNotificationsForTarget(db, 'dm_conversation', id).
   - **MessagesClient**: "Delete" button (admin only) with confirm; red styling.

3. **notify_private_message pref**
   - **Migration 0076**: notify_private_message_enabled INTEGER NOT NULL DEFAULT 0.
   - **auth.js**: Main and admin SELECTs include column; fallbacks set to 0.
   - **notification-prefs**: Accepts privateMessageEnabled; saves to notify_private_message_enabled.
   - **auth/me**: Returns notifyPrivateMessageEnabled.
   - **AccountSettings**: "Private messages" toggle in Site notifications; helper text: "Get notified via email/SMS when someone sends you a DM."
   - **admin user delete**: Sets notify_private_message_enabled = 0 when anonymizing.

4. **Outbound email/SMS for DMs**
   - **outboundNotifications.js**: Added typeEnabled parameter; when false, skips send. Added targetType dm_conversation path `/messages?conversation=id`. Added type private_message label "sent you a message".
   - **conversations/[id] POST**: Fetches recipient email, phone, notify_*; calls sendOutboundNotification with typeEnabled: !!notify_private_message_enabled.
   - **conversations/create**: Same for existing-conv first message and new-conv first message.

### Files touched (completion)
- `migrations/0076_add_notify_private_message.sql` (new)
- `src/app/api/messages/conversations/[id]/leave/route.js` (new)
- `src/app/api/messages/conversations/[id]/route.js` (DELETE handler, outbound wiring)
- `src/app/api/messages/conversations/create/route.js` (outbound wiring)
- `src/lib/outboundNotifications.js` (typeEnabled, dm_conversation, private_message)
- `src/lib/auth.js` (notify_private_message_enabled)
- `src/app/api/auth/notification-prefs/route.js` (privateMessageEnabled)
- `src/app/api/auth/me/route.js` (notifyPrivateMessageEnabled)
- `src/app/account/AccountSettings.js` (Private messages toggle)
- `src/app/api/admin/users/[id]/delete/route.js` (notify_private_message_enabled = 0)
- `src/components/MessagesClient.js` (Leave, Admin Delete buttons)

### Conversation updates notifications (2026-02-16)

**Request**: Ensure notifications for all DM features and settings in Account Settings.

**What was added**:

1. **Leave conversation in-app notifications**
   - **leave/route.js**: When a user leaves, fetches other participants; inserts `conversation_participant_left` notification for each with `notify_conversation_updates_enabled`. Fallback if column missing: notify all.

2. **Admin delete in-app notifications**
   - **conversations/[id] DELETE**: Before deleting, fetches participants; inserts `conversation_deleted` notification (target_type `dm_conversation_deleted`, href `/messages`) for each with pref on. Fallback if column missing: notify all.

3. **notify_conversation_updates pref**
   - **Migration 0077**: notify_conversation_updates_enabled INTEGER NOT NULL DEFAULT 1.
   - **auth.js**: Main and admin SELECTs include column; fallbacks set 1.
   - **notification-prefs**: Accepts conversationUpdatesEnabled; saves to notify_conversation_updates_enabled.
   - **auth/me**: Returns notifyConversationUpdatesEnabled.
   - **AccountSettings**: "Conversation updates" toggle; helper: "When someone leaves a conversation or a conversation is deleted."
   - **admin user delete**: Sets notify_conversation_updates_enabled = 0 when anonymizing.

4. **NotificationsMenu**
   - `conversation_participant_left` + `dm_conversation`: label "{actor} left the conversation"; href `/messages?conversation=id`.
   - `conversation_deleted` + `dm_conversation_deleted`: label "A conversation you were in was deleted by {actor}"; href `/messages`.

**Files touched**
- `migrations/0077_add_notify_conversation_updates.sql` (new)
- `src/app/api/messages/conversations/[id]/leave/route.js` (notifications)
- `src/app/api/messages/conversations/[id]/route.js` (delete notifications)
- `src/lib/auth.js` (notify_conversation_updates_enabled)
- `src/app/api/auth/notification-prefs/route.js` (conversationUpdatesEnabled)
- `src/app/api/auth/me/route.js` (notifyConversationUpdatesEnabled)
- `src/app/account/AccountSettings.js` (Conversation updates toggle)
- `src/app/api/admin/users/[id]/delete/route.js` (notify_conversation_updates_enabled = 0)
- `src/components/NotificationsMenu.js` (conversation_participant_left, conversation_deleted handlers)

### Double-check verification (2026-02-16)

**Leave route (`leave/route.js`)**
- Fetches other participants (excluding current user, left_at IS NULL) with `notify_conversation_updates_enabled`.
- Fallback: if column missing, SELECT only `user_id` and treat all as enabled (notify_conversation_updates_enabled: 1).
- Updates `dm_participants SET left_at` for current user.
- Inserts `conversation_participant_left` for each recipient with pref on (type, target_type `dm_conversation`, target_id conv id).
- Uses `insertNotificationWithOptionalSubId`, `randomUUID`.

**Delete route (`conversations/[id]/route.js`)**
- Fetches all participants with `notify_conversation_updates_enabled`.
- Fallback: if column missing, SELECT only `user_id` and treat all as enabled.
- Inserts `conversation_deleted` for each with pref on (target_type `dm_conversation_deleted`, target_id conv id; link goes to /messages since conv is deleted).
- Then deletes messages, participants, conversation; calls `deleteNotificationsForTarget(db, 'dm_conversation', id)` (cleans up private_message notifications; conversation_deleted uses different target_type so not affected).

**Migration 0077**
- Adds `notify_conversation_updates_enabled INTEGER NOT NULL DEFAULT 1`.
- Must run before deploy; leave/delete routes fall back if column missing.

**Auth (`auth.js`)**
- Main and admin SELECTs include `notify_conversation_updates_enabled`.
- Fallbacks (minimal-column paths) set to 1.

**notification-prefs API**
- Accepts `conversationUpdatesEnabled`; default 1 when omitted.
- Params and SET clause order: ... privateMessageEnabled, conversationUpdatesEnabled, newForumThreadsEnabled ...
- Returns `notifyConversationUpdatesEnabled`.

**auth/me**
- Returns `notifyConversationUpdatesEnabled: (user.notify_conversation_updates_enabled ?? 1) !== 0`.

**AccountSettings**
- `notifPrefs.site.conversationUpdates` from user; default true when undefined.
- Toggle between Private messages and New forum threads; helper: "When someone leaves a conversation or a conversation is deleted."
- Save payload includes `conversationUpdatesEnabled: notifDraft.site.conversationUpdates`.

**NotificationsMenu**
- `conversation_participant_left` + `dm_conversation`: href `/messages?conversation=${n.target_id}`, label "{actor} left the conversation".
- `conversation_deleted` + `dm_conversation_deleted`: href `/messages`, label "A conversation you were in was deleted by {actor}".

**Admin user delete**
- Anonymization UPDATE sets `notify_conversation_updates_enabled = 0`.

**Data flow**
- User toggles off in Account Settings -> handleSaveNotifs sends conversationUpdatesEnabled -> notification-prefs POST -> DB.
- Leave/delete routes read notify_conversation_updates_enabled from users; only insert notification when truthy.

## Recent activity display and logging consistency (2026-02-16)

**Request:** Profile "Recent activity" should show the same level of detail whether the user replied to the post itself or replied to a reply; and all such activity should be logged in a single, consistent way in system logs.

**Done:**
- Added spec: `docs/03-Features/RECENT_ACTIVITY_DISPLAY_AND_LOGGING.md`.
- Spec defines: (1) Profile activity fields for every entry (action type, target content, context/section, timestamp); same detail for "Replied to post" vs "Replied to reply". (2) Unified system-log schema (actor, actionType, targetType, targetId, targetTitle, sectionKey, parentId when reply-to-reply, createdAt, source) so admin logs and exports stay consistent.
- Verification checklist included for profile feed and system log filtering/export.

**Implementation (same session):**
- **Profile/Account Activity UI:** Reply rows now show "in [section]" so they have the same four pieces as "Posted" (action, target, context, timestamp). `ProfileTabsClient.js` and `AccountTabsClient.js`: for reply items render "in" + `item.section` when present before "at" + time.
- **User activity log:** Migration `0078_user_activity_log.sql` adds table `user_activity_log` (id, created_at, user_id, username, action_type, target_type, target_id, target_title, section_key, parent_id, source) with indexes on created_at, user_id, action_type. `src/lib/audit.js`: added `logUserActivity({ userId, username, actionType, targetType, targetId, targetTitle, sectionKey, parentId, source })`.
- **Call sites:** `logUserActivity` invoked from: (1) `api/forum/[id]/replies/route.js` after reply insert — actionType `reply_to_reply` or `reply_to_post`, parentId when replying to a reply, sectionKey from thread is_shitpost (lobby_shitposts vs lobby_general); (2) `api/threads/route.js` after thread create — actionType `post_created`, sectionKey `lobby_general`; (3) `api/shitposts/route.js` after thread create — actionType `post_created`, sectionKey `lobby_shitposts`; (4) `api/posts/route.js` after post create — actionType `post_created`, sectionKey = post type. All wrapped in try/catch so request does not fail if logging fails.
- **Follow-up:** Admin console could fetch `user_activity_log` and merge into system log view / export (filter by user, actionType). Devlog, music, projects, events, timeline comment/reply routes can be wired to `logUserActivity` in a later pass for full coverage.

**Double-check / Verification (complete):**
- **ProfileTabsClient.js:** Reply branch renders "Replied to" + title + optional "in" + section + "at" + timeStr; `item.section` used only when truthy; same structure as AccountTabsClient.
- **AccountTabsClient.js:** Same reply row structure; activityItems built from stats.recentActivity with getSectionLabel(postType, replyType), so section is always set for known reply types.
- **Profile page:** activityItems map includes `section: getSectionLabel(postType, replyType)`; stats.recentActivity reply rows have replyType (and post_type for post_comment), so section is never missing for replies.
- **stats.js:** recentForumReplies (and other reply queries) return thread_id, thread_title, reply_type; allReplies map adds type: 'reply', replyType; no code change needed for section — it is derived at display time.
- **audit.js:** logUserActivity guards on userId, actionType, targetType, source; INSERT has 11 columns; bind order matches (id, created_at, user_id, username, action_type, target_type, target_id, target_title, section_key, parent_id, source).
- **0078_user_activity_log.sql:** Table columns match audit INSERT; indexes on created_at DESC, user_id, action_type; IF NOT EXISTS used.
- **Forum replies route:** thread still fetched as author_user_id, title; sectionKey from separate is_shitpost query (try/catch for pre-0061 DBs); logUserActivity called with effectiveReplyTo ? 'reply_to_reply' : 'reply_to_post', parentId when reply-to-reply; errors caught so request does not fail.
- **Threads route:** logUserActivity after notifyUsersOfNewForumThread; post_created, sectionKey 'lobby_general'.
- **Shitposts route:** logUserActivity after notify; post_created, sectionKey 'lobby_shitposts', targetType forum_thread.
- **Posts route:** logUserActivity inside existing try after notifyUsersOfNewContent; post_created, sectionKey: type, targetType: 'post'; logErr caught so outer catch still handles DB failures.

## Home Explore Sections: full viewport latest-drip list, variable height, less gap (2026-02-16)

**Request:** On full viewport, show up to three items under "Latest drip:" (like small viewport), variable card height by content, and reduce padding between section cards; apply on all viewports that can handle it.

**Changes:**
- **HomeSectionCard.js:** Non-compact (desktop) branch when `recentActivity` exists now renders the same structure as expanded compact: "Latest drip:" label, then `<ul class="home-section-card__recent-list">` with up to 3 items (recentItems already capped at 3), plus "Open section" link. Card uses `home-section-card home-section-card--full` for styling.
- **globals.css:** `.home-sections-list` gets `align-items: start` (cards no longer stretch; sections with more drip items are taller) and `gap: 6px` (tighter than default `.list` 12px). Mobile media query still overrides gap to 2px. `.home-section-card--full` gets `padding: 8px 10px 10px` for the extra details block.

**Double-check (same session):**
- **recentItems:** Built at top of component as `[recentActivity, ...listItems].slice(0, 3)` when recentActivity exists; full card renders `recentItems.map` (no extra slice). Max 3 items confirmed.
- **Variable height:** `.home-sections-list { align-items: start }` in globals.css (lines 6424-6427); grid items no longer stretch.
- **Gap:** Base `.home-sections-list { gap: 6px }`; mobile `@media (max-width: 640px)` overrides to `gap: 2px` (lines 8281-8283).
- **Empty state:** Full card only renders when `recentActivity` is truthy, so recentItems.length >= 1; the is-empty branch in details-head is defensive only.

**Follow-up: description in same row as title (preserve height):**
- **Request:** Put section descriptions in the same row as titles on full viewport (like small viewports) to save vertical space.
- **HomeSectionCard.js:** Full viewport card top row changed from separate title row + `list-meta` description to single row using compact layout: `home-section-card__top` > `title-wrap` > `headline` (title + " - " + `headline-description`) and `count-wrap`. Reuses same classes as compact so description gets ellipsis (single line) and matches small viewport.
- **globals.css:** `.home-section-card--full .home-section-card__top { justify-content: space-between; width: 100%; }` so the top row lays out without the compact toggle button.

## Home Explore Sections: Open section desktop removal (2026-02-16)

**Request:** On larger viewports, remove the "Open section" button; keep only card click and drip-line links. "Open section" should remain only for small (compact) viewports.

**Changes:**
- **HomeSectionCard.js:** Removed the "Open section" `<Link>` from the full (desktop) variant. Full card still uses `onClick={() => router.push(href)}` and `onKeyDown` (Enter/Space) on the wrapper div; drip lines remain `<Link href={item.href}>` with `stopPropagation`. Compact variant unchanged: expanded state still shows "Open section" (line 109-111).

## Home Explore Sections: drip dedupe by post + condense layout (2026-02-16)

**Request:** (1) If latest drip entries are about the same post (e.g. comment + original post), show only one entry per post. (2) Reduce wasted white space: put cards closer together and condense the block.

**Changes:**
- **HomeSectionCard.js:** Build `recentItems` by combining `recentActivity` and `listItems`, sorting by `createdAt` desc, then keeping first occurrence per `href` (one entry per post), then `slice(0, 3)`. Stops duplicate "Lore & Memories" / "General" / "Projects" lines for the same thread.
- **globals.css:** Tighter spacing: `.home-sections-list` gap 6px -> 4px; `.home-section-card--full` padding 8px 10px 10px -> 6px 8px 8px; `.home-section-card__details` margin-top/padding-top 8px -> 4px; `.home-section-card__details-head` gap 8px -> 6px; `.home-section-card__recent-list` margin 8px 0 0 -> 4px 0 0, gap 6px -> 4px.
- **page.js:** "Explore Sections" title marginBottom 16px -> 10px.

### Double-check / verification (2026-02-16)

**Scope:** All Home Explore Sections changes from this session (Open section removal, drip dedupe, condense layout).

1. **Open section removal (desktop):**
   - **HomeSectionCard.js** full variant (lines 153-202): No "Open section" link; only `details-head` (Latest drip: or empty CTA) and `recent-list`. Card wrapper has `role="link"`, `tabIndex={0}`, `onClick`/`onKeyDown` -> `router.push(href)`. Drip items are `<Link href={item.href}>` with `onClick`/`onKeyDown` `stopPropagation`.
   - Compact variant (lines 66-129): "Open section" link still present in expanded details (lines 109-111). Confirmed.

2. **Drip dedupe by post:**
   - **HomeSectionCard.js** (lines 22-30): `combined = recentActivity ? [recentActivity, ...listItems] : listItems`; `sorted = [...combined].sort((a,b) => (b.createdAt||0) - (a.createdAt||0))`; filter with `seenHref` Set so first occurrence per `item.href` is kept; `.slice(0, 3)`. Result: at most one row per post (by href), up to 3 posts, most recent activity per post shown.
   - Edge cases: `recentActivity` null -> combined = listItems only; empty list -> recentItems = []. Full card only renders when `recentActivity` truthy (line 132), so empty recentItems from dedupe would only occur if all activities had same href (still one item). `latestActivityTs` uses `recentItems[0]?.createdAt || recentActivity?.createdAt` for 24h badge; safe when recentItems empty in compact branch.

3. **Condense layout (CSS + page):**
   - **globals.css:** `.home-section-card__details` (6399-6402) margin-top 4px, padding-top 4px. `.home-section-card__details-head` (6412-6418) gap 6px. `.home-section-card__recent-list` (6483-6489) margin 4px 0 0, gap 4px. `.home-sections-list` (6512-6515) gap 4px. `.home-section-card--full` (6517-6519) padding 6px 8px 8px. Mobile override (8374-8376): `.home-sections-list { gap: 2px }` unchanged.
   - **page.js** (1658): `section-title` for "Explore Sections" has `style={{ marginBottom: '10px' }}`.

4. **Compact branch:** `recentItems.slice(0, 3)` at line 116 is redundant (recentItems already max 3) but harmless. Key for list items uses `${item.href}-${idx}` to avoid React key collisions when same post appears (post-dedupe this is moot; kept for consistency).

## Home Explore Sections: space between post count and 24h badge (mobile) (2026-02-16)

**Request:** On mobile/small viewports, add a little space between the post count (e.g. "11 posts") and the "24h" text so they don't run together (e.g. "11 posts24H+").

**Changes:**
- **globals.css:** `.section-card-recent-badge` (lines 6270-6279): added `margin-left: 6px` so the 24h badge is visually separated from the preceding count text. Badge appears only in compact (mobile) section cards when `hasRecentInLast24h` is true; no JS changes.

### Double-check / verification (2026-02-16)

- **globals.css** (6270-6279): `.section-card-recent-badge` has `margin-left: 6px` between `gap: 3px` and `color: #57ffbe`. Badge is rendered inside `.section-card-count` in **HomeSectionCard.js** compact branch (lines 85-94); countLabel (e.g. "11 posts") and the badge are siblings within that span, so the left margin on the badge creates space between "posts" and "24h". Confirmed no other uses of `.section-card-recent-badge` that would be adversely affected (full card does not show the 24h badge).
