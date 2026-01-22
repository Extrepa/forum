# Deployment Clarification - 2026-01-22

## How Preview Deployment Works

### Two Different "Previews"

1. **GitHub Preview** (if configured)
   - Shows the code/repository
   - Does NOT run the worker script
   - Just shows the source code

2. **Cloudflare Worker Preview** (actual deployment)
   - Runs the worker script
   - Requires manual deployment
   - Live at: `https://errl-portal-forum.extrepatho.workers.dev`

### What Happens When You Push to GitHub

**Just pushing to GitHub does NOT deploy the worker.**

When you push:
- ✅ Code is saved to GitHub
- ✅ GitHub shows the branch/PR
- ❌ Worker is NOT built
- ❌ Worker is NOT deployed
- ❌ Preview URL does NOT update

### To Actually Deploy the Preview

You need to run the deployment script:

```bash
# Option 1: Use the deploy script
./deploy.sh --preview "Your commit message"

# Option 2: Manual steps
npm run build:cf    # Build the Cloudflare worker
npm run deploy       # Deploy to Cloudflare
```

### What the Deploy Script Does (Preview Mode)

1. **Builds Next.js**: `npm run build`
2. **Builds Cloudflare Worker**: `npm run build:cf`
   - This runs `opennextjs-cloudflare build`
   - Creates `.open-next/worker.js` (the worker script)
   - Creates `.open-next/assets/` (static assets)
3. **Deploys to Cloudflare**: `npm run deploy`
   - This runs `wrangler deploy`
   - Uploads the worker to Cloudflare
   - Makes it live at the workers.dev URL

### Important Note

⚠️ **Preview and Production use the SAME Cloudflare Worker environment!**

From `deploy.sh` line 144:
```
⚠️  Preview deployments use the same production environment
   Test thoroughly before merging to main!
```

This means:
- Preview deployments overwrite the live site
- Both preview and production deploy to the same URL
- The only difference is which branch you're deploying from

### Current Situation

You've:
1. ✅ Committed the header buttons fix to `feat/auth-overhaul-and-post-controls`
2. ❌ NOT yet pushed to GitHub (authentication needed)
3. ❌ NOT yet deployed the worker (need to run deploy script)

### Next Steps to See the Fix Live

1. **Push to GitHub** (you'll need to authenticate):
   ```bash
   git push origin feat/auth-overhaul-and-post-controls
   ```

2. **Deploy the worker** (builds and deploys):
   ```bash
   ./deploy.sh --preview "Fix header buttons after sign-in"
   ```
   
   OR manually:
   ```bash
   npm run build:cf
   npm run deploy
   ```

3. **Test the preview**:
   - Visit: `https://errl-portal-forum.extrepatho.workers.dev`
   - Sign in
   - Verify header buttons are enabled immediately

### Summary

- **GitHub push** = Code saved, but worker NOT deployed
- **Deploy script** = Builds worker + deploys to Cloudflare
- **Preview URL** = Only updates after running deploy script
- **Same environment** = Preview and production share the same Cloudflare Worker
