# GitHub Permissions Troubleshooting Guide

This guide helps you verify your GitHub permissions and resolve issues with approving your own pull requests.

## Repository
- **URL**: https://github.com/Extrepa/forum
- **Current Branch**: `feat/auth-overhaul-and-post-controls`

---

## Step 1: Verify Your Repository Role

1. Go to: https://github.com/Extrepa/forum
2. Click **Settings** (top menu)
3. Click **Collaborators and teams** (left sidebar)
4. Check your role:
   - **Owner** - Full access (you should be able to approve)
   - **Admin** - Full access (you should be able to approve)
   - **Write** - Limited access (may not be able to approve)
   - **Read** - No write access

**If you're not Owner/Admin:**
- You may need to check if you're logged into the correct GitHub account
- If this is your repository, you should be Owner

---

## Step 2: Check Branch Protection Rules

1. Go to: https://github.com/Extrepa/forum/settings/branches
2. Look for branch protection rules (especially for `main` branch)
3. Check these specific settings:

### Setting: "Require approvals"
- If set to **1** or more, you need approvals
- **Problem**: Some branch protection rules prevent self-approval
- **Solution**: See Step 3 below

### Setting: "Restrict who can dismiss pull request reviews"
- If enabled, check who's allowed to dismiss reviews
- Make sure your username is included

### Setting: "Do not allow bypassing the above settings"
- If enabled, even admins can't bypass
- This is good for security, but may block self-approval

---

## Step 3: Fix Self-Approval Issues

### Option A: Allow Self-Approval (Recommended for Solo Work)

1. Go to: https://github.com/Extrepa/forum/settings/branches
2. Click on the branch protection rule for `main`
3. Under **"Require a pull request before merging"**:
   - ✅ Keep **"Require approvals"** enabled
   - ✅ Set to **1** approval
   - ✅ **Enable**: "Allow specified actors to bypass required pull requests"
   - Add yourself to the bypass list (if available)
   - OR: **Disable**: "Do not allow bypassing the above settings" (temporarily)

**Note**: GitHub's branch protection doesn't always allow self-approval by default. You may need to:

### Option B: Use Alternative Approval Method

If self-approval is blocked, you can:

1. **Temporarily reduce requirements**:
   - Set "Require approvals" to **0**
   - This still requires a PR, but not an approval
   - You can still review your own PR before merging

2. **Use a second account** (if you have one):
   - Create PR from your main account
   - Approve from a second account
   - Merge from main account

3. **Disable protection temporarily** (not recommended):
   - Only for emergency fixes
   - Re-enable immediately after

---

## Step 4: Check for CODEOWNERS File

1. Check if `.github/CODEOWNERS` exists in your repo
2. If it exists, it may require specific reviewers
3. You can:
   - Add yourself to CODEOWNERS
   - Or remove CODEOWNERS requirement from branch protection

---

## Step 5: Verify via GitHub API (Advanced)

You can check your permissions programmatically:

```bash
# Check your repository permissions
curl -H "Authorization: token YOUR_GITHUB_TOKEN" \
  https://api.github.com/repos/Extrepa/forum/collaborators/Extrepa/permission

# Check branch protection rules
curl -H "Authorization: token YOUR_GITHUB_TOKEN" \
  https://api.github.com/repos/Extrepa/forum/branches/main/protection
```

---

## Quick Fix: Recommended Settings for Solo Development

If you're working solo and want protection but need to approve your own PRs:

```
Branch name pattern: main

✅ Require a pull request before merging
   - Require approvals: 0  ← Change from 1 to 0
   - Dismiss stale approvals: Yes
   
✅ Require status checks to pass before merging
   - Require branches to be up to date: Yes
   
✅ Require conversation resolution before merging: Yes

✅ Do not allow bypassing: Yes

❌ Allow force pushes: No
❌ Allow deletions: No
```

**Why this works:**
- Still requires PR (prevents direct commits)
- No approval needed (you can still review, just not required)
- Still prevents force pushes and deletions
- Still requires status checks

---

## Alternative: Use GitHub CLI

If you have GitHub CLI installed:

```bash
# Check your permissions
gh api repos/Extrepa/forum/collaborators/Extrepa/permission

# View branch protection
gh api repos/Extrepa/forum/branches/main/protection

# Approve PR via CLI (if permissions allow)
gh pr review <PR_NUMBER> --approve
```

---

## Common Issues and Solutions

### Issue: "You cannot approve your own pull request"
**Cause**: Branch protection rule prevents self-approval
**Solution**: 
- Set "Require approvals" to 0, OR
- Temporarily disable "Do not allow bypassing"

### Issue: "Required status check is pending"
**Cause**: CI/CD checks haven't completed
**Solution**: Wait for checks to complete or check for errors

### Issue: "Merging is blocked"
**Cause**: Multiple protection rules blocking merge
**Solution**: Check all protection settings and resolve each blocker

### Issue: "You don't have permission to merge"
**Cause**: Your role doesn't have merge permissions
**Solution**: Check your collaborator role (should be Owner/Admin)

---

## Next Steps

1. **Verify your role** (Step 1)
2. **Check branch protection** (Step 2)
3. **Adjust settings** (Step 3, Option A or B)
4. **Test with a new PR** to confirm it works

---

## Related Documentation

- [GitHub Setup Guide](./GitHub-Setup.md) - Complete branch protection setup
- [Branch Workflow Guide](./Branch-Workflow-Complete-Guide.md) - Development workflow
