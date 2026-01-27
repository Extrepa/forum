# New Branch & Preview Workflow

This guide explains the updated, isolated deployment workflow for the Errl Portal Forum. Branch previews now deploy to a separate worker and do not affect the live production site.

## 🚀 The Core Workflow

### 1. Create a Feature Branch
Always work in a branch. Ensure the name starts with `feat/`, `fix/`, `refactor/`, or `chore/`.
```bash
git checkout -b feat/your-feature-name
```

### 2. Develop and Deploy Preview
When you want to see your changes live in a real environment:
```bash
./deploy.sh "Your descriptive commit message"
```
Because you are on a branch, the script will automatically:
- Commit and Push your changes to GitHub.
- Build the Cloudflare Worker.
- **Deploy to the Preview Environment** only.

### 3. Test the Preview
Your changes are isolated at:
**🌐 URL:** [https://errl-portal-forum-preview.extrepatho.workers.dev](https://errl-portal-forum-preview.extrepatho.workers.dev)

---

## 🔑 One-Time Setup: Preview Secrets
Cloudflare environments act as separate workers. The **first time** you use this new setup, you must manually add your production secrets to the preview worker so features like login and uploads work there:

```bash
# Set the Admin Token for the preview environment
npx wrangler secret put ADMIN_RESET_TOKEN --env preview

# Set the Image Upload Allowlist for the preview environment
npx wrangler secret put IMAGE_UPLOAD_ALLOWLIST --env preview
```

---

## 🏛️ Moving to Production
Once you have tested the preview and everything looks perfect:

### 1. Merge to Main
You can do this via a GitHub Pull Request (recommended) or locally:
```bash
git checkout main
git pull origin main
git merge feat/your-feature-name
git push origin main
```

### 2. Deploy to Production
Run the deploy script with the `--production` flag from the `main` branch:
```bash
./deploy.sh --production "Deploying [Feature Name] to production"
```
**🌐 Production URL:** [https://errl-portal-forum.extrepatho.workers.dev](https://errl-portal-forum.extrepatho.workers.dev)

---

## ⚠️ Important Safety Rules
- **Never commit directly to `main`.** The script will block you unless you use the `--production` flag.
- **Preview uses the Production Database.** Be careful with destructive actions (like Admin Resets) in the preview environment, as they share the same Cloudflare D1 database.
- **Check Cloudflare Dashboard.** Ensure "Connected Git" is not set to auto-deploy every push to the production environment.
