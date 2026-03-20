# Renaming migration `0064_add_names.sql` → `0079_add_user_names.sql`

**Why:** Two migrations shared the `0064` prefix (`0064_add_click_events.sql` and `0064_add_names.sql`). Wrangler applies by **filename**; duplicate prefixes are confusing and easy to mis-order. The names migration is now **`0079_add_user_names.sql`**.

## If production already applied `0064_add_names.sql`

The `first_name` / `last_name` columns already exist. Before deploying the repo that **removes** `0064_add_names.sql` and adds `0079_add_user_names.sql`, update the `d1_migrations` row so Wrangler does not try to run `0079` again:

```sql
UPDATE d1_migrations
SET name = '0079_add_user_names.sql'
WHERE name = '0064_add_names.sql';
```

Run with Wrangler (replace `errl_forum_db` if your DB name differs):

```bash
npx wrangler d1 execute errl_forum_db --remote --command "UPDATE d1_migrations SET name = '0079_add_user_names.sql' WHERE name = '0064_add_names.sql'"
```

Then deploy and run `migrations apply` as usual.

## If you never applied `0064_add_names.sql`

No manual step. `0079_add_user_names.sql` will apply on the next `migrations apply`.

## Verify

```bash
npx wrangler d1 execute errl_forum_db --remote --command "PRAGMA table_info(users);"
```

Confirm `first_name` and `last_name` columns when signup uses the full INSERT path.
