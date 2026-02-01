# Migrations 0056 (Guestbook) and 0057 (Gallery)

Apply these to your D1 database **before or after** deploying the profile/guestbook/gallery release. Without them, guestbook and gallery features will show empty data and APIs may error when the tables are missing.

## Preview environment

```bash
# Guestbook: guestbook_entries table
npx wrangler d1 execute errl_forum_db --remote --file=./migrations/0056_guestbook_entries.sql --env preview

# Gallery: user_gallery_images table
npx wrangler d1 execute errl_forum_db --remote --file=./migrations/0057_user_gallery_images.sql --env preview
```

## Production (default env)

```bash
npx wrangler d1 execute errl_forum_db --remote --file=./migrations/0056_guestbook_entries.sql
npx wrangler d1 execute errl_forum_db --remote --file=./migrations/0057_user_gallery_images.sql
```

## What they add

- **0056** – `guestbook_entries`: id, owner_user_id, author_user_id, content, created_at. Index on (owner_user_id, created_at DESC).
- **0057** – `user_gallery_images`: id, user_id, image_key, caption, is_cover, order_index, created_at. Index on (user_id, created_at DESC).

Apply each migration once per database (preview and production are separate D1 DBs in your wrangler config).
