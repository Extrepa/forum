# GitHub Branch Protection Setup

This document explains how to set up branch protection rules in GitHub to enforce the development workflow and prevent accidental production breaks.

---

## Why Branch Protection?

Branch protection rules add an extra layer of safety by:
- Preventing force pushes to `main`
- Requiring pull requests before merging
- Requiring status checks to pass
- Preventing direct commits to `main`

Even if you work solo, these rules help prevent mistakes.

---

## Setting Up Branch Protection

### Step 1: Navigate to Repository Settings

1. Go to your GitHub repository
2. Click **Settings** (top menu)
3. Click **Branches** (left sidebar)

### Step 2: Add Branch Protection Rule

1. Under **Branch protection rules**, click **Add rule**
2. In **Branch name pattern**, enter: `main`
3. Configure the following settings:

---

## Recommended Protection Settings

### ✅ Require a pull request before merging

**Settings:**
- ✅ Require approvals: **1** (even if it's your own PR, this forces you to review)
- ✅ Dismiss stale pull request approvals when new commits are pushed: **Enabled**
- ✅ Require review from Code Owners: **Optional** (enable if you have CODEOWNERS file)

**Why:** Forces you to review your own changes before merging, catching issues

---

### ✅ Require status checks to pass before merging

**Settings:**
- ✅ Require branches to be up to date before merging: **Enabled**

**Status checks to require:**
- Add any CI/CD checks you have (if using GitHub Actions)
- For now, this is optional but recommended if you add CI later

**Why:** Ensures code builds and tests pass before merging

---

### ✅ Require conversation resolution before merging

**Settings:**
- ✅ Require conversation resolution before merging: **Enabled**

**Why:** Ensures any comments or issues in the PR are addressed

---

### ✅ Restrict who can push to matching branches

**Settings:**
- ✅ Restrict pushes that create files matching: **Leave empty** (or add patterns if needed)

**Why:** Prevents accidental direct commits

---

### ✅ Do not allow bypassing the above settings

**Settings:**
- ✅ Do not allow bypassing the above settings: **Enabled**

**Why:** Prevents accidentally skipping the protection rules

---

### ✅ Allow force pushes

**Settings:**
- ❌ **DISABLED** - Do not allow force pushes

**Why:** Prevents losing history or breaking things

---

### ✅ Allow deletions

**Settings:**
- ❌ **DISABLED** - Do not allow deletions

**Why:** Prevents accidentally deleting the main branch

---

## Complete Protection Rule Summary

Here's what your branch protection rule should look like:

```
Branch name pattern: main

✅ Require a pull request before merging
   - Require approvals: 1
   - Dismiss stale approvals: Yes
   
✅ Require status checks to pass before merging
   - Require branches to be up to date: Yes
   
✅ Require conversation resolution before merging: Yes

✅ Restrict pushes that create files: (empty or specific patterns)

✅ Do not allow bypassing: Yes

❌ Allow force pushes: No

❌ Allow deletions: No
```

---

## Alternative: Lighter Protection (If You Prefer)

If you want less strict rules, you can use:

```
Branch name pattern: main

✅ Require a pull request before merging
   - Require approvals: 0 (just require PR, not approval)
   
✅ Do not allow bypassing: Yes

❌ Allow force pushes: No
```

This still prevents direct commits and force pushes, but doesn't require approvals.

---

## Testing Your Protection Rules

### Test 1: Try to Push Directly to Main

```bash
git checkout main
# Make a change
git commit -m "Test direct commit"
git push origin main
```

**Expected:** Should be blocked or require a PR

### Test 2: Try to Force Push

```bash
git push --force origin main
```

**Expected:** Should be blocked

### Test 3: Create PR and Merge

1. Create a feature branch
2. Make changes
3. Push branch
4. Create PR
5. Merge PR

**Expected:** Should work normally

---

## Working with Protected Branches

### Normal Workflow (With Protection)

1. Create feature branch: `git checkout -b feat/my-feature`
2. Make changes and commit
3. Push branch: `git push -u origin feat/my-feature`
4. Create PR on GitHub
5. Review and merge PR (GitHub will enforce rules)
6. Pull main: `git checkout main && git pull`
7. Deploy: `./deploy.sh --production`

### If You Need to Bypass (Emergency Only)

If you absolutely must bypass protection in an emergency:

1. Go to repository **Settings** → **Branches**
2. Temporarily disable protection (not recommended!)
3. Make your emergency fix
4. Re-enable protection immediately
5. Document why you bypassed

**Better approach:** Use a hotfix branch and fast-track the PR

---

## Additional GitHub Features

### CODEOWNERS File (Optional)

Create `.github/CODEOWNERS` to automatically request reviews:

```
# Require review from specific users
* @your-username
```

### GitHub Actions (Optional)

Add CI/CD checks that run on every PR:

```yaml
# .github/workflows/ci.yml
name: CI
on: [pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build
      - run: npm run lint
```

This adds automatic build/lint checks to your PRs.

---

## Troubleshooting

### "Cannot push to main"

**Cause:** Branch protection is working!

**Solution:** Create a feature branch and use a PR

### "PR cannot be merged - status checks pending"

**Cause:** Status checks haven't completed yet

**Solution:** Wait for checks to complete, or check if there are errors

### "PR cannot be merged - requires approval"

**Cause:** Branch protection requires approval

**Solution:** Approve your own PR (self-review is fine)

---

## Related Documentation

- [Development Workflow](Development-Workflow.md) - Complete workflow guide
- [Workflow Rules](Workflow-Rules.md) - Enforced rules and guidelines
- [Quick Reference](Quick-Reference.md) - Quick command reference
