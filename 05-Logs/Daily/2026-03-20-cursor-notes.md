# Cursor notes — 2026-03-20

## Development Update #12 + git

- Publish copy: **`05-Logs/Development/2026-03-20-development-post-12.md`** (public-facing only; includes admin user/post restore, mentions, scroll/delete/like fixes).
- Committed and pushed **main**: admin restore API + console UI, hardened user delete, **`user_restored`** admin event label, logs.

## Git housekeeping (same day)

- `git pull origin main` — already up to date; `git remote prune origin` run.
- Removed **40 local branches** that were fully merged into `main` (including `feat/dev-post-12-admin-restore` and old feat/fix/chore/codex lines).
- **Kept** `fix/spotify-embed-box-height` — it still has **2 commits not on `main`** (Spotify player box height + deploy notes). Merge or delete manually when you decide.
- **Stashes**: `stash@{0}` and `stash@{1}` still hold Jan 22 notes/code (large); not dropped—review with `git stash show` / `pop` if needed.

## Migrations (same day)

- **Duplicate `0064_*`:** Renamed `0064_add_names.sql` → **`0079_add_user_names.sql`** (first/last name columns). Ops note: **`docs/04-Migrations/MIGRATION_0064_NAMES_TO_0079.md`** if production already had `0064_add_names.sql` in `d1_migrations`.
- **Gap `0072`:** Added **`migrations/0072_noop.sql`** (no-op `SELECT 1`) so numbering between 0071 and 0073 is explicit.
- **Docs:** **`docs/04-Migrations/MIGRATION_ORDER.md`** — canonical order, apply commands, feature ranges.
- **Scripts:** `npm run db:migrate:local`, `db:migrate:remote`, `db:migrations:pending` (lists unapplied remote).
