# Development Workflow

This document outlines the complete development workflow for the Errl Forum project, incorporating lessons learned and best practices.

## Core Principles

1. **`main` branch is production** - Never commit directly to main
2. **Feature branches for all changes** - Isolate work in branches
3. **Test before merge** - Build and test locally before merging
4. **Incremental changes** - Make small, testable changes
5. **Document known issues** - Track harmless errors separately

---

## Branch Naming Conventions

All feature branches must follow this naming pattern:

- **`feat/`** - New features
  - Example: `feat/homepage-stats`, `feat/event-rsvp-redesign`
  
- **`fix/`** - Bug fixes
  - Example: `fix/hydration-issue`, `fix/mobile-nav-overflow`
  
- **`refactor/`** - Code refactoring
  - Example: `refactor/thread-card-layout`, `refactor/api-routes`
  
- **`chore/`** - Tooling, config, or maintenance
  - Example: `chore/update-dependencies`, `chore/cloudflare-env-vars`

### Why This Matters

- Makes it easy to see what type of change a branch contains
- Helps organize work and track progress
- Enforced by `deploy.sh` to prevent mistakes

---

## Step-by-Step Workflow

### 1. Start New Work

```bash
# Pull latest main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feat/your-feature-name
```

### 2. Make Changes Locally

- Make your changes
- Test locally with `npm run dev`
- Commit frequently with descriptive messages

```bash
git add .
git commit -m "Add calendar badge to event posts"
```

### 3. Test Before Pushing

**Always test locally first:**

```bash
# Run linter
npm run lint

# Build to check for errors
npm run build

# Test Cloudflare build
npm run build:cf
```

### 4. Push Branch

```bash
git push -u origin feat/your-feature-name
```

### 5. Deploy Preview (Optional)

To test in a deployed environment before creating a PR:

```bash
./deploy.sh --preview "Your commit message"
```

**Note:** Preview deployments use the same production environment, so test carefully!

### 6. Create Pull Request

1. Go to GitHub
2. Create a Pull Request from your branch to `main`
3. Write a clear PR description:
   - What changed
   - How to test it
   - Any breaking changes

### 7. Review and Test

- Review your own changes (self-review is fine)
- Test the preview deployment if available
- Check for:
  - Build errors
  - Linter errors
  - Hydration issues
  - Console errors

### 8. Merge to Main

Once everything looks good:

1. Merge the PR on GitHub
2. Pull latest main locally:
   ```bash
   git checkout main
   git pull origin main
   ```

### 9. Deploy to Production

```bash
./deploy.sh --production "Deploy: [feature name]"
```

**Important:** Only deploy from `main` branch!

---

## When to Create Branches

### Always Create a Branch For:

- ✅ New features
- ✅ Bug fixes
- ✅ Refactoring
- ✅ Configuration changes
- ✅ Documentation updates (if significant)
- ✅ Any change that could affect production

### You Can Skip Branches For:

- ❌ Typo fixes in comments (but still use a branch if deploying)
- ❌ Very minor formatting changes (but still use a branch if deploying)

**When in doubt, create a branch!**

---

## Testing Requirements Before Merge

Before merging any branch to `main`, verify:

- [ ] Local build succeeds (`npm run build`)
- [ ] Cloudflare build succeeds (`npm run build:cf`)
- [ ] Linter passes (`npm run lint`)
- [ ] No new hydration errors introduced
- [ ] All pages load correctly
- [ ] Core functionality works (create/edit/delete posts)
- [ ] Mobile layout works
- [ ] No console errors (except documented harmless ones like #418 on homepage/feed)

---

## Deployment Process

### Preview Deployment (Feature Branches)

```bash
./deploy.sh --preview "Add homepage stats"
```

- Builds and deploys from current branch
- Uses production environment (be careful!)
- Good for testing in real deployed environment
- Not required, but recommended for major changes

### Production Deployment (Main Branch Only)

```bash
./deploy.sh --production "Deploy: homepage stats feature"
```

- Only works from `main` branch
- Requires confirmation prompt
- Deploys to live production site
- Includes rollback instructions in output

---

## Common Workflows

### Quick Fix

```bash
git checkout main
git pull
git checkout -b fix/header-dropdown
# Make fix
npm run build  # Test
git commit -m "Fix header dropdown navigation"
git push -u origin fix/header-dropdown
# Create PR, merge, then deploy
```

### New Feature

```bash
git checkout main
git pull
git checkout -b feat/event-calendar
# Make changes, commit frequently
npm run build  # Test often
git push -u origin feat/event-calendar
./deploy.sh --preview "Add event calendar feature"  # Optional
# Create PR, test, merge, deploy
```

### Hotfix (Production Broken)

```bash
git checkout main
git pull
git checkout -b fix/urgent-production-issue
# Fix the issue
npm run build
git commit -m "Fix: [urgent issue]"
git push -u origin fix/urgent-production-issue
# Fast-track PR, merge immediately
git checkout main
git pull
./deploy.sh --production "Hotfix: [issue]"
```

---

## Integration with Lessons Learned

### From Homepage Incident (2026-01-22):

**Always use feature branches** - Prevents breaking production
- The homepage changes broke the entire site because they were made directly on main
- Feature branches would have caught the issues in preview

**Test incrementally** - Catch issues early
- Make one small change at a time
- Test each change before moving to the next
- Don't make all changes at once

**Avoid client-side polling for static data** - Use server-side rendering
- Client-side polling caused hydration mismatches
- Server-side rendering with `force-dynamic` is simpler and more reliable

**Handle time-based content properly** - Pass timestamps as props
- `Date.now()` and `new Date()` cause server/client mismatches
- Pass timestamps from server, or accept that time displays update after hydration

**Fix root causes, not symptoms** - Don't use `suppressHydrationWarning` everywhere
- Understand why hydration mismatch is happening
- Fix the actual cause, not just suppress the warning

---

## Troubleshooting

### "Cannot commit directly to main branch"

**Solution:** Create a feature branch first:
```bash
git checkout -b feat/your-feature
```

### "Branch must follow naming convention"

**Solution:** Rename your branch:
```bash
git branch -m feat/your-feature
```

### Build fails during deployment

**Solution:** Fix build errors first:
```bash
npm run build  # See detailed errors
# Fix errors, then try deploying again
```

### Production deployment fails from feature branch

**Solution:** Merge to main first:
```bash
# Merge your PR on GitHub
git checkout main
git pull
./deploy.sh --production
```

---

## Related Documentation

- [Workflow Rules](Workflow-Rules.md) - Enforced rules and guidelines
- [GitHub Setup](GitHub-Setup.md) - GitHub branch protection setup
- [Quick Reference](Quick-Reference.md) - Quick command reference
- [GitHub-Cloudflare Workflow](Errl-Forum_GitHub-Cloudflare-Workflow.md) - Original workflow documentation
