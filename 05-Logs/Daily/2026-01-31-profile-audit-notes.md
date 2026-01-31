# Profile Additions – Audit Notes (2026-01-31)

Double-check of profile implementation: flow, preserved features, desktop vs mobile layout.

---

## 1. Old features preserved

| Feature | Location | Status |
|--------|----------|--------|
| Breadcrumbs | Profile page top | Preserved – Home > username |
| Own-profile redirect | Profile page | Preserved – redirect to `/account?tab=profile` when viewing self |
| Profile views increment | Profile page | Preserved – only when viewed by someone else |
| User fetch with fallback | Profile page | Preserved – try full SELECT (mood/song/headline), fallback to legacy columns if missing |
| Username + color | Profile page | Preserved – Username component, roleLabel, userColor |
| Avatar | Profile page | Preserved – ProfileAvatarHero (avatar_key, userColor) |
| Role label | Profile page | Preserved – Drip Warden / Drip Guardian / Drip |
| Mood display | Profile page | Preserved – now in header; gated by `profile_mood` flag |
| Headline display | Profile page | Preserved – in header when set |
| Song display | Profile page | Preserved – compact block in header; gated by `profile_music` flag |
| Social links | Profile page | Preserved – inline in header with platform icons (getPlatformIcon, extractUsername) |
| Bio | Profile page | Preserved – under header, same as before |
| Stats | Profile page | Preserved – moved into Activity tab (threadCount, replyCount, join date, profileViews, timeSpentMinutes, avatarEditMinutes) |
| Recent activity | Profile page | Preserved – Activity tab, same hrefs and section labels (getSectionLabel) |
| Lately (profile_links) | Profile page | Preserved – Lately tab still uses profileLinks-derived latelyLinks |
| Gallery / Notes / Files tabs | ProfileTabsClient | Preserved – placeholders (counts 0, filesEnabled false) |
| Account: username edit | AccountTabsClient | Preserved – same edit/save flow |
| Account: color picker | AccountTabsClient | Preserved – same options and save |
| Account: social links | AccountTabsClient | Preserved – same platforms and save |
| Account: avatar edit | AccountTabsClient | Preserved – Edit Avatar, AvatarCustomizer |
| Account: stats refresh | AccountTabsClient | Preserved – on mount, focus, 60s poll; now also returns profile extras |
| Date display (mobile vs desktop) | Profile + Stats | Preserved – date-only-mobile / date-with-time-desktop classes (breakpoint 641px) |

**Removed / changed**

- Two-column layout (Profile left, Stats right) – replaced by single card with header + tabs. Stats content is unchanged; only placement moved to Activity tab.
- Unused import: `ClaimUsernameForm` removed from profile page (was never rendered there).

---

## 2. New features implemented

- Feature flags (`src/lib/featureFlags.js`) – mood/music/backgrounds/lately/gallery/notes/files; mood & music gated on profile page.
- Single card layout – one section.card with header block then bio then ProfileTabsClient.
- Header block – avatar, username, role, mood or song (compact), optional headline, optional socials inline.
- Stats block inside Activity tab – join date (short on mobile, long on desktop), threads, replies, visits, min, avatar min; rarity colors kept.
- Account profile tab: Mood & Song section – display + Edit form (mood text, mood emoji, headline, song URL, provider, autoplay); POST `/api/account/profile-extras`; stats refresh after save.
- API `POST /api/account/profile-extras` – validate/sanitize, allowlist provider, update users.
- Account page and `/api/account/stats` – fetch and return profile extras (profileMoodText, profileMoodEmoji, profileSongUrl, profileSongProvider, profileSongAutoplayEnabled, profileHeadline).

---

## 3. Flow check

**Profile page (public view)**

1. Breadcrumbs → single card → header (avatar, name, role, mood/song, headline, socials) → bio (if set) → tab strip (Activity default) → tab content.
2. Activity tab: Stats block (if stats passed) then Recent Activity list; same links and labels as before.
3. Lately tab: same profile_links-derived links.
4. Gallery / Notes / Files: placeholder copy; no regression.

**Account profile tab (own profile)**

1. Profile tab: avatar, username/color, socials, Mood & Song – each with view vs edit; one Save/Cancel row for username, socials, or extras.
2. Editing one section (e.g. Mood & Song) closes others; Save/Cancel applies to the active edit.
3. After saving profile extras, stats refresh and form state updates from response.

**Redirect**

- Viewing own profile at `/profile/[username]` still redirects to `/account?tab=profile`.

---

## 4. Desktop layout (wide space)

- **Breakpoint:** 769px and up.
- **Header:** More space – padding 20px 24px, gap 28px; avatar left, meta right; mood/song and socials use horizontal space.
- **Tab strip:** `flex-wrap: nowrap` – single row across width; full-width strip.
- **Tab content:** Full width below strip; Stats grid and Activity list use full width.
- **Card:** Uses existing stack/card width (no extra max-width on profile card so it uses available width).

---

## 5. Mobile layout (tightened)

- **Breakpoint:** 768px and below.
- **Header:** Stacked – flex-direction column; centered; padding 12px 14px, gap 12px; mood/song gap 8px.
- **Tabs wrapper:** margin-top 16px (overridden from 24px via CSS; inline margin removed so override works).
- **Tab strip:** Smaller padding/gap (6px); tabs can wrap; smaller buttons (padding 6px 12px, font 12px, min-height 36px).
- **Tab content:** min-height 60px, padding 4px bottom.
- **Stats block:** Tighter padding (10px 12px), smaller grid gap (8px 14px), stat font 12px.
- **Song link:** max-width 100% so long URLs don’t overflow.
- **Date:** date-only-mobile / date-with-time-desktop unchanged (641px breakpoint in globals).

---

## 6. CSS and markup tweaks made during audit

1. **Profile page:** Removed unused `ClaimUsernameForm` import.
2. **Desktop (min-width: 769px):** `.profile-card-header` padding 20px 24px, gap 28px; `.profile-tabs-strip` flex-wrap nowrap.
3. **Mobile (max-width: 768px):** Header padding/gap reduced; `.profile-tabs-wrapper` margin-top 16px; tab strip and tab buttons smaller; stats block and grid tighter; `.profile-song-link` max-width 100%.
4. **ProfileTabsClient:** Removed inline `marginTop: 24px`; margin controlled by `.profile-tabs-wrapper` in CSS so mobile override applies.
5. **Stats block:** First stat label order – “Portal entry:” then date (short/long by breakpoint) for clearer reading.
6. **Bio on mobile:** `.profile-card-bio` margin-top and padding-top reduced (12px) on mobile for tighter flow.

---

## 7. Summary

- All previous profile and account behaviour is preserved; only layout changed (single card, stats in Activity tab).
- New behaviour (mood/song/headline, profile extras API, account form) is additive and gated where specified.
- Desktop uses more horizontal space (header padding/gap, single-row tabs).
- Mobile is tightened (smaller padding/gaps, stacked header, smaller tabs and stats).
- Flow: profile view → header → bio → tabs → content; account profile tab → same sections with edit/save; redirect and stats refresh unchanged.
