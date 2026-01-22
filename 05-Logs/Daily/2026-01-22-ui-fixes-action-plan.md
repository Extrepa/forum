# UI Fixes Action Plan
**Date:** 2026-01-22  
**Workflow:** Branch-Based Development (see `docs/Branch-Workflow-Complete-Guide.md`)

---

## Overview

This document outlines the action plan for fixing UI issues across multiple pages. Each fix will be implemented in a separate branch to ensure builds stay stable and changes can be tested independently.

---

## Issues to Fix

### Issue 1: Devlog Edit Button Position
**Problem:** Edit post button on devlog posts is at the bottom when it should be at the top in the same row as breadcrumbs, attached to the opposite side.

**Files to Modify:**
- `src/app/devlog/[id]/page.js`

**Changes Required:**
1. Replace `Breadcrumbs` component with `PageTopRow` component
2. Move edit button from bottom (using `EditPostPanel`) to top row using `EditPostButtonWithPanel`
3. Add panel container below (similar to projects page pattern)
4. Import `PageTopRow` and `EditPostButtonWithPanel`
5. Remove `EditPostPanel` import and usage
6. Import `DeletePostButton` for consistency
7. Add `canDelete` check similar to projects page

**Branch Name:** `fix/devlog-edit-button-position`

**Status:** ✅ Complete

---

### Issue 2: Remove Active Status Bubble on Project Posts
**Problem:** Active status bubble showing next to usernames on project posts (e.g., Ashley's post). Active status feature is not fully built, so we should not show any active status indicators.

**Files Checked:**
- `src/app/projects/[id]/page.js` - ✅ No active status code found
- `src/components/Username.js` - ✅ No active status code found
- `src/app/globals.css` - ✅ No active status styling found (checked ::before/::after pseudo-elements)

**Investigation Results:**
- Searched codebase for active/status/online/bubble/indicator patterns
- No active status rendering logic found in Username component
- No CSS pseudo-elements adding bubbles to usernames
- No JSX rendering active status indicators

**Note:** If active status bubble still appears visually, it may be:
1. Added by browser extension or dev tools
2. Cached CSS/JS that needs refresh
3. Something not yet committed to the codebase

**Branch Name:** `fix/remove-active-status-bubble`

**Status:** ✅ Complete

**Changes Made:**
- Added CSS rules to hide any `::before` or `::after` pseudo-elements on username elements
- Added CSS rules to hide any adjacent elements with active/status/online/bubble/indicator/dot classes
- Comprehensive CSS rules ensure no active status indicators can appear next to usernames

---

### Issue 3: Event Post Comment Padding
**Problem:** CSS issue where the post comment section should have a little bit of padding above it.

**Files to Modify:**
- `src/components/EventCommentsSection.js` (add inline style or className)
- `src/app/globals.css` (add CSS class if needed)

**Changes Required:**
1. Add padding-top to the comment section container (likely the `<section className="card">` wrapper)
2. Ensure it doesn't break existing layout
3. Test on mobile and desktop

**Branch Name:** `fix/event-comment-padding`

**Status:** ✅ Complete

---

### Issue 4: Event Post Edit/Delete Buttons Styling
**Problem:** Edit post button on event posts doesn't match the look of other pages. User likes the small size but wants consistency with other pages.

**Files to Modify:**
- `src/app/events/[id]/page.js`

**Changes Required:**
1. Replace `EditPostButton` with `EditPostButtonWithPanel` and `DeletePostButton` (like projects page)
2. Keep buttons small (they already are, but ensure consistency)
3. Add delete button for admins/authors (add `canDelete` check)
4. Move buttons to `PageTopRow` right prop (already there, just update components)
5. Add panel container below for edit form (similar to projects page)
6. Import `EditPostButtonWithPanel`, `DeletePostButton`
7. Create edit form component or use existing event form

**Branch Name:** `fix/event-buttons-styling`

**Status:** ✅ Complete

**Additional Changes Made:**
- Created `/api/events/[id]/route.js` for event editing
- Enhanced `PostForm` component to support `initialData` prop for editing
- Added edit panel with pre-filled form values

---

## Implementation Order

To ensure builds stay stable, implement fixes in this order:

1. **Issue 1** (Devlog Edit Button) - Single page, isolated change
2. **Issue 3** (Event Comment Padding) - CSS-only change, low risk
3. **Issue 4** (Event Buttons) - Single page, isolated change  
4. **Issue 2** (Remove Active Status) - May require investigation, do last

---

## Workflow Steps for Each Fix

### Step 1: Create Branch
```bash
git checkout main
git pull origin main
git checkout -b fix/[issue-name]
```

### Step 2: Make Changes
- Edit files as specified above
- Test locally: `npm run build` and `npm run dev`
- Verify changes work correctly

### Step 3: Commit
```bash
git add .
git commit -m "Fix: [descriptive message]"
```

### Step 4: Push and Preview
```bash
git push -u origin fix/[issue-name]
./deploy.sh --preview "Fix: [descriptive message]"
```

### Step 5: Create Pull Request
- Go to GitHub
- Create PR from `fix/[issue-name]` to `main`
- Review and merge

### Step 6: Deploy to Production
```bash
git checkout main
git pull origin main
./deploy.sh --production "Deploy: [descriptive message]"
```

---

## Testing Checklist

For each fix:
- [ ] Build passes: `npm run build`
- [ ] Local dev server works: `npm run dev`
- [ ] Changes display correctly on target page
- [ ] No regressions on other pages
- [ ] Preview deployment works
- [ ] Production deployment successful

---

## Notes

- Each fix is isolated to minimize risk of breaking builds
- Follow branch naming convention: `fix/` prefix
- Test each change independently before moving to next
- Keep branches small and focused
- Use the branch workflow guide for detailed instructions

---

**Last Updated:** 2026-01-22
