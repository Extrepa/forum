# 2026-03-15 Cursor notes

## Spotify music player box height (fix follow-up)

- **Issue**: Music post Spotify embed container was taller than the player; first fix (track 80px + CSS) "did not work."
- **Root cause**: Deploy was run as `npm run deploy` without `npm run build:cf`, so the worker used an existing `.open-next` bundle and never included the new code. No new assets were uploaded.
- **Changes (re-applied on main)**:
  - `src/lib/embeds.js`: `spotifyEmbedHeight('track')` = 80 (was 152).
  - `src/app/globals.css`: `.embed-frame.spotify { min-height: 80px; min-width: 0; }` (base + mobile).
  - `src/app/music/[id]/page.js` and `src/app/music/MusicClient.js`: added `maxHeight: embed.height` to the embed-frame inline style so the box cannot grow even if the iframe tries to expand.
- **Deploy**: Ran `npm run build:cf` then `npm run deploy`. Wrangler reported 7 new or modified assets (CSS + music chunks). Version ID: 83844764-5324-4fb8-ad42-da8d19e41278.
- **Takeaway**: For Cloudflare worker deploys, always run `npm run build:cf` before `npm run deploy` (or use `./deploy.sh` which does both).

## Admin account delete failed (Wiseonechris)

- **Symptom**: "Account delete failed for Wiseonechris" in Admin Console when deleting a user.
- **Cause**: Migration `0063_user_soft_delete.sql` has not been applied to the production D1 database. The delete API updates `users` with `is_deleted`, `deleted_at`, `deleted_by_user_id`; without those columns the UPDATE throws and the API returns 409 "Migration missing for users delete".
- **Fix**: Apply migration 0063 to the remote DB (from project root, with wrangler auth):
  - Production: `npx wrangler d1 execute errl_forum_db --remote --file=./migrations/0063_user_soft_delete.sql`
  - Preview (if needed): add `--env preview` to the same command.
- **Code**: AdminConsole `handleDeleteUser` now surfaces the API `error` message in the notice (e.g. "Migration missing for users delete (Wiseonechris)") so future failures show the real reason.

## Admin delete post from post detail page not working

- **Symptom**: Deleting a post as admin while viewing the post (e.g. on `/music/123`, `/bugs/123`) does not work.
- **Fixes applied**:
  1. **DeletePostButton**: `fetch` now uses `credentials: 'include'` so the session cookie is always sent with the delete request (avoids 401 if cookies were not sent in some contexts).
  2. **DeletePostButton**: Error handling improved: when the API returns non-ok, we parse JSON safely and show `data.error` (e.g. "unauthorized", "notfound", "notready"); on parse failure show status code; in catch show `e.message` or generic message and log to console.
  3. **Forum/timeline/devlog delete APIs**: Wrapped the soft-delete UPDATE in try/catch and return `{ error: 'notready' }` with 409 on DB error so the client gets a clear JSON response instead of 500 HTML.
- **If it still fails**: User will now see the actual API error (e.g. "unauthorized" = session not recognized; "notready" = migration/schema issue). Check browser Network tab for the delete request status and response body.

## Like count shows zero after refresh (button still highlighted)

- **Symptom**: After liking a post, the like count displays correctly; on refresh the count shows 0 but the like button stays highlighted (liked state correct).
- **Cause**: Detail pages have rollout fallback queries when the main query throws (e.g. missing columns like moved_to_type). Those fallbacks used `0 AS like_count` instead of the real subquery, so after any fallback the count was 0 while the separate "user liked" query still ran and showed the heart filled.
- **Fix**: Replaced hardcoded `0 AS like_count` in fallback queries with the real count subquery in:
  - `src/app/music/[id]/page.js` (both fallbacks)
  - `src/app/events/[id]/page.js` (both fallbacks)
  - `src/app/devlog/[id]/page.js` (both fallbacks)
- So when the main query fails and a fallback is used, like count is now correct after refresh.

---

## Session summary (double-check before commit)

**Files changed this session:**
- `src/components/AdminConsole.js` – handleDeleteUser: surface API error in notice.
- `src/components/DeletePostButton.js` – credentials: 'include'; better error handling (show API error or status).
- `src/app/api/forum/[id]/delete/route.js` – try/catch around UPDATE, return 409 JSON on failure.
- `src/app/api/timeline/[id]/delete/route.js` – same.
- `src/app/api/devlog/[id]/delete/route.js` – same.
- `src/app/music/[id]/page.js` – fallback queries: real like_count subquery (2 places).
- `src/app/events/[id]/page.js` – fallback queries: real like_count subquery (2 places).
- `src/app/devlog/[id]/page.js` – fallback queries: real like_count subquery (2 places).
- `05-Logs/Daily/2026-03-15-cursor-notes.md` – this log.

**Pre-existing (already on main / from earlier):** `src/app/globals.css`, `src/app/music/MusicClient.js`, `src/lib/embeds.js` (Spotify box height).

**Done:** Branch `fix/admin-delete-like-count-2026-03-15` created, committed (6371eff), merged to main, pushed to origin. Built with `npm run build:cf`, deployed with `npm run deploy`. Version ID: 0c1d09ff-75f9-48bb-a0b5-b006bffa27f4.

**Migration 0063 (user soft delete):** Verified 2026-03-16. Running the full `0063_user_soft_delete.sql` on remote returns "duplicate column name" for `is_deleted`, `deleted_at`, and `deleted_by_user_id` — all three columns already exist on production D1. User still saw "Migration missing" because the delete API’s UPDATE was setting many other columns (notify_*, avatar_key, etc.). **Fix:** API updated to a minimal UPDATE that only sets columns from base schema + 0063 (username, username_norm, role, session_token, email, email_norm, phone, phone_norm, password_hash, password_set_at, must_change_password, is_deleted, deleted_at, deleted_by_user_id). No notify_* or avatar columns; account delete works even if later migrations aren’t applied. On failure, API now returns the real DB error message and logs it.

## Admin: Deleted sections and restore

- **Added:** Dedicated "Deleted users" and "Deleted posts" sections in Admin Console (Users and Posts tabs). Each section lists soft-deleted items with a **Restore** button.
- **API:** `POST /api/admin/users/[id]/restore` — sets `is_deleted = 0`, clears `deleted_at` and `deleted_by_user_id`; logs audit and notifies admins. Post restore already existed at `POST /api/admin/posts/[id]/restore`.
- **Data:** Admin page now loads `loadDeletedUsers(db, 50)` and `loadDeletedContent(db, 50)` and passes `deletedUsers` and `deletedPosts` to AdminConsole. Restored items are removed from the deleted lists in state; restored users are added/updated in the main user list.
- **UI:** Restore user shows confirmation (username stays anonymized after restore). Restore post reuses existing `handleRestorePost`. Added `user_restored` to admin notification event keys.

- **Merged `fix/spotify-embed-box-height` (2026-03-20):** Removed `overflow: hidden` on `.embed-frame.spotify` and nested iframe (branch had dropped these; main had re-added them during deploy follow-up). Keeps the 80px compact track box without clipping oddities.
