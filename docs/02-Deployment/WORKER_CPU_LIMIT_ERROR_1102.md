# Worker Exceeded CPU Time Limit (Error 1102)

**Date:** 2026-01-30

If you hit "Error 1102: Worker exceeded resource limits" or "Worker exceeded CPU time limit" on the homepage (or similar pages) while the site was down, this doc explains what happened and how it was fixed.

## What Happened

- **Symptom:** Cloudflare showed a white error page: "Error 1102: Worker exceeded resource limits"
- **When:** Homepage (`GET /`) load, especially when logged in
- **Ray ID example:** `9c65674f1e8769da` (from Cloudflare error page)

## Cause

The homepage runs many database queries to build section cards (timeline, forum, events, music, projects, shitposts, art & nostalgia, bugs & rant, devlog, lore & memories). These were executed **sequentially**—one after another. That caused:

1. High CPU time (lots of await cycles)
2. Exceeding the Workers Free plan limit (**10ms CPU**)

Cloudflare Workers Free has a hard 10ms CPU cap. The homepage was blowing past it.

## Fix Applied

**Parallelized all section data fetches** in `src/app/page.js`:

- All 28 DB queries (counts + recent posts/comments per section) now run in a single `Promise.all`
- One round of awaits instead of 28
- Lower CPU usage and faster response

## Workers Free vs Paid

| Plan       | CPU limit     | Custom `cpu_ms` in wrangler.toml? |
|-----------|---------------|------------------------------------|
| Workers Free | 10ms (fixed) | **No** – Cloudflare API returns error 100328 |
| Workers Paid  | 30s default, up to 5 min | Yes |

**Current setup:** Site runs on Workers Paid. `wrangler.toml` sets `cpu_ms = 30000` (30s). The parallelization in `page.js` remains—it improves response time regardless of the limit.

## If It Happens Again

1. **Check Cloudflare dashboard** – Workers & Pages → Metrics → Errors
2. **Identify the route** – Usually the homepage or other data-heavy pages
3. **Parallelize DB work** – Replace sequential `await` chains with `Promise.all`
4. **Batch lookups** – Replace N sequential queries in loops with a single `WHERE id IN (...)` query
5. **Upgrade to Workers Paid** – Enables custom `cpu_ms` and higher limits if needed

## Files Changed

- `src/app/page.js` – Section data fetches use `Promise.all`; stats + recent activity also parallelized; author lookups batched (1 query instead of up to 15)
- `wrangler.toml` – `[limits] cpu_ms = 30000` (Workers Paid; 30s CPU per request)
