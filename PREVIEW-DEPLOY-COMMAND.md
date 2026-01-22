# Preview Deploy Command

## Step 1: Preview Deployment

Run this command to deploy to preview (it will commit and push your changes automatically):

```bash
./deploy.sh --preview "Fix header buttons after sign-in and improve navigation flow"
```

This will:
1. ✅ Verify build passes
2. ✅ Commit your changes (ClaimUsernameForm.js + log files)
3. ✅ Push to `origin/feat/auth-overhaul-and-post-controls`
4. ✅ Build Cloudflare worker
5. ✅ Deploy to preview at: `https://errl-portal-forum.extrepatho.workers.dev`

## Step 2: Test Preview

After deployment, test:
- [ ] Sign in → header buttons enable immediately
- [ ] Sign up → header buttons enable immediately
- [ ] First-time visitor sees signup form
- [ ] Navigation goes directly to preferred landing page
- [ ] No redirect flash

## Step 3: Push to Main (After Testing)

Once preview is verified, merge to main:

```bash
# Switch to main
git checkout main

# Pull latest
git pull origin main

# Merge your feature branch
git merge feat/auth-overhaul-and-post-controls

# Push to main
git push origin main

# Deploy to production (optional, if you want to deploy immediately)
./deploy.sh --production "Fix header buttons and improve navigation flow"
```

Or create a Pull Request on GitHub and merge through the UI.
