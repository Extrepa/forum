# Devlog Edit Post Fixes - Action Plan

**Date:** 2026-01-22  
**Branch:** `fix/devlog-edit-improvements` (to be created)

## Issues Identified

### Issue 1: Edit Post Not Updating / Password Error
**Problem:** When clicking "Update Post" on a devlog post, it doesn't update and shows "Set your password to continue posting" error message.

**Root Cause Analysis:**
- The API route (`/api/devlog/[id]/route.js`) correctly checks for password (lines 42-45)
- The `canEdit` variable checks `!user.must_change_password && !!user.password_hash`
- The edit panel is shown when `canEdit` is true, but the API might be getting stale user data
- Need to verify user session state is consistent between page render and API call

**Files to Modify:**
- `src/app/devlog/[id]/page.js` - Ensure edit panel only shows when user can actually edit
- `src/app/api/devlog/[id]/route.js` - Verify password check logic
- `src/components/DevLogForm.js` - Check form submission handling

**Required Changes:**
1. Ensure `canEdit` check is accurate and edit panel only renders when user can edit
2. Verify API route is getting correct user session data
3. Add better error handling/validation
4. Consider adding client-side validation before form submission

### Issue 2: Lock Comments Button Placement
**Problem:** "Lock comments" button is currently inside the edit panel, but should be in the top right corner alongside Edit/Delete buttons.

**Current Location:** Inside edit panel (`src/app/devlog/[id]/page.js` lines 354-361)

**Required Changes:**
1. Move Lock Comments button to `PageTopRow`'s `right` prop
2. Only show for admins (`isAdmin` check)
3. Position it alongside EditPostButtonWithPanel and DeletePostButton
4. Remove from inside edit panel

**Files to Modify:**
- `src/app/devlog/[id]/page.js` - Move lock button to PageTopRow

## Implementation Plan

### Step 1: Fix Lock Comments Button Placement
**Priority:** High (UI improvement)

1. **File:** `src/app/devlog/[id]/page.js`
   - Remove lock button from edit panel (lines 354-361)
   - Add lock button to `PageTopRow`'s `right` prop
   - Create a LockCommentsButton component or inline form
   - Ensure it only shows for admins

**Expected Result:** Lock Comments button appears in top right corner, only visible to admins

### Step 2: Fix Edit Post Update Issue
**Priority:** Critical (functionality broken)

1. **Investigation:**
   - Check if user session is being refreshed properly
   - Verify `getSessionUserWithRole` vs `getSessionUser` consistency
   - Check if password_hash is being set correctly

2. **File:** `src/app/api/devlog/[id]/route.js`
   - Verify password check logic (lines 42-45)
   - Add logging/debugging if needed
   - Ensure user session is fresh

3. **File:** `src/app/devlog/[id]/page.js`
   - Double-check `canEdit` logic (lines 246-250)
   - Ensure edit panel only shows when `canEdit` is true
   - Consider adding client-side validation

4. **File:** `src/components/DevLogForm.js`
   - Verify form action is correct
   - Check if form data is being submitted properly

**Expected Result:** Edit post updates successfully without password errors

### Step 3: Improve Error Handling
**Priority:** Medium (UX improvement)

1. Add better error messages
2. Show password setup link if password is missing
3. Prevent form submission if user can't edit

## Testing Checklist

- [ ] Lock Comments button appears in top right corner (admin only)
- [ ] Lock Comments button works correctly
- [ ] Edit Post form updates successfully
- [ ] No "Set your password" error when user has password set
- [ ] Edit panel only shows when user can edit
- [ ] Password error shows appropriate message/link if password is missing

## Branch Workflow

1. Create branch: `git checkout -b fix/devlog-edit-improvements`
2. Make changes
3. Test locally
4. Commit: `git commit -m "Fix devlog edit post update and move lock button to top right"`
5. Push: `git push -u origin fix/devlog-edit-improvements`
6. Deploy preview: `./deploy.sh --preview "Fix devlog edit issues"`
7. Test preview
8. Create PR
9. Merge to main
10. Deploy to production

## Notes

- The password check might be a false positive if user's session state is stale
- Consider checking if `must_change_password` flag is being set incorrectly
- Lock button should match styling of other top-right buttons
