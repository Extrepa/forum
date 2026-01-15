# Errl Forum - Build Log (Today)

This is a plain-English record of what was built and wired together today.

## Big Outcomes
- Forum app now runs on Cloudflare Workers (OpenNext) with D1 storage.
- Music feed is integrated into the forum (YouTube + SoundCloud embeds).
- Image uploads are supported (R2) with a username allowlist.
- Posts support lightweight formatting (bold/italic/underline/headings/links).
- Neon Errl styling applied across the UI with animated borders.

---

## 1) Platform + Deployment
- Switched from Cloudflare Pages adapter to **OpenNext (Workers)**.
- Updated scripts so builds work reliably:
  - `npm run build` → Next.js build
  - `npm run build:cf` → OpenNext worker bundle
  - `npm run deploy` → Wrangler deploy
- Deployed worker URL:
  - `https://errl-portal-forum.extrepatho.workers.dev`

## 2) Database + Storage
- D1 migrations applied locally + remotely:
  - `0001_init.sql` + `0002_indexes.sql`
  - `0003_add_images.sql` (image support)
  - `0004_music.sql` (music feed tables)
- R2 bucket created:
  - `errl-forum-uploads`
- Wrangler bindings:
  - `DB` → D1
  - `UPLOADS` → R2

## 3) Core Forum Features
- Public read, claim-once usernames for posting.
- Announcements, forum threads, events all working.
- Formatting toolbar added to all posts (simple Markdown + underline tags).

## 4) Music Feed (Integrated)
- New `/music` page:
  - Post a YouTube/SoundCloud link
  - Optional description, tags, and image
  - Shows embed, notes, tags, rating stats
- New `/music/[id]` detail page:
  - Ratings (1–5)
  - Comments
- Tables added:
  - `music_posts`, `music_ratings`, `music_comments`

## 5) Image Uploads
- Posts can include an image for:
  - Announcements
  - Forum threads
  - Events
  - Music posts
- Images are stored in R2 and served via `/api/media/[...key]`.
- Upload permissions controlled by:
  - `IMAGE_UPLOAD_ALLOWLIST` (secret)
  - Currently set to `extrepa` only.

## 6) Theming + UI
- Full neon Errl styling:
  - Dark background + neon gradients
  - Animated border chase effect
  - Transparent panels + glow
- Responsive layout tweaks for mobile.

---

# What Was Created (Key Files)

## API / Server
- `src/app/api/claim/route.js`
- `src/app/api/timeline/route.js`
- `src/app/api/threads/route.js`
- `src/app/api/events/route.js`
- `src/app/api/media/[...key]/route.js`
- `src/app/api/music/posts/route.js`
- `src/app/api/music/ratings/route.js`
- `src/app/api/music/comments/route.js`

## Pages
- `src/app/page.js`
- `src/app/timeline/page.js`
- `src/app/forum/page.js`
- `src/app/events/page.js`
- `src/app/music/page.js`
- `src/app/music/[id]/page.js`

## Libraries
- `src/lib/db.js`
- `src/lib/uploads.js`
- `src/lib/markdown.js`
- `src/lib/embeds.js`
- `src/lib/auth.js`

## UI Components
- `src/components/PostForm.js`
- `src/components/MusicPostForm.js`
- `src/components/ClaimUsernameForm.js`
- `src/components/SessionBadge.js`

## Migrations
- `migrations/0001_init.sql`
- `migrations/0002_indexes.sql`
- `migrations/0003_add_images.sql`
- `migrations/0004_music.sql`

---

# Commands Used (Summary)

## Build + Deploy
```
npm install
npm run build
npm run build:cf
npm run deploy
```

## D1
```
npx wrangler d1 create errl_forum_db
npx wrangler d1 migrations apply errl_forum_db --local
npx wrangler d1 migrations apply errl_forum_db --remote
```

## R2
```
npx wrangler r2 bucket create errl-forum-uploads
```

## Secrets
```
npx wrangler secret put ADMIN_RESET_TOKEN
npx wrangler secret put IMAGE_UPLOAD_ALLOWLIST
```

---

# Notes / Reminders
- Image uploads only work for usernames in `IMAGE_UPLOAD_ALLOWLIST`.
- To allow everyone: set `IMAGE_UPLOAD_ALLOWLIST = *`.
- To update the live site, run build + deploy again.
