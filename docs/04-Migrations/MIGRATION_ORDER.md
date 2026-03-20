# D1 migration order (canonical)

Database: **`errl_forum_db`** (see `wrangler.toml` → `database_id`).

Wrangler applies migrations in **lexicographic filename order** (not numeric order). This list matches `sort -V` on `migrations/*.sql`.

## Apply

**Local (dev):**

```bash
npm run db:migrate:local
```

**Remote (production):**

```bash
npm run db:migrate:remote
```

Equivalent:

```bash
npx wrangler d1 migrations apply errl_forum_db --local
npx wrangler d1 migrations apply errl_forum_db --remote
```

## List applied (remote)

```bash
npm run db:migrations:list
```

## Files (79 files, 0001–0079)

| Range | Notes |
|-------|--------|
| 0001–0063 | Core schema, profiles, notifications, soft delete, admin audit, etc. |
| 0064 | **`0064_add_click_events.sql`** only (click telemetry table). |
| 0065–0071 | Events, nomads, admin prefs, notification `target_sub_id`, threading, DMs. |
| **0072** | **`0072_noop.sql`** — no-op placeholder between 0071 and 0073. |
| 0073–0078 | Threading, DM notify prefs, conversation prefs, **`user_activity_log`**. |
| **0079** | **`0079_add_user_names.sql`** — `first_name` / `last_name` on `users`. |

There is **no** `0072` schema change in history except this placeholder; **0071 → 0073** was a jump in original numbering.

## Required for current app features

Minimum expected for a **full** production deploy (see individual feature docs):

- **0063** — `is_deleted` / `deleted_at` / `deleted_by_user_id` on users (admin delete/restore).
- **0067–0069** — Forum/nomad/admin notification prefs (JSON columns).
- **0070–0074** — Comment `reply_to_id` where needed; **0071** — `notifications.target_sub_id`.
- **0075–0077** — DM tables + DM/conversation notification prefs.
- **0078** — `user_activity_log` table.

**0079** (`first_name` / `last_name`) — signup uses fallbacks if missing; still recommended.

## Troubleshooting

- **Duplicate column:** Column already exists — mark migration applied or use `INSERT OR IGNORE` into `d1_migrations` per Cloudflare docs; see `MIGRATION_FIX_0019.md` pattern.
- **Missing migration:** Run `db:migrate:remote` before deploy; verify with `db:migrations:list`.
- **Rename `0064_add_names` → `0079`:** See **`MIGRATION_0064_NAMES_TO_0079.md`**.
