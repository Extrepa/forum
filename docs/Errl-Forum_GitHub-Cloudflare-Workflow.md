# Errl Forum — GitHub + Cloudflare Deployment Workflow (Safe + Repeatable)

This is a **simple, reliable workflow** for making changes to your forum without accidentally shipping chaos to the live site.

The core idea:

✅ **`main` is production**  
✅ **feature branches are experiments**  
✅ **Cloudflare preview deployments let you test before merging**  
✅ **merge to `main` only when the preview looks good**

---

## 1) Recommended Branch Strategy

### ✅ `main` = Production (live site)
- Anything on `main` is what you want the world to see.
- **Production deployment should build from `main` only.**

### ✅ Feature branches = isolated work
Use branches for changes you’re building/testing:

Examples:
- `feat/event-rsvp-redesign`
- `fix/header-dropdown-navigation`
- `refactor/thread-list-density`
- `feat/lore-memories-merge`

**Why it matters:**  
Branches let you work freely without breaking the live site.

---

## 2) Recommended Deployment Strategy

### ✅ Production deploy
- Triggered by: **push/merge into `main`**
- Goal: update the live site

### ✅ Preview deploy
- Triggered by: **branch pushes** and/or **Pull Requests**
- Goal: test in a “real deployed environment” before shipping

Cloudflare Pages supports preview deployments really well:
- Each PR/branch gets a URL (like a mini temporary site)
- Perfect for checking mobile + routing + UI + flows

---

## 3) The Day-to-Day Workflow (The “Safe Loop”)

### Step 1: Pull the latest `main`
```bash
git checkout main
git pull
```

### Step 2: Create a feature branch
```bash
git checkout -b feat/event-ui
```

### Step 3: Make changes locally + commit in small chunks
```bash
git add .
git commit -m "Add calendar badge to event posts"
```

### Step 4: Push your branch
```bash
git push -u origin feat/event-ui
```

### Step 5: Open a Pull Request (PR)
- GitHub PR is your “merge gate”
- Cloudflare builds a **Preview Deployment**
- You test using the preview URL

### Step 6: Merge PR → `main`
- This triggers production deployment
- Your live site updates safely

---

## 4) The Big Question: “Should I branch + preview deploy before main?”

✅ **Yes. That’s the ideal flow.**

In practice:

**Branch → Preview Deploy → Test → Merge → Production Deploy**

This is the cleanest and safest way to do major upgrades.

---

## 5) When to Add a `staging` Branch (Optional)

If your changes are **truly massive** or need to land together, you can add a second environment:

- `main` → production
- `staging` → “near-prod” testing environment
- feature branches → preview deployments

### When staging helps
- You have multiple big features that depend on each other
- You want to merge things gradually but only “release” once it’s stable
- You want a permanent non-production test environment

### When you can skip staging
- You’re working solo
- Your PR preview deployments are enough
- Your changes can be shipped in smaller steps

---

## 6) Common Gotchas (Stuff That Bites People)

### 1) Database / schema changes
If your forum has a database:
- Preview deployments might have different environment variables
- You do **NOT** want preview builds writing to production DB

✅ Best practice:
- Preview deployments → **staging/dev DB**
- Production → **production DB**

### 2) Environment Variables
You’ll typically have different values for:
- Preview (staging keys, test services)
- Production (real keys)

✅ Best practice:
- Configure Cloudflare env vars per environment
- Never hardcode secrets into the repo

### 3) Risky migrations
For big changes:
- keep schema migrations incremental
- avoid “everything breaks at once” changes
- prefer reversible steps when possible

### 4) Feature flags (super useful)
For risky features:
- merge the code disabled
- enable it later with a toggle/flag

✅ This lets you ship “safely” without instantly turning it on.

---

## 7) Preview Testing Checklist (Do This Every Time)

On the Cloudflare preview URL, test:

### UI + navigation
- Header links work (and don’t just close dropdown)
- Breadcrumbs / section navigation
- Mobile layout (small viewport)

### Core interactions
- Create post
- Edit post
- Delete post
- Move post (and ensure no weird stubs remain)

### Event posts (if relevant)
- Calendar date UI displays correctly
- RSVP/comment flow works
- RSVP list formatting doesn’t overflow on mobile

### Admin/mod (permissions)
- Admin can edit others’ posts
- Non-admin cannot access admin controls
- Locked posts behave correctly

---

## 8) Suggested Commit + PR Habits (Keeps You Sane)

### Commit small + meaningful
Bad:
- `update stuff`
- `changes`

Good:
- `Fix header dropdown navigation`
- `Add compact thread row layout`
- `Integrate RSVP checkbox into comment form`

### PR title should match the feature
Example:
- **Feat: Event post redesign (calendar + RSVP in comments)**

### Use PR descriptions like release notes
Write what changed + how to test it.

---

## 9) Rollback / “Oh No” Plan

If you merge something and production breaks:

### Option A: Revert the PR in GitHub
This is the cleanest “undo”.

### Option B: Hotfix branch
Make a fast fix:
- branch → PR → preview → merge

✅ Keep it boring. Fast boring wins.

---

## 10) The TL;DR “Best Practice Setup”

- `main` = production
- create feature branches for work
- push branches → preview deploy on Cloudflare
- PR → test preview URL
- merge PR → deploy to production

**Branch → Preview → Test → Merge → Live**

That’s the loop.

---

## 11) Extra Tip: Naming Conventions That Don’t Suck

- `feat/...` for new features
- `fix/...` for bug fixes
- `refactor/...` for internal cleanup
- `chore/...` for tooling/config

Examples:
- `feat/event-image-upload`
- `fix/mobile-nav-overflow`
- `refactor/thread-card-clickable`
- `chore/cloudflare-env-vars`

---

## Notes (Errl-style philosophy)
Shipping code is like releasing a goo creature into the wild:

- preview deploys = your “terrarium test”
- production deploys = letting it roam the festival grounds

Keep the goo contained until it behaves 🫠💧
