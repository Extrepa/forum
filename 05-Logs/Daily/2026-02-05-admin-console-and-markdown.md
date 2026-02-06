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

## Follow-up admin console organization pass
- Condensed post/user actions into dropdown menus and added show-deleted toggles.
- Added user management actions (role update, delete/anonymize, profile link, details drawer).
- Expanded mod queue (Reports tab) with clear path to Moderation tools and view links.
- Added Backups page for clear navigation (manual status + next steps).
- Added breadcrumbs to Admin + Moderation for clear return paths.
- Added hover notes (title attributes) to controls and table headers.

## New migrations / API routes
- Added `migrations/0063_user_soft_delete.sql` (users.is_deleted, deleted_at, deleted_by_user_id).
- New admin endpoints:
  - `POST /api/admin/users/[id]/role` for role changes.
  - `POST /api/admin/users/[id]/delete` to anonymize/delete accounts.

## Audit log improvements
- Admin action logging now covers hide/lock/edit across posts, timeline updates, events, music, projects, dev logs, and forum edits.
- User role changes and deletions also log to `admin_actions`.

## Auth/privacy updates
- Login + session lookup now block deleted users if `is_deleted` exists.
- User tables avoid email/phone exposure; only show counts and activity.

## Build check (post-changes)
- `npm run build` succeeded.
- Existing lint warning persists: `src/app/account/AccountSettings.js:564` missing `notifPrefs` dependency.

## Post routing clarifications
- Added Lobby filtering to exclude shitposts when `forum_threads.is_shitpost` exists, so General no longer shows shitposts.
- Shitposts are stored in `forum_threads` with `is_shitpost = 1`; if the migration is missing, they fall back into General.

## Preview migration attempt
- Attempted to apply new migration(s) to preview, but Wrangler returned a 7403 authorization error (account not authorized).
- Pending migration: 0063_user_soft_delete.sql.

## Content type registry rollout
- Added registry in `src/lib/contentTypes.js` to centralize post types + content types.
- Updated admin endpoints to validate content types via registry instead of local arrays.
- Updated posts API routes to use registry for valid types + redirect paths.
- Admin console stats and media tables now use registry constants.
- Build still succeeds (existing lint warning persists).

## Preview migrations
- 0063_user_soft_delete.sql applied successfully to preview with wrangler.

## Admin console action/menu updates
- Ensured only one action menu opens at a time (post/user menus are mutually exclusive).
- Added restore action for deleted posts and a new admin restore API.
- Added value-based glow styling for admin stat cards (mirrors the "cool color" effect request).

## Homepage
- Removed the HomeStats block and the heavy stats queries from the home page.

## New API
- `POST /api/admin/posts/[id]/restore` restores soft-deleted items by type.

## Future-proofing pass (registry + admin actions)
- Added content type registry usage in notifications menu, outbound notifications, likes API, profile activity, and account activity.
- Added delete endpoints for events, music, and projects; registry now exposes delete paths for those types.
- Added restore endpoint for admin posts and wired actions menu so only one menu opens at a time.
- Added admin stat glow levels for high counts; removed home page stats rendering + query block.

## Future-proofing sweep
- Added content type registry helpers for likes/notifications/profile/account activity routing.
- Added delete endpoints for events/music/projects and hooked them into admin actions.
- Updated outbound notifications to use registry path mapping.
- Updated user stats to use registry post-type list.
- Build verified after changes (existing lint warning persists).
