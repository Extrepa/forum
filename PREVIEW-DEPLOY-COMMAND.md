# Preview Deploy Command

## Step 1: Preview Deployment

Run this command to deploy to preview (it will commit and push your changes automatically):

```bash
./deploy.sh --preview "Your commit message"
```

This will:
1. ✅ Verify build passes
2. ✅ Commit your changes
3. ✅ Push to your current branch
4. ✅ Build Cloudflare worker (`npm run build:cf`)
5. ✅ Deploy to preview at: `https://errl-portal-forum-preview.extrepatho.workers.dev`

**If this release includes guestbook/gallery:** Apply migrations 0056 and 0057 to the preview D1 database so those features work. See `docs/02-Deployment/MIGRATIONS-0056-0057.md`.

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
