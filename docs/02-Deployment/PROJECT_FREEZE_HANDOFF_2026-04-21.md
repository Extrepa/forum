# Project Freeze Handoff - 2026-04-21

## Purpose

This file is the restart point for future maintenance after the 2026-04-21 wrap-up freeze.

## Current operational command set

From `package.json`:

- Local dev: `npm run dev`
- Lint: `npm run lint`
- Next production build: `npm run build`
- Cloudflare bundle build: `npm run build:cf`
- Preview local worker: `npm run preview`
- Migration apply (local): `npm run db:migrate:local`
- Migration apply (remote): `npm run db:migrate:remote`
- Pending remote migrations: `npm run db:migrations:pending`

## Migration and environment caveats

- Remote migration list/apply commands require Wrangler auth in non-interactive sessions (`CLOUDFLARE_API_TOKEN`).
- Migration naming history includes prior housekeeping (see migration docs in `docs/04-Migrations/`).
- If remote migration checks fail, verify auth first before interpreting as schema drift.

## Known bug/risk hotspots

1. **Hydration mismatch prone surfaces**
   - Example area: rotating placeholder/input UX.
   - First check: console warnings in dev and SSR/CSR text divergence.

2. **Schema-variance defensive code paths**
   - Many API routes include compatibility handling for mixed migration states.
   - First check: endpoint JSON error payloads and DB column availability.

3. **Responsive/legacy browser behavior**
   - Shared risks in modal sizing, pointer interactions, and blur-heavy styles.
   - First check: `docs/06-Verification/2026-04-21-responsive-compat-audit.md`.

## Status snapshot at freeze

- Local lint/build/build:cf checks pass.
- No automated CI suite is configured in repo at freeze time.
- Manual smoke pass confirms routes and auth redirects are functioning, with known guest/home and hydration caveats documented.

## Restart checklist (if development resumes)

1. Pull latest branch and inspect `git status` for carry-over local changes.
2. Run `npm run lint && npm run build && npm run build:cf`.
3. Configure Wrangler auth and run `npm run db:migrations:pending`.
4. Re-run smoke checks for:
   - home guest experience,
   - feed/section auth redirects,
   - admin route protection,
   - key posting/detail flows.
5. Reconfirm responsive behavior on:
   - desktop,
   - narrow mobile widths,
   - at least one older iOS Safari device or simulator (best effort policy).
6. Read newest daily and development logs before feature work:
   - `05-Logs/Daily/2026-04-21-cursor-notes.md`
   - `05-Logs/Development/2026-04-21-development-post-13-wrap-up-freeze.md`

## Linked wrap-up artifacts

- Development freeze post: `05-Logs/Development/2026-04-21-development-post-13-wrap-up-freeze.md`
- Daily execution log: `05-Logs/Daily/2026-04-21-cursor-notes.md`
- Responsive audit: `docs/06-Verification/2026-04-21-responsive-compat-audit.md`
