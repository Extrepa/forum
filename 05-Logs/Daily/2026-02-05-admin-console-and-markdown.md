# 2026-02-05 Admin console + Markdown uploads

## Summary
- Expanded the admin console so counts, listings, and tabs use real data instead of placeholders.
- Restored/verified Markdown upload behavior and fixed form render issues in post forms.
- Applied remaining preview D1 migrations (0060-0062) after marking duplicate-column migrations as applied.
- Ran a successful production build (Next.js 15.5.9); only existing lint warning remains.

## Admin console updates
- Stats now aggregate across all content tables (forum_threads, posts, timeline_updates, events, music_posts, projects, dev_logs) and comment tables (forum_replies, post_comments, timeline_comments, event_comments, music_comments, project_comments, project_replies, dev_log_comments). Updated in `src/app/admin/page.js`.
- Latest content list now merges recent entries across all content types, includes section labels, and routes view/edit/hide/lock actions per type. Updated in `src/app/admin/page.js` + `src/components/AdminConsole.js`.
- Tabs for Users, Reports, Media, and Settings now show real data rather than "Coming soon" placeholders. `src/components/AdminConsole.js`.
- Added media stats panel (image counts per content table + gallery count) and wired a settings toggle for image uploads. `src/app/admin/page.js`, `src/components/AdminConsole.js`.
- Admin quick actions now render as real buttons (styled anchor links) and match the global button system. `src/components/AdminConsole.js`, `src/app/globals.css`.

## Markdown uploads + form fixes
- Ensured Markdown uploader clears the loading state if the file is rejected. `src/components/MarkdownUploader.js`.
- Fixed broken JSX blocks in the music and project forms (image upload toggle + Markdown uploader). `src/components/MusicPostForm.js`, `src/components/ProjectForm.js`.

## Styling updates
- Added global `.button` styles for anchor buttons and a `.ghost` variant, so button-looking links (like the Mission Control quick actions) look correct across the UI. `src/app/globals.css`.
- Added a small size tweak for admin quick-action buttons. `src/app/globals.css`.

## Preview D1 migrations
- Preview migration run initially failed due to duplicate columns already existing.
- Marked these as applied in `d1_migrations` to proceed:
  - 0058_add_profile_cover_mode.sql
  - 0059_add_profile_display_settings.sql
- Successfully applied on preview:
  - 0060_image_upload_settings.sql
  - 0061_shitpost_flag.sql
  - 0062_admin_audit_log.sql
- NOTE: 0054_add_profile_mood_song_headline.sql already existed on preview (duplicate column), so it was effectively already applied.

## Build/test
- `npm run build` succeeds (Next.js 15.5.9).
- Existing lint warning remains: `src/app/account/AccountSettings.js:564` missing `notifPrefs` dependency in `useEffect`.

## Follow-ups / open items
- Verify the admin console in preview after deployment: counts, mixed content list, new tabs.
- Validate that the "shitposts to general" misrouting is resolved in posting logic.
- Decide whether to address the lingering AccountSettings hook warning.
