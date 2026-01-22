# Branch-Based Workflow - Complete Guide

This guide explains the complete branch-based development workflow for the Errl Forum project. It covers what we built, why we built it, and how to use it step-by-step.

---

## What We Built and Why

### The Problem We're Solving

Earlier, when making homepage changes, code was committed directly to the `main` branch and deployed immediately. This broke the entire site because:

- Changes weren't tested before going live
- No way to preview changes before production
- Hard to rollback if something broke
- One mistake could take down the whole site

### The Solution: Branch-Based Workflow

Now, **all changes must go through a feature branch first**. This means:

- ✅ Changes are isolated in branches
- ✅ You can test changes before merging
- ✅ Main branch stays stable
- ✅ Easy to rollback if something breaks
- ✅ Multiple safety checks prevent mistakes

---

## How It Works (Step-by-Step)

### Before (Old Way - Risky)

```bash
# You're on main branch
git checkout main
# Make changes directly
git commit -m "Update homepage"
./deploy.sh  # Deploys immediately to production
# ❌ If something breaks, production is broken!
```

### Now (New Way - Safe)

```bash
# 1. Start from main
git checkout main
git pull  # Get latest code

# 2. Create a feature branch
git checkout -b feat/homepage-stats
# Now you're on a separate branch, main is safe

# 3. Make your changes
# ... edit files ...

# 4. Test locally
npm run build  # Make sure it builds
npm run dev    # Test in browser

# 5. Commit your changes
git add .
git commit -m "Add homepage stats feature"
# ✅ Pre-commit hook runs automatically:
#    - Checks you're not on main ✓
#    - Checks branch name is correct ✓
#    - Runs linter ✓
#    - Warns about potential issues ✓

# 6. Push your branch
git push -u origin feat/homepage-stats
# ✅ deploy.sh enforces:
#    - You're on a feature branch ✓
#    - Branch name is correct ✓
#    - Build passes ✓

# 7. Deploy preview (optional, to test in real environment)
./deploy.sh --preview "Add homepage stats"
# This deploys your branch so you can test it live

# 8. Create Pull Request on GitHub
# Go to GitHub, create PR from feat/homepage-stats to main
# ✅ GitHub branch protection enforces:
#    - Must use PR (can't push directly to main) ✓
#    - Can't force push ✓
#    - Can't delete main ✓

# 9. Review and merge
# Review your own PR (self-review is fine)
# Click "Merge" on GitHub

# 10. Deploy to production
git checkout main
git pull  # Get the merged code
./deploy.sh --production "Deploy: homepage stats"
# ✅ deploy.sh enforces:
#    - You're on main branch ✓
#    - Asks for confirmation ✓
#    - Builds and deploys ✓
```

---

## What Each Piece Does

### 1. Pre-Commit Hook (`.git/hooks/pre-commit`)

**What it is:** A script that runs automatically every time you try to commit code.

**What it checks:**
- ✅ Not on `main` branch (blocks commits to main)
- ✅ Branch name follows convention (`feat/`, `fix/`, etc.)
- ✅ Runs linter (shows warnings, doesn't block)
- ✅ Warns about common hydration issues (`Date.now()`, `Math.random()`)

**If something fails:** Your commit is blocked with a helpful error message.

**Example:**
```bash
git checkout main
git commit -m "Test"
# ❌ ERROR: Cannot commit directly to main branch
# Create a feature branch first: git checkout -b feat/your-feature-name
```

---

### 2. Enhanced `deploy.sh` Script

**What it is:** The deployment script that now enforces branch rules.

**What it checks:**
- ✅ Not on `main` (unless using `--production` flag)
- ✅ Branch name is correct
- ✅ Build passes before deploying
- ✅ Provides helpful error messages

**Two modes:**

**Preview mode** (for feature branches):
```bash
./deploy.sh --preview "Your commit message"
# - Works from any feature branch
# - Deploys to test your changes
# - Uses same production environment (be careful!)
```

**Production mode** (for main only):
```bash
./deploy.sh --production "Deploy: feature name"
# - Only works from main branch
# - Asks for confirmation
# - Deploys to live production site
```

**What happens:**
1. Checks your branch
2. Validates branch name
3. Runs build to verify it works
4. Commits your changes (if any)
5. Pushes to GitHub
6. Builds Cloudflare worker
7. Deploys to Cloudflare

---

### 3. GitHub Branch Protection

**What it is:** Server-side rules on GitHub that enforce the workflow.

**What it enforces:**
- ✅ All changes to `main` must go through a Pull Request
- ✅ No force pushes to `main`
- ✅ No direct commits to `main`
- ✅ No deletion of `main`

**How it works:**
- When you try to push directly to `main` → GitHub blocks it
- When you create a PR → GitHub allows it
- When you merge PR → GitHub allows it (because it's through a PR)

---

## Real-World Example

Let's say you want to **add a new button to the homepage**.

### Step 1: Create Branch

```bash
git checkout main
git pull
git checkout -b feat/homepage-button
```

**What happens:** You're now on a separate branch. The `main` branch is untouched and safe.

---

### Step 2: Make Your Changes

Edit the homepage file, add your button code.

**What happens:** Your changes only exist on your branch. `main` is still the old version.

---

### Step 3: Test Locally

```bash
npm run dev
# Open browser, test the button works
npm run build  # Make sure it builds
```

**What happens:** You verify your changes work before committing.

---

### Step 4: Commit

```bash
git add .
git commit -m "Add new button to homepage"
```

**What happens:**
- Pre-commit hook runs automatically:
  - ✅ Checks: Not on main ✓
  - ✅ Checks: Branch name is `feat/homepage-button` ✓
  - ✅ Runs linter ✓
  - ✅ Warns about potential issues ✓
- Commit succeeds!

**If you were on main:**
```bash
git checkout main
git commit -m "Test"
# ❌ ERROR: Cannot commit directly to main branch
# Create a feature branch first: git checkout -b feat/your-feature-name
```

---

### Step 5: Push and Preview

```bash
git push -u origin feat/homepage-button
./deploy.sh --preview "Add homepage button"
```

**What happens:**
- Script checks:
  - ✅ On feature branch ✓
  - ✅ Branch name correct ✓
  - ✅ Build passes ✓
- Deploys to Cloudflare
- You get a preview URL to test

**If branch name was wrong:**
```bash
git checkout -b my-feature
./deploy.sh "Test"
# ❌ ERROR: Branch must follow naming convention
# Branch names must start with: feat/, fix/, refactor/, or chore/
```

---

### Step 6: Test Preview

Visit the deployed URL, test your button works correctly.

**What happens:** You verify your changes work in a real deployed environment before merging to main.

---

### Step 7: Create Pull Request

1. Go to GitHub
2. You'll see a banner: "feat/homepage-button had recent pushes"
3. Click "Compare & pull request"
4. Write PR description:
   - What changed: "Added new button to homepage"
   - How to test: "Click the button, verify it works"
5. Click "Create pull request"

**What happens:**
- GitHub creates a PR
- GitHub branch protection enforces: Must use PR (can't push directly to main)
- Your changes are ready for review

---

### Step 8: Merge

1. Review your PR (self-review is fine)
2. Click "Merge pull request"
3. Confirm merge

**What happens:**
- GitHub merges your branch into `main`
- Your changes are now in `main`
- But they're not live yet (need to deploy)

---

### Step 9: Deploy to Production

```bash
git checkout main
git pull  # Get the merged code
./deploy.sh --production "Deploy: homepage button"
```

**What happens:**
- Script checks:
  - ✅ You're on main branch
  - ✅ Asks "Continue? (yes/no)" - you type "yes"
  - ✅ Builds the code
  - ✅ Deploys to Cloudflare
- Production is updated!

**If you tried from feature branch:**
```bash
git checkout feat/homepage-button
./deploy.sh --production "Deploy"
# ❌ ERROR: Production deployment only allowed from main branch
# Merge your PR first, then deploy from main
```

---

## What Happens If You Try to Break the Rules

### Try to Commit Directly to Main:

```bash
git checkout main
git commit -m "Test"
# ❌ Pre-commit hook blocks it:
# "ERROR: Cannot commit directly to main branch"
# "Create a feature branch first: git checkout -b feat/your-feature"
```

**Result:** Commit is blocked. You must create a branch first.

---

### Try Wrong Branch Name:

```bash
git checkout -b my-feature
./deploy.sh "Test"
# ❌ deploy.sh blocks it:
# "ERROR: Branch must follow naming convention"
# "Branch names must start with: feat/, fix/, refactor/, or chore/"
```

**Result:** Deployment is blocked. Rename your branch:
```bash
git branch -m feat/my-feature
```

---

### Try to Push Directly to Main on GitHub:

```bash
git push origin main
# ❌ GitHub branch protection blocks it:
# "Cannot push to main - must use Pull Request"
```

**Result:** Push is blocked. You must create a PR.

---

### Try to Force Push:

```bash
git push --force origin main
# ❌ GitHub branch protection blocks it:
# "Force pushes are not allowed on main branch"
```

**Result:** Force push is blocked. This prevents losing history.

---

## The Complete Safety System

We have **three layers of protection**:

### Layer 1: Pre-Commit Hook (Local)
- Runs on your computer
- Blocks bad commits before they happen
- Fast feedback

### Layer 2: Deploy Script (Local)
- Runs when you deploy
- Enforces branch rules
- Verifies build works

### Layer 3: GitHub Protection (Server)
- Runs on GitHub
- Blocks direct pushes to main
- Requires Pull Requests

**Why three layers?**
- If one fails, others catch it
- Different checks catch different mistakes
- Maximum safety

---

## Benefits of This System

### 1. Safety
- `main` branch stays stable
- Changes are tested before going live
- Can't accidentally break production

### 2. Easy Rollback
- If a branch breaks, `main` is unaffected
- Can delete the branch and start over
- No need to revert production

### 3. Testing
- Preview deployments let you test before production
- Can test in real environment
- Catch issues before users see them

### 4. History
- Pull Requests document what changed
- Easy to see what was added and why
- Good for tracking changes

### 5. Prevention
- Multiple checks stop mistakes
- Can't commit to main by accident
- Can't deploy broken code easily

---

## Quick Reference

### Starting New Work

```bash
# Always start from latest main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feat/your-feature-name
# OR
git checkout -b fix/bug-name
git checkout -b refactor/component-name
git checkout -b chore/update-deps
```

### Making Changes

```bash
# 1. Edit files
# 2. Test locally
npm run build  # Verify it builds
npm run dev    # Test in browser

# 3. Commit
git add .
git commit -m "Descriptive commit message"
# Pre-commit hook runs automatically

# 4. Push
git push -u origin feat/your-feature-name
```

### Deploying Preview

```bash
./deploy.sh --preview "Your commit message"
```

**Use when:**
- Testing changes in deployed environment
- Before creating PR
- On feature branches only

### Deploying to Production

```bash
# After PR is merged
git checkout main
git pull origin main
./deploy.sh --production "Deploy: feature name"
```

**Use when:**
- Ready to go live
- Only from `main` branch
- After PR is merged

---

## Branch Naming Guide

### `feat/` - New Features
```bash
git checkout -b feat/homepage-stats
git checkout -b feat/event-calendar
git checkout -b feat/user-profiles
```

### `fix/` - Bug Fixes
```bash
git checkout -b fix/hydration-issue
git checkout -b fix/mobile-nav-overflow
git checkout -b fix/search-bug
```

### `refactor/` - Code Refactoring
```bash
git checkout -b refactor/api-routes
git checkout -b refactor/component-structure
git checkout -b refactor/database-queries
```

### `chore/` - Maintenance/Tooling
```bash
git checkout -b chore/update-dependencies
git checkout -b chore/cloudflare-config
git checkout -b chore/documentation-updates
```

---

## Common Workflows

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

### New Feature Workflow

```bash
# 1. Start
git checkout main
git pull
git checkout -b feat/new-feature

# 2. Make changes, commit frequently
git add .
git commit -m "Add feature part 1"
git add .
git commit -m "Add feature part 2"

# 3. Test often
npm run build  # Test after each major change

# 4. Push
git push -u origin feat/new-feature

# 5. Preview (optional)
./deploy.sh --preview "Add new feature"

# 6. Create PR, test, merge, deploy
```

### Hotfix Workflow (Production Broken)

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

---

## Troubleshooting

### "Cannot commit directly to main branch"

**Problem:** You're trying to commit on `main`.

**Solution:**
```bash
git checkout -b feat/your-feature
# Then commit
```

---

### "Branch must follow naming convention"

**Problem:** Branch name doesn't start with `feat/`, `fix/`, `refactor/`, or `chore/`.

**Solution:**
```bash
# Rename your branch
git branch -m feat/correct-name
```

---

### "Build failed"

**Problem:** Code has build errors.

**Solution:**
```bash
# See detailed errors
npm run build

# Fix errors, then try deploying again
```

---

### "Production deployment only from main"

**Problem:** Trying to deploy production from a feature branch.

**Solution:**
```bash
# Merge your PR first
git checkout main
git pull
./deploy.sh --production
```

---

### "Cannot push to main - must use Pull Request"

**Problem:** GitHub is blocking direct push to `main`.

**Solution:**
1. Create a feature branch
2. Push the branch
3. Create a Pull Request
4. Merge the PR

---

## Understanding the Tools

### Pre-Commit Hook

**Location:** `.git/hooks/pre-commit`

**When it runs:** Every time you run `git commit`

**What it does:**
- Checks you're not on `main`
- Validates branch name
- Runs linter
- Warns about common issues

**Can you skip it?** Yes, but don't:
```bash
git commit --no-verify  # Skips hook (not recommended)
```

**Why it's useful:** Catches mistakes before they're committed.

---

### Deploy Script

**Location:** `deploy.sh`

**When it runs:** When you run `./deploy.sh`

**What it does:**
- Checks your branch
- Validates branch name
- Verifies build works
- Commits and pushes changes
- Builds Cloudflare worker
- Deploys to Cloudflare

**Modes:**
- `--preview` - For testing (feature branches)
- `--production` - For live site (main only)

**Why it's useful:** Enforces workflow and prevents bad deployments.

---

### GitHub Branch Protection

**Location:** GitHub repository settings

**When it runs:** When you try to push to `main` on GitHub

**What it does:**
- Blocks direct pushes to `main`
- Requires Pull Requests
- Prevents force pushes
- Prevents deletion

**Why it's useful:** Server-side protection that can't be bypassed.

---

## Best Practices

### 1. Always Start from Latest Main

```bash
git checkout main
git pull
# Then create branch
```

**Why:** Ensures you're working with the latest code.

---

### 2. Make Small, Focused Changes

**Good:**
- One feature per branch
- Small, testable changes
- Easy to review

**Bad:**
- Multiple unrelated features in one branch
- Huge changes that are hard to test
- Mixing features and fixes

---

### 3. Test Before Committing

```bash
npm run build  # Always test build
npm run dev    # Test in browser
```

**Why:** Catches issues early, before they're committed.

---

### 4. Commit Frequently

**Good:**
```bash
git commit -m "Add button component"
git commit -m "Add button styles"
git commit -m "Connect button to API"
```

**Bad:**
```bash
git commit -m "Everything"
```

**Why:** Makes it easier to see what changed and rollback if needed.

---

### 5. Use Descriptive Commit Messages

**Good:**
- "Fix header dropdown navigation"
- "Add calendar badge to event posts"
- "Integrate RSVP checkbox into comment form"

**Bad:**
- "update stuff"
- "changes"
- "fix"

**Why:** Makes it easier to understand what changed and when.

---

### 6. Test Preview Before Merging

```bash
./deploy.sh --preview "Test feature"
# Test the preview URL
# Fix any issues
# Then merge
```

**Why:** Catches deployment issues before they affect production.

---

## Integration with Lessons Learned

### From Homepage Incident (2026-01-22):

**✅ Always use feature branches** - Now enforced by `deploy.sh` and pre-commit hook
- The homepage changes broke the entire site because they were made directly on main
- Feature branches would have caught the issues in preview

**✅ Test incrementally** - Documented in workflow, enforced by build checks
- Make one small change at a time
- Test each change before moving to the next
- Don't make all changes at once

**✅ Avoid client-side polling for static data** - Documented in workflow guidelines
- Client-side polling caused hydration mismatches
- Server-side rendering with `force-dynamic` is simpler and more reliable

**✅ Handle time-based content properly** - Pre-commit hook warns about `Date.now()` usage
- `Date.now()` and `new Date()` cause server/client mismatches
- Pass timestamps from server, or accept that time displays update after hydration

**✅ Fix root causes, not symptoms** - Documented in workflow guidelines
- Understand why hydration mismatch is happening
- Fix the actual cause, not just suppress the warning

---

## Summary

### The Old Way (Risky)
```
Make changes → Commit to main → Deploy → ❌ Production breaks
```

### The New Way (Safe)
```
Create branch → Make changes → Test → Commit → Preview → PR → Merge → Deploy → ✅ Safe
```

### Key Points

1. **Always create a branch** before making changes
2. **Test locally** before committing
3. **Use preview deployments** to test in real environment
4. **Create Pull Requests** to merge to main
5. **Deploy from main** only after PR is merged

### The Safety Net

- **Pre-commit hook** - Catches mistakes before commit
- **Deploy script** - Enforces rules and verifies build
- **GitHub protection** - Server-side enforcement

**Result:** Multiple layers of protection prevent breaking production!

---

## Getting Help

If you're stuck:

1. Check the error message - it usually tells you what to do
2. Check [Quick-Reference.md](Quick-Reference.md) - Quick command reference
3. Check [Development-Workflow.md](Development-Workflow.md) - Complete workflow guide
4. Check [Workflow-Rules.md](Workflow-Rules.md) - Enforced rules

**Remember:** When in doubt, create a branch - it's always safe!

---

## Related Documentation

- [Development-Workflow.md](Development-Workflow.md) - Complete workflow guide
- [Workflow-Rules.md](Workflow-Rules.md) - Enforced rules and guidelines
- [GitHub-Setup.md](GitHub-Setup.md) - GitHub branch protection setup
- [Quick-Reference.md](Quick-Reference.md) - Quick command reference
- [Errl-Forum_GitHub-Cloudflare-Workflow.md](Errl-Forum_GitHub-Cloudflare-Workflow.md) - Original workflow documentation

---

**Last Updated:** 2026-01-22  
**Status:** ✅ Active and Enforced
