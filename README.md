# Errl Portal Forum

A standalone forum + announcements service for the Errl Portal.

## MVP Goals
- Guest read access
- Claim-once usernames for posting (cookie session)
- Announcements feed
- Forum threads
- Lightweight events list
- Cloudflare D1 backing store
- Cloudflare Pages deployment

## Stack
- Next.js (App Router)
- OpenNext for Cloudflare (Workers)
- Cloudflare D1 (SQLite)

## Repo Structure
- `/src/app` - pages + API route handlers
- `/src/lib` - db/session helpers
- `/migrations` - SQL migrations for D1
- `/docs` - build docs

## Getting Started (Local Dev)
1. Install deps:
   - `npm i`
2. Copy env:
   - `cp .env.example .env.local`
3. Setup Cloudflare tooling:
   - `npm i -D wrangler`
4. Create D1 DB + apply migrations (see docs):
   - `npx wrangler d1 create errl_forum_db`
   - `npx wrangler d1 migrations apply errl_forum_db --local`
5. Run:
   - `npm run dev`

## Production Build + Preview
- Build Next.js:
  - `npm run build`
- Build Cloudflare worker:
  - `npm run build:cf`
- Preview locally:
  - `npm run preview`

## Environment Variables
- `ADMIN_RESET_TOKEN` - required for `POST /api/admin/reset-users`

## Docs
Start here:
- `docs/00-Architecture.md`
- `docs/09-Work-Plan-Cursor.md`
