# 2026-01-22 Cursor Notes

## Completed and verified

- **Signup notification preferences (Phase 2.1)**  
  - `ClaimUsernameForm`: added `signupNotifyEmail` (default on), `signupNotifySms` (default off); checkboxes in signup form; sent in `submitSignup` body.  
  - `POST /api/auth/signup`: accepts `notifyEmailEnabled` / `notifySmsEnabled`; inserts into `users` when cols exist; fallbacks for older schema.

- **Auth lockout (Phase 3)**  
  - All relevant pages now `getSessionUser()` then `redirect('/')` if missing.  
  - Updated: feed, lobby, devlog, music, events, projects, art, memories, lore, shitposts, bugs, rant, nostalgia, announcements, lore-memories, art-nostalgia, bugs-rant, search, profile `[username]`, account (unchanged), plus all `[id]` detail pages and `lobby/[id]`.  
  - Home `/` remains accessible when signed out.

- **Responsive page-top-row (Phase 6)**  
  - `globals.css`: `@media (max-width: 768px)` for `.page-top-row` / `.page-top-row-right` (wrap, flex, smaller buttons).

- **Other fixes**  
  - `art/[id]`: added `like_count` subquery for art posts; `usernameColorMap`, `userLiked`, `LikeButton`/`CommentFormWrapper` (user always present after redirect).  
  - `events/[id]`: removed duplicate `getSessionUser`; use single `user` at top.  
  - `music/[id]`: added auth check and `user` at top; already had `isAdmin` / like check.  
  - `announcements/[id]`: removed duplicate `getSessionUser`; `user` from top used for like/comment.

## Build

- `npm run build` succeeds.

## Push for test preview

On branch `feat/auth-overhaul-and-post-controls`. Use:

```bash
./deploy.sh --preview "Auth lockout, signup notification prefs, mobile page-top-row CSS"
```

Or, to only push (e.g. for CI preview):

```bash
git add -A && git commit -m "Auth lockout, signup notification prefs, mobile page-top-row CSS" && git push origin feat/auth-overhaul-and-post-controls
```
