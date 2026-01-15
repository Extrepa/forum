# Security & Moderation (MVP)

## Threat Model
- spam posts
- link farming
- harassment
- accidental admin-only endpoint exposure

## Required Protections

### Server-side checks
- Every POST verifies session token from cookie
- Admin reset endpoint requires `ADMIN_RESET_TOKEN`

### Input validation
Recommended limits:
- title: 3..120 chars
- body: 1..5000 chars
- reject whitespace-only
Optional spam guard:
- limit number of links per post (e.g., max 5)

### Rate limiting (simple)
Start with coarse protection:
- create thread: 3 per minute per user (and per IP)
- create reply: 10 per minute per user (and per IP)

### Soft deletes
For replies/comments:
- set `is_deleted=1`
- UI shows placeholder to public users
- mods/admins can still view original if needed (optional)

## Moderation MVP
- Users can report content
- Mod/Admin can:
  - resolve/dismiss reports
  - delete reply/comment (soft)
  - lock/unlock threads
  - optional pin/unpin

## Privacy
- only usernames are shown
- no emails or OAuth profiles are collected
