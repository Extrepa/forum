# Errl Forum – Profile Card Expansion & Tabbed Profile Plan

**Purpose**

Plan a profile-page update that adds mood/song/profile extras plus a tabbed content system, while preserving the current card-based layout and existing data flows. This plan is grounded in the current implementation in `src/app/profile/[username]/page.js` and related account/profile editing UI. It intentionally avoids pixel-matching the shared mockups and instead focuses on feasible, modular changes.

---

## 1) Current Code Baseline (What Exists Today)

**Profile page layout**

- Two-column layout: Profile card (avatar/username/role/social links) + Stats card. After the cards: optional bio and recent activity list. (`src/app/profile/[username]/page.js`)
- Stats are assembled server-side with a multi-table aggregation and displayed in the right column. (`src/app/profile/[username]/page.js`)
- Social links are read from `users.profile_links` and shown as a vertical list of inline buttons. (`src/app/profile/[username]/page.js`)
- Bio is read from `users.profile_bio` and shown below the cards. (`src/app/profile/[username]/page.js`)

**Profile data currently available**

- `users` table fields used: `username`, `role`, `created_at`, `profile_bio`, `profile_links`, `preferred_username_color_index`, `profile_views`, `avatar_key`, `time_spent_minutes`, `avatar_edit_minutes`.
- The profile is viewed at `/profile/[username]` and redirects to `/account?tab=profile` when the user views their own profile.

---

## 2) Goals for This Update

- **Keep the stacked card layout** (Profile card, Stats card) and layer new features below or within those cards.
- **Add a mood + song preview** to the profile card.
- **Introduce a tabbed content region** under the Stats card for Activity, Lately, Gallery, Notes, and optional Files.
- **Allow additional user-provided links** via a structured tab, while preserving `profile_links` in the profile card.
- **Keep changes modular** so each feature can ship incrementally.

---

## 3) Proposed UX Changes (Non-Visual, Structure-First)

### 3.1 Profile Card Additions (Left Column)

Add a new section beneath the username/role block:

- **Mood chip**
  - Short text, optional emoji
  - Displayed on the profile card and in username hover popovers
- **Mini song area**
  - Song provider pill + title
  - Play/pause + mute toggles (no autoplay by default)
- **Optional headline** (short bio/line distinct from full bio)

**Behavior**

- Mood is opt-in and can auto-clear based on a set duration.
- Song embed is only shown if set; otherwise show a short prompt or fallback track as defined by product.

### 3.2 Stats Card Additions (Right Column)

Add read-only stats tied to new features:

- `Lately` count
- `Gallery` count
- (Optional) “Last checked in” (coarse)

### 3.3 Tabbed Content Area (Below Stats Card)

Introduce a tab strip under the Stats card and above the existing Recent Activity list. Tabs should default to **Activity**.

**Tabs**

1. Activity (existing recent activity data)
2. Lately (new curated link/media cards)
3. Gallery (user photos)
4. Notes (private + optional public)
5. Files (future, gated)

---

## 4) Data Model & API Plan

### 4.1 Users Table Additions

- `profile_mood_text` (varchar)
- `profile_mood_emoji` (varchar)
- `profile_mood_updated_at` (timestamp)
- `profile_song_url` (text)
- `profile_song_provider` (enum: soundcloud | spotify | youtube)
- `profile_song_autoplay_enabled` (boolean)
- `profile_headline` (varchar)

### 4.2 New Tables

**user_lately_items**

- `id` (pk)
- `user_id` (fk)
- `url`
- `provider` (soundcloud | spotify | youtube | external | internal)
- `title`
- `thumbnail`
- `tag`
- `order_index`
- `created_at`

**user_gallery_images**

- `id` (pk)
- `user_id` (fk)
- `r2_key`
- `caption`
- `is_featured`
- `created_at`

**profile_notes**

- `id` (pk)
- `owner_user_id`
- `target_user_id`
- `content`
- `visibility` (private | public)
- `created_at`

**user_files** (phase gated)

- `id` (pk)
- `user_id`
- `r2_key`
- `filename`
- `mime_type`
- `size_bytes`
- `created_at`

---

## 5) UI Components & Touch Points

**Profile page**

- `src/app/profile/[username]/page.js`
  - Insert mood chip + song mini player under the username/role.
  - Add tabbed section below the Stats card.
  - Move the current Recent Activity list into the Activity tab.

**Account/Profile editor**

- `src/app/account/AccountTabsClient.js`
  - Add form fields for mood, song, headline, and profile customization.
  - Provide preview + validation for allowed providers.

**New components (recommended)**

- `ProfileMoodChip`
- `ProfileSongMiniPlayer`
- `ProfileTabs`
- `ProfileLatelyGrid`
- `ProfileGalleryGrid`
- `ProfileNotesPanel`

---

## 6) Feature Flags

Add flags for each module:

- `profile_mood`
- `profile_music`
- `profile_backgrounds`
- `lately_cards`
- `gallery`
- `notes`
- `files`

---

## 7) Implementation Phases (Short)

### Phase 1 – Identity

- Mood system
- Song system
- Profile card background customization

### Phase 2 – Expression

- Tabs infrastructure
- Lately cards
- Gallery

### Phase 3 – Connection

- Notes
- Pokes (if planned later)

### Phase 4 – Power Users

- Files
- Shared folders

---

## 8) Checklist (Implementation Order)

**Baseline**

- [ ] Confirm profile page component boundaries.
- [ ] Confirm DB migration pattern and naming.
- [ ] Add feature flags.

**Phase 1**

- [ ] Add user fields for mood/song/headline.
- [ ] Create mood editor UI in account profile tab.
- [ ] Add mini song player UI (no autoplay by default).

**Phase 2**

- [ ] Add tab strip + Activity tab wrapper.
- [ ] Build Lately item model + CRUD.
- [ ] Add gallery upload + grid.

**Phase 3**

- [ ] Add notes table + UI.
- [ ] Add poke interaction.

**Phase 4**

- [ ] Add file table + upload controls.

---

## 9) Constraints & Safety

- Sanitize all user-entered URLs and text.
- No HTML injection.
- Provider embeds are iframes with strict allow-lists.
- Autoplay requires opt-in; default muted or stopped.
- Avoid engagement loops: chronological, user-driven content only.

---

## 10) Definition of Done

A feature is complete when:

- It remains optional and opt-in.
- It respects Errl’s non-algorithmic, calm UX principles.
- It uses modular components and can be gated via feature flags.
- The existing card-based profile layout is preserved.

---

## 11) Execution Notes (Initial Scaffolding)

- Add new `users` table columns for mood, song metadata, and headline before wiring UI editors.
- Introduce a tabbed content shell that wraps the existing Recent Activity list as the Activity tab.
- Display mood and song status on the profile card with placeholders when unset.
