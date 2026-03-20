# Cursor notes — 2026-03-20

## Development Update #12 + git

- Publish copy: **`05-Logs/Development/2026-03-20-development-post-12.md`** (public-facing only; includes admin user/post restore, mentions, scroll/delete/like fixes).
- Committed and pushed **main**: admin restore API + console UI, hardened user delete, **`user_restored`** admin event label, logs.

## Git housekeeping (same day)

- `git pull origin main` — already up to date; `git remote prune origin` run.
- Removed **40 local branches** that were fully merged into `main` (including `feat/dev-post-12-admin-restore` and old feat/fix/chore/codex lines).
- **Merged `fix/spotify-embed-box-height`** into `main` (resolved conflicts: keep full `2026-03-15-cursor-notes`, Spotify CSS without `overflow: hidden` on `.embed-frame.spotify`). Local + **`origin/fix/spotify-embed-box-height` deleted**.
- **Stashes**: `stash@{0}` and `stash@{1}` still present (large WIP); not dropped—`git stash show -p` then `drop` when obsolete.

## Migrations (same day)

- **Duplicate `0064_*`:** Renamed `0064_add_names.sql` → **`0079_add_user_names.sql`** (first/last name columns). Ops note: **`docs/04-Migrations/MIGRATION_0064_NAMES_TO_0079.md`** if production already had `0064_add_names.sql` in `d1_migrations`.
- **Gap `0072`:** Added **`migrations/0072_noop.sql`** (no-op `SELECT 1`) so numbering between 0071 and 0073 is explicit.
- **Docs:** **`docs/04-Migrations/MIGRATION_ORDER.md`** — canonical order, apply commands, feature ranges.
- **Scripts:** `npm run db:migrate:local`, `db:migrate:remote`, `db:migrations:pending` (lists unapplied remote).

## Production D1 (remote) — applied same day

- Queried `d1_migrations`: had `0064_add_click_events.sql` and **`0064_add_names.sql`** (no `0072` / `0079` rows yet).
- Ran `UPDATE d1_migrations SET name = '0079_add_user_names.sql' WHERE name = '0064_add_names.sql'` so renamed file matches DB history (avoids duplicate `ALTER` on `first_name`/`last_name`).
- `wrangler d1 migrations apply errl_forum_db --remote` — applied **`0072_noop.sql`** only.
- `wrangler d1 migrations list errl_forum_db --remote` — **No migrations to apply.**
