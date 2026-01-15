# Setup: Cloudflare (D1 + Pages)

## Prereqs
- Cloudflare account
- Node 18+ or 20+
- Wrangler installed (local dev + migrations)

Install wrangler:
- `npm i -D wrangler`

Login:
- `npx wrangler login`

## Create D1 Database
Create:
- `npx wrangler d1 create errl_forum_db`

Wrangler will output:
- database name
- database id

Add to `wrangler.toml`:
- D1 binding name: `DB`

Example:
```toml
name = "errl-portal-forum"
compatibility_date = "2026-01-14"

[[d1_databases]]
binding = "DB"
database_name = "errl_forum_db"
database_id = "PASTE_ID_HERE"
```

## Local Dev D1
Apply migrations locally:
- `npx wrangler d1 migrations apply errl_forum_db --local`

Run dev:
- `npm run dev`

## OpenNext Build + Preview
Build Next.js:
- `npm run build`

Build the Cloudflare worker bundle:
- `npm run build:cf`

Preview locally:
- `npx wrangler dev`

## Secrets
Set environment variables in Wrangler/Cloudflare:
- `ADMIN_RESET_TOKEN`

Do not commit these.

## Optional: R2 Setup (Later)
- Create bucket: `errl-forum-uploads`
- Add R2 binding and signed URL upload flow
