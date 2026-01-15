# Errl Forum - Personal Guide

This is a quick, personal checklist to run, deploy, and maintain the forum.

## If someone finds this repo
- This is effectively private, but it has to be public for hosting.
- There is no promise of support, contributions, or reuse.
- The app is custom to the Errl Portal.

## What This Project Is
- A simple forum + announcements + events space
- A music feed for sharing YouTube/SoundCloud tracks
- No login required
- Users claim a unique username once per browser
- Runs on Cloudflare Workers + D1
- Posts support simple formatting (bold, italic, underline, headings, links)

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

6) Create R2 bucket for uploads (images):
```
npx wrangler r2 bucket create errl-forum-uploads
```

7) Allow image uploads (choose one):
- Allow specific usernames:
  - Set `IMAGE_UPLOAD_ALLOWLIST` to a comma-separated list (example: `chriss,extrepa`)
  - `npx wrangler secret put IMAGE_UPLOAD_ALLOWLIST`
- Allow all claimed users:
  - Set `IMAGE_UPLOAD_ALLOWLIST` to `*`
  - `npx wrangler secret put IMAGE_UPLOAD_ALLOWLIST`

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

## Formatting Cheatsheet
- Bold: `**text**`
- Italic: `*text*`
- Underline: `<u>text</u>`
- Heading: `## Heading` or `### Heading`
- Link: `[label](https://example.com)`

## Useful URLs
- Worker URL (after deploy): shown by `wrangler deploy`
- Custom domain: `forum.yourdomain.com`

## Common Issues
- `next: command not found`: run `npm install`
- D1 errors: confirm `database_id` in `wrangler.toml`
- Build fails: run `npm run build` then `npm run build:cf`
