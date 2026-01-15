# Cursor Work Plan (Build Order)

This is the implementation checklist for the forum.

## Phase 0 — Repo Bootstrap
- Create Next.js app (App Router)
- Add routes:
  - `/` (claim username)
  - `/timeline`
  - `/forum`
  - `/events`
- Add `.env.example`, `wrangler.toml`, `/docs`, `/migrations`

Deliverable:
- Pages render with placeholder UI

## Phase 1 — Cloudflare D1 + DB Layer
- Confirm `wrangler.toml` D1 binding is `DB`
- Add `/migrations/0001_init.sql` + apply locally
- Add `/src/lib/db.js` helper
- Add simple posting endpoints

Deliverable:
- Local D1 works; posts insert and show in UI

## Phase 2 — Username Claim
- Implement `/api/claim`
- Store `session_token` in cookie
- Use cookie to allow posting

Deliverable:
- Username claim works and is unique

## Phase 3 — Announcements + Forum + Events
- Implement:
  - `/api/timeline`
  - `/api/threads`
  - `/api/events`
- UI lists for each page

Deliverable:
- All three sections functional

## Phase 4 — Moderation (Later)
- Reports, locks, soft deletes
- Role-based permissions

Deliverable:
- Moderation tools and rate limiting

## MVP Acceptance Criteria
- Anonymous can read announcements/forum/events
- Claimed usernames can post
- Usernames are unique and locked to session cookie
- D1 stores all content reliably
- Deployed on Cloudflare Pages with DB binding
