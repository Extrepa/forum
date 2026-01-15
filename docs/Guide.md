# Errl Forum - Personal Guide

This is a quick, personal checklist to run, deploy, and maintain the forum.

## If someone finds this repo
- This is effectively private, but it has to be public for hosting.
- There is no promise of support, contributions, or reuse.
- The app is custom to the Errl Portal.

## What This Project Is
- A simple forum + announcements + events space
- No login required
- Users claim a unique username once per browser
- Runs on Cloudflare Workers + D1

## Local Dev
1) Install deps:
```
npm install
```

2) Copy env file:
```
cp .env.example .env.local
```

3) Start dev server:
```
npm run dev
```

## Cloudflare Setup (One-Time)
1) Login:
```
npx wrangler login
```

2) Create D1 database:
```
npx wrangler d1 create errl_forum_db
```

3) Paste the database ID into `wrangler.toml` under `database_id`.

4) Apply migrations:
```
npx wrangler d1 migrations apply errl_forum_db --local
npx wrangler d1 migrations apply errl_forum_db --remote
```

5) Set admin reset secret:
```
npx wrangler secret put ADMIN_RESET_TOKEN
```

## Build + Deploy
1) Build Next.js:
```
npm run build
```

2) Build the Cloudflare worker bundle:
```
npm run build:cf
```

3) Deploy:
```
npm run deploy
```

## Custom Domain
In Cloudflare dashboard:
- Workers & Pages → `errl-portal-forum`
- Settings → Custom Domains
- Add `forum.yourdomain.com`

## Admin Reset (if needed)
To wipe all usernames and content:
- POST `/api/admin/reset-users`
- Header: `x-admin-token: ADMIN_RESET_TOKEN`

## Useful URLs
- Worker URL (after deploy): shown by `wrangler deploy`
- Custom domain: `forum.yourdomain.com`

## Common Issues
- `next: command not found`: run `npm install`
- D1 errors: confirm `database_id` in `wrangler.toml`
- Build fails: run `npm run build` then `npm run build:cf`
