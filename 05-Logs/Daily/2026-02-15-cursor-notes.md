# Cursor Notes - 2026-02-15

## Objective
- Double-check the Cloudflare production deployment state after multiple Worker services appeared in the dashboard.
- Confirm which Worker owns `forum.errl.wtf`.
- Record a full audit trail of config changes, deploy actions, and verification outputs.

## What Was Changed During This Session
- Updated `src/lib/audit.js`:
  - Removed Node import `import crypto from 'crypto'`.
  - Switched to `globalThis.crypto.randomUUID()`.
- Updated `package.json`:
  - `deploy` script changed from `wrangler deploy` to `wrangler deploy --env=""`.
  - Wrangler version bumped from `^4.61.1` to `^4.65.0`.
- Updated `package-lock.json` via `npm install --save-dev wrangler@4.65.0`.
- Updated `wrangler.toml` in stages:
  - Added top-level compatibility flags:
    - `nodejs_compat`
    - `global_fetch_strictly_public`
  - Added/confirmed custom domain route:
    - `forum.errl.wtf` with `custom_domain = true`.
  - Finalized canonical production service name:
    - `name = "errl-portal-forum"` (not `errl-portal-forum-docs`).
  - Added explicit production settings:
    - `workers_dev = false`
    - `preview_urls = false`
  - Added explicit R2 binding:
    - `UPLOADS -> errl-forum-uploads`.
  - Kept preview env explicit:
    - `workers_dev = true`
    - `preview_urls = true`.

## Production Deploy Events (Chronological)
1. Deployed `errl-portal-forum-docs` (production env) with custom domain route.
2. Confirmed route reassignment prompt from `errl-portal-forum` to `errl-portal-forum-docs` and accepted.
3. After dashboard review, corrected config back to canonical service `errl-portal-forum`.
4. Deployed `errl-portal-forum` again and accepted reassignment prompt from `errl-portal-forum-docs` back to `errl-portal-forum`.
5. Final production deployment version on canonical worker:
   - `ecf018c1-240b-4495-9104-92ec4d7be361`.

## Verification Commands Run
- Local build and bundle:
  - `npm run build:cf` (pass).
- Wrangler dry-run (prod env):
  - `HOME=/Users/extrepa/Projects/errl-portal-forum-docs WRANGLER_HOME=/Users/extrepa/Projects/errl-portal-forum-docs/.wrangler npx wrangler deploy --dry-run --env=""` (pass).
- Cloudflare deployment history:
  - `npx wrangler deployments list --name errl-portal-forum --json`
  - `npx wrangler deployments list --name errl-portal-forum-docs --json`
- Cloudflare version metadata:
  - `npx wrangler versions view ecf018c1-240b-4495-9104-92ec4d7be361 --name errl-portal-forum --json`
  - `npx wrangler versions view f9ab8501-35e9-4338-9dcd-ef59e075c4b0 --name errl-portal-forum-docs --json`

## Final Verified State
- Canonical production Worker: `errl-portal-forum`.
- Custom domain route: `forum.errl.wtf` is attached to `errl-portal-forum`.
- `errl-portal-forum` latest deployed version:
  - `ecf018c1-240b-4495-9104-92ec4d7be361` (created `2026-02-15T03:04:55Z`).
- Runtime flags on canonical worker include:
  - `nodejs_compat`
  - `global_fetch_strictly_public`.
- Bindings on canonical worker include:
  - `DB` (D1)
  - `UPLOADS` (R2)
  - `ASSETS`
  - existing secrets (`RESEND_API_KEY`, `TWILIO_*`, etc.)
  - `IMAGE_UPLOAD_ALLOWLIST` as plain text variable (`"*"`).

## Important Notes / Risks
- During deploy, Wrangler warned that `IMAGE_UPLOAD_ALLOWLIST` env var conflicts with an existing remote secret and would replace it.
- Result: `IMAGE_UPLOAD_ALLOWLIST` is now plain text var on production worker instead of secret.
  - Current value observed in metadata: `"*"`.
- Multiple Worker services still exist in account:
  - `errl-portal-forum` (canonical prod)
  - `errl-portal-forum-docs` (orphaned/secondary service)
  - preview services also exist.
- `deploy.sh --production` auto-committed npm metadata files in prior run:
  - `.npm/_logs/2026-02-15T02_56_32_392Z-debug-0.log`
  - `.npm/_update-notifier-last-checked`

## Suggested Cleanup Follow-ups
- Decide whether to keep or delete `errl-portal-forum-docs` service in Cloudflare.
- Add `.npm/` patterns to `.gitignore` to avoid committing local npm artifacts.
- If desired, convert `IMAGE_UPLOAD_ALLOWLIST` back to a Wrangler secret workflow (or keep as plain var if intentional).

## Current Local Workspace Status
- Modified:
  - `wrangler.toml`
- Untracked local npm debug logs under `.npm/_logs/` from command runs.
