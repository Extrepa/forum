# Quick Reference Guide

Quick command reference for the Errl Forum development workflow.

---

## Common Git Commands

### Starting New Work

```bash
# Pull latest main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feat/your-feature-name
```

### Making Changes

```bash
# Stage changes
git add .

# Commit with message
git commit -m "Descriptive commit message"

# Push branch (first time)
git push -u origin feat/your-feature-name

# Push updates
git push
```

### Switching Branches

```bash
# List branches
git branch

# Switch to branch
git checkout feat/your-feature-name

# Switch to main
git checkout main
```

### Merging to Main

```bash
# After PR is merged on GitHub
git checkout main
git pull origin main
```

---

## Branch Naming Examples

### Features
```bash
git checkout -b feat/homepage-stats
git checkout -b feat/event-calendar
git checkout -b feat/user-profiles
```

### Bug Fixes
```bash
git checkout -b fix/hydration-issue
git checkout -b fix/mobile-nav-overflow
git checkout -b fix/search-bug
```

### Refactoring
```bash
git checkout -b refactor/api-routes
git checkout -b refactor/component-structure
git checkout -b refactor/database-queries
```

### Chores
```bash
git checkout -b chore/update-dependencies
git checkout -b chore/cloudflare-config
git checkout -b chore/documentation-updates
```

---

## Deployment Commands

### Preview Deployment (Feature Branch)

```bash
./deploy.sh --preview "Add homepage stats feature"
```

**Use when:**
- Testing changes in deployed environment
- Before creating PR
- On feature branches only

### Production Deployment (Main Branch Only)

```bash
./deploy.sh --production "Deploy: homepage stats feature"
```

**Use when:**
- Deploying to live production site
- Only from `main` branch
- After PR is merged

### Manual Deployment (If Needed)

```bash
# Build Cloudflare worker
npm run build:cf

# Deploy
npm run deploy
```

---

## Testing Commands

### Local Development

```bash
# Start dev server
npm run dev

# Build for testing
npm run build

# Run linter
npm run lint
```

### Cloudflare Build

```bash
# Build Cloudflare worker
npm run build:cf

# Preview locally
npm run preview
```

---

## Troubleshooting

### "Cannot commit directly to main branch"

**Fix:**
```bash
git checkout -b feat/your-feature
# Then make your changes
```

### "Branch must follow naming convention"

**Fix:**
```bash
# Rename your branch
git branch -m feat/correct-name
```

### "Build failed"

**Fix:**
```bash
# See detailed errors
npm run build

# Fix errors, then try again
```

### "Production deployment only from main"

**Fix:**
```bash
# Merge your PR first
git checkout main
git pull
./deploy.sh --production
```

### Undo Last Commit (Before Push)

```bash
# Undo commit, keep changes
git reset --soft HEAD~1

# Undo commit, discard changes
git reset --hard HEAD~1
```

### Undo Last Commit (After Push)

```bash
# Create revert commit
git revert HEAD
git push
```

### Rollback Production

```bash
# Revert the problematic commit
git revert <commit-hash>
git push
./deploy.sh --production "Rollback: [reason]"
```

---

## Workflow Quick Reference

### Complete Feature Workflow

```bash
# 1. Start
git checkout main
git pull
git checkout -b feat/my-feature

# 2. Make changes
# ... edit files ...

# 3. Test
npm run build
npm run lint

# 4. Commit
git add .
git commit -m "Add my feature"

# 5. Push
git push -u origin feat/my-feature

# 6. Preview (optional)
./deploy.sh --preview "Add my feature"

# 7. Create PR on GitHub, merge when ready

# 8. Deploy
git checkout main
git pull
./deploy.sh --production "Deploy: my feature"
```

### Quick Fix Workflow

```bash
# 1. Start
git checkout main
git pull
git checkout -b fix/urgent-bug

# 2. Fix
# ... fix the bug ...

# 3. Test
npm run build

# 4. Commit & Push
git add .
git commit -m "Fix: urgent bug"
git push -u origin fix/urgent-bug

# 5. Create PR, merge, deploy
git checkout main
git pull
./deploy.sh --production "Hotfix: urgent bug"
```

---

## Common Patterns

### Check Current Branch

```bash
git branch --show-current
```

### See What Changed

```bash
# See uncommitted changes
git status

# See commit history
git log --oneline -10
```

### Stash Changes (Temporary Save)

```bash
# Save changes temporarily
git stash

# Restore changes
git stash pop
```

### Compare Branches

```bash
# See what's different
git diff main..feat/my-feature
```

---

## Emergency Procedures

### Production is Broken

```bash
# 1. Create hotfix branch
git checkout main
git pull
git checkout -b fix/rollback-issue

# 2. Fix or revert
git revert <bad-commit-hash>
# OR make fix

# 3. Test
npm run build

# 4. Commit & Push
git commit -m "Hotfix: rollback issue"
git push -u origin fix/rollback-issue

# 5. Fast-track PR, merge immediately

# 6. Deploy
git checkout main
git pull
./deploy.sh --production "Hotfix: rollback issue"
```

### Need to Rollback to Previous Commit

```bash
# Find the commit hash
git log --oneline

# Reset to that commit (DANGEROUS - only if needed)
git reset --hard <commit-hash>
git push --force origin main  # Only in extreme emergency!

# Better: Create revert commit
git revert <commit-hash>
git push
./deploy.sh --production "Rollback to [commit]"
```

---

## Related Documentation

- [Development Workflow](Development-Workflow.md) - Complete workflow guide
- [Workflow Rules](Workflow-Rules.md) - Enforced rules and guidelines
- [GitHub Setup](GitHub-Setup.md) - GitHub branch protection setup
