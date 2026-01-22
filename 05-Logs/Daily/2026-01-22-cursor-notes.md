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

## Bug Fixes (Latest Session)

### 1. Project Replies Lock Check Missing
**Issue**: When a project is locked by an admin, comments are correctly blocked but replies can still be posted. The project replies route lacked the `is_locked` check that was added to the comments route.

**Fix**: Added the same lock check to `/src/app/api/projects/[id]/replies/route.js` that exists in the comments route. Now locked projects properly block both comments and replies.

**Files Changed**:
- `src/app/api/projects/[id]/replies/route.js` - Added `is_locked` check before allowing reply creation

### 2. Date Validation Bug in `parseLocalDateTimeToUTC`
**Issue**: The `parseLocalDateTimeToUTC` function's validation doesn't catch malformed datetime strings missing the minutes component. When `timePart` is "13" instead of "13:00", destructuring results in `minutes = undefined`. The validation `Number.isNaN(minutes)` returns false for undefined, allowing the input to pass. Line 159 then silently defaults to 0 minutes via `minutes || 0`, causing events to be created with incorrect times instead of rejecting the invalid input.

**Fix**: 
- Added validation to check that time part has exactly 2 components (hours and minutes)
- Added explicit check for `undefined` values in addition to `NaN` checks
- Now properly rejects malformed time strings like "13" instead of silently defaulting to "13:00"

**Files Changed**:
- `src/lib/dates.js` - Enhanced validation in `parseLocalDateTimeToUTC` function

## Documentation

### GitHub Permissions Troubleshooting Guide
Created comprehensive guide to help verify GitHub permissions and resolve issues with approving own pull requests.

**Files Created**:
- `docs/GitHub-Permissions-Troubleshooting.md` - Complete troubleshooting guide for GitHub branch protection and self-approval issues

## Build

- `npm run build` succeeds.

## Summary

Both critical bugs have been fixed:
1. ✅ Project replies now respect lock status
2. ✅ Date validation now properly rejects malformed time strings

The fixes are ready for commit and testing.

## Push for test preview

On branch `feat/auth-overhaul-and-post-controls`. Use:

```bash
./deploy.sh --preview "Fix project replies lock check and date validation"
```

Or, to only push (e.g. for CI preview):

```bash
git add -A && git commit -m "Fix project replies lock check and date validation" && git push origin feat/auth-overhaul-and-post-controls
```
