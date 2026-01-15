# Deployment (Cloudflare Workers + D1)

## Build
- `npm run build`
- `npm run build:cf`

## Deploy
- `npm run deploy`

## Bindings
- D1 binding (Wrangler):
  - Name: `DB`
  - Database: `errl_forum_db`

## Environment Variables (Production)
- `ADMIN_RESET_TOKEN`

## Migrations (Production)
Run from local with Wrangler:
- `npx wrangler d1 migrations apply errl_forum_db`

## Domain Options
1) Subdomain (recommended MVP):
- `forum.yourdomain.com`

2) Path integration (proxy):
- `yourdomain.com/portal/forum` -> proxied to Pages

MVP recommendation: subdomain first, then upgrade.
