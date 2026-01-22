# Workflow Rules

This document outlines the **enforced rules** for development on the Errl Forum project. These rules are designed to prevent the issues we experienced with the homepage changes incident.

---

## Enforced Rules

### Rule 1: No Direct Commits to Main

**Enforcement:** `deploy.sh` checks current branch and blocks execution if on `main`

**Exception:** Production deployments from `main` are allowed with `--production` flag and confirmation prompt

**Why:** Prevents accidentally breaking production with untested changes

**How to comply:**
- Always create a feature branch before making changes
- Use `git checkout -b feat/your-feature` before starting work

---

### Rule 2: Branch Naming Convention

**Enforcement:** `deploy.sh` validates branch name before proceeding

**Required format:** `{type}/{description}`

**Valid types:**
- `feat/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `chore/` - Tooling/config changes

**Examples:**
- ✅ `feat/homepage-stats`
- ✅ `fix/hydration-issue`
- ✅ `refactor/api-routes`
- ✅ `chore/update-deps`
- ❌ `my-feature` (missing type prefix)
- ❌ `feature/homepage` (wrong type)
- ❌ `homepage-stats` (missing type prefix)

**Why:** Makes it easy to see what type of change a branch contains and helps organize work

---

### Rule 3: Build Verification

**Enforcement:** `deploy.sh` runs `npm run build` before allowing deployment

**Requirement:** Build must succeed without errors

**Why:** Catches build errors before they reach production

**What gets checked:**
- Next.js compilation
- Type checking (if applicable)
- Build artifacts generation

**If build fails:**
- Fix errors first
- Run `npm run build` manually to see detailed errors
- Try deploying again after fixes

---

### Rule 4: Preview Before Production

**Enforcement:** Feature branches can only do preview deployments

**Requirement:** Production deployment only from `main` branch with `--production` flag

**Workflow:**
1. Work on feature branch
2. Deploy preview: `./deploy.sh --preview`
3. Test preview deployment
4. Merge PR to main
5. Deploy production: `./deploy.sh --production`

**Why:** Ensures changes are tested before going live

---

### Rule 5: Incremental Testing

**Requirement:** Test each change before committing

**Best practices:**
- Run `npm run dev` to test locally
- Run `npm run build` before pushing
- Test preview deployment before merging
- Make small, testable changes

**Why:** Catches issues early, before they compound

---

## Guidelines (Not Enforced, But Recommended)

### Guideline 1: Descriptive Commit Messages

**Good examples:**
- `Fix header dropdown navigation`
- `Add compact thread row layout`
- `Integrate RSVP checkbox into comment form`

**Bad examples:**
- `update stuff`
- `changes`
- `fix`

**Why:** Makes it easier to understand what changed and when

---

### Guideline 2: One Feature Per Branch

**Recommendation:** Keep branches focused on a single feature or fix

**Why:** Easier to review, test, and rollback if needed

**Exception:** Small related changes can go in the same branch

---

### Guideline 3: Test on Preview Before Merging

**Recommendation:** Always test preview deployment before merging to main

**How:**
1. Push your branch
2. Run `./deploy.sh --preview`
3. Test the preview URL
4. Fix any issues
5. Merge when ready

**Why:** Catches deployment issues before they affect production

---

### Guideline 4: Never Force Push to Main

**Recommendation:** Never use `git push --force` on `main` branch

**Why:** Can lose history and break things for others

**Exception:** Only in extreme emergencies, and document why

---

### Guideline 5: Document Known Issues

**Recommendation:** Document harmless errors separately from real issues

**Example:** React error #418 on homepage/feed is harmless and documented

**Why:** Prevents confusion and unnecessary fixes

---

## Breaking the Rules

### Emergency Situations

If you need to break a rule in an emergency:

1. **Document why** - Add a note explaining the exception
2. **Fix immediately** - Don't leave production in a broken state
3. **Follow up** - Create a proper branch and PR to fix it properly

### Override Methods

**If you absolutely must commit to main directly:**

```bash
# This bypasses deploy.sh checks
git add .
git commit -m "Emergency fix: [reason]"
git push
npm run build:cf
npm run deploy
```

**Warning:** Only do this in true emergencies, and document why!

---

## Rule Enforcement

### Automated Enforcement

- **`deploy.sh`** - Enforces branch rules, naming conventions, and build verification
- **Git hooks** (optional) - Can add pre-commit checks (see GitHub Setup doc)

### Manual Enforcement

- **Code reviews** - Review your own PRs before merging
- **Testing checklist** - Follow the testing requirements before merging

---

## Consequences of Breaking Rules

### If You Commit Directly to Main

- `deploy.sh` will block the deployment
- You'll need to create a branch and start over
- This prevents breaking production

### If You Use Wrong Branch Name

- `deploy.sh` will block the deployment
- You'll need to rename your branch
- Use: `git branch -m feat/correct-name`

### If Build Fails

- `deploy.sh` will stop before deploying
- Fix build errors first
- Prevents broken code from reaching production

---

## Getting Help

If you're unsure about a rule:

1. Check this document
2. Check [Development-Workflow.md](Development-Workflow.md)
3. Check [Quick-Reference.md](Quick-Reference.md)
4. When in doubt, create a branch - it's always safe!

---

## Related Documentation

- [Development Workflow](Development-Workflow.md) - Complete workflow guide
- [GitHub Setup](GitHub-Setup.md) - GitHub branch protection setup
- [Quick Reference](Quick-Reference.md) - Quick command reference
