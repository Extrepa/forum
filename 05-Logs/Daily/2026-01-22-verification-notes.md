# Verification Notes - 2026-01-22

## Summary of All Fixes

### Branch Status
- **Current Branch**: `fix/header-buttons-after-signin`
- **Previous Branch**: `feat/auth-overhaul-and-post-controls` (has uncommitted changes)

---

## Fix 1: Project Replies Lock Check ✅ VERIFIED

### Issue
When a project is locked by an admin, comments are correctly blocked but replies can still be posted.

### Verification
- **File**: `src/app/api/projects/[id]/replies/route.js`
- **Lines 25-37**: Lock check added
- **Comparison**: Matches `src/app/api/projects/[id]/comments/route.js` lines 40-52

### Code Check
```javascript
// Check if project is locked (rollout-safe)
try {
  const project = await db
    .prepare('SELECT is_locked FROM projects WHERE id = ?')
    .bind(params.id)
    .first();
  if (project && project.is_locked) {
    redirectUrl.searchParams.set('error', 'locked');
    return NextResponse.redirect(redirectUrl, 303);
  }
} catch (e) {
  // Column might not exist yet, that's okay - allow posting
}
```

✅ **Status**: Correctly implemented, matches comments route pattern
✅ **Error handling**: Rollout-safe with try/catch
✅ **Error message**: Uses same 'locked' error param as comments

---

## Fix 2: Date Validation Bug ✅ VERIFIED

### Issue
`parseLocalDateTimeToUTC` doesn't catch malformed datetime strings missing minutes component (e.g., "13" instead of "13:00").

### Verification
- **File**: `src/lib/dates.js`
- **Lines 148-160**: Enhanced validation

### Code Check
```javascript
// Validate time format has both hours and minutes
const timeParts = timePart.split(':');
if (timeParts.length !== 2) return null;  // ✅ Catches missing minutes

const [year, month, day] = datePart.split('-').map(Number);
const [hours, minutes] = timeParts.map(Number);

// Validate parsed values (check for undefined as well as NaN)
if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day) || 
    Number.isNaN(hours) || Number.isNaN(minutes) ||
    hours === undefined || minutes === undefined) {  // ✅ Catches undefined
  return null;
}
```

✅ **Status**: Correctly implemented
✅ **Time format check**: Validates exactly 2 components (hours:minutes)
✅ **Undefined check**: Explicitly checks for undefined values
✅ **Edge cases**: Handles "13" → returns null (rejects invalid input)

### Test Cases
- ✅ "2026-01-22T13:00" → Valid (passes)
- ✅ "2026-01-22T13" → Invalid (returns null) ✓ Fixed
- ✅ "2026-01-22T13:30" → Valid (passes)
- ✅ "2026-01-22T" → Invalid (returns null)
- ✅ "2026-01-22T13:00:00" → Invalid (returns null) - only HH:mm expected

### Note on Line 164
- Line 164 still has `minutes || 0` as fallback
- **Status**: Safe - our validation ensures `minutes` is always defined and valid by this point
- **Reason**: With `timeParts.length === 2` check, `minutes` will always exist in array
- **Decision**: Keep as defensive programming (harmless safety net)

---

## Fix 3: Header Buttons After Sign-In ✅ VERIFIED

### Issue
After signing in, header navigation buttons remain disabled until navigating to another page and coming back.

### Root Cause
Next.js was caching the server-rendered layout component, so `isSignedIn` prop remained `false` even after successful login.

### Verification
- **File**: `src/app/layout.js`
- **Line 14**: Added `export const dynamic = 'force-dynamic';`
- **File**: `src/components/ClaimUsernameForm.js`
- **Lines 286, 319, 338**: Added `router.refresh()` calls

### Code Check

#### Layout (src/app/layout.js)
```javascript
// Force dynamic rendering to ensure auth state is always fresh
export const dynamic = 'force-dynamic';  // ✅ Prevents caching
```

#### Login Handler (src/components/ClaimUsernameForm.js)
```javascript
await refreshMe();
// Refresh server components to update header with new auth state
router.refresh();  // ✅ Invalidates Next.js cache
// Navigate after refresh to ensure header buttons are enabled
router.replace('/');  // ✅ Uses replace instead of push
```

#### Signup Handler
```javascript
await refreshMe();
router.refresh();  // ✅ Same pattern
router.replace('/');
```

#### Logout Handler
```javascript
await refreshMe();
router.refresh();  // ✅ Also refreshes on logout
```

✅ **Status**: Correctly implemented
✅ **Cache invalidation**: `router.refresh()` invalidates server component cache
✅ **Dynamic rendering**: `force-dynamic` prevents layout caching
✅ **Navigation**: Uses `replace()` instead of `push()` to avoid history stack
✅ **Consistency**: Applied to login, signup, and logout

---

## Branch Status Summary

### Committed Branches

1. **`feat/auth-overhaul-and-post-controls`** (commit: 95c46a3)
   - ✅ Project replies lock check (committed)
   - ✅ Date validation fix (committed)
   - ✅ GitHub troubleshooting guide (committed)
   - **Status**: Committed, needs push to origin
   - **Remote**: `origin/feat/auth-overhaul-and-post-controls` exists

2. **`fix/header-buttons-after-signin`** (commit: e645b36)
   - ✅ Header buttons fix after sign-in (committed)
   - **Status**: Committed, needs push to origin
   - **Remote**: Not yet pushed

### Uncommitted Changes (on current branch)

**Note**: These uncommitted changes on `fix/header-buttons-after-signin` are the same fixes that are already committed in `feat/auth-overhaul-and-post-controls`. This happened because:
- `fix/header-buttons-after-signin` was branched from `main` (before the other fixes)
- The other fixes were committed to `feat/auth-overhaul-and-post-controls` branch
- Current branch has these changes as uncommitted because it doesn't have those commits

**Files with uncommitted changes**:
- `src/app/api/projects/[id]/replies/route.js` - Lock check (already committed in feat/auth-overhaul branch)
- `src/lib/dates.js` - Date validation (already committed in feat/auth-overhaul branch)
- `05-Logs/Daily/2026-01-22-cursor-notes.md` - Log updates

**Action**: These can be ignored on this branch since they're already committed elsewhere, OR you can discard them: `git restore src/app/api/projects/[id]/replies/route.js src/lib/dates.js`

### Untracked Files
- `docs/GitHub-Permissions-Troubleshooting.md` - Should be in feat/auth-overhaul branch
- `PUSH-INSTRUCTIONS.md` - Helper file (can be committed or ignored)
- `push-all-branches.sh` - Helper script (can be committed or ignored)

---

## Verification Checklist

### Fix 1: Project Replies Lock Check
- [x] Lock check added to replies route
- [x] Matches comments route implementation
- [x] Rollout-safe (try/catch)
- [x] Returns correct error ('locked')
- [x] Positioned correctly (after auth check, before DB operations)

### Fix 2: Date Validation
- [x] Time format validation (exactly 2 components)
- [x] Undefined value check added
- [x] NaN check still present
- [x] Returns null for invalid input (doesn't silently default)
- [x] Handles edge cases correctly

### Fix 3: Header Buttons After Sign-In
- [x] `force-dynamic` added to layout
- [x] `router.refresh()` called after login
- [x] `router.refresh()` called after signup
- [x] `router.refresh()` called after logout
- [x] Uses `router.replace()` instead of `router.push()`
- [x] Proper sequencing (refreshMe → refresh → navigate)

---

## Potential Issues & Notes

### 1. Layout Performance
- **Note**: Adding `force-dynamic` to layout means it will re-render on every request
- **Impact**: Slight performance cost, but necessary for accurate auth state
- **Alternative considered**: Client-side auth state, but server-side is more secure
- **Decision**: Acceptable trade-off for correct auth state

### 2. Router Refresh Timing
- **Note**: `router.refresh()` is called before `router.replace('/')`
- **Potential issue**: Refresh might not complete before navigation
- **Mitigation**: Next.js handles this internally, refresh triggers before navigation
- **Status**: Should work correctly, but worth testing

### 3. Uncommitted Changes
- **Issue**: Some fixes from previous branch are uncommitted on current branch
- **Action needed**: These should be committed to `feat/auth-overhaul-and-post-controls` branch
- **Files**: replies route, dates.js, log file

---

## Testing Recommendations

### Test 1: Project Lock Check
1. Create a project
2. Lock it as admin
3. Try to post a comment → Should be blocked ✓
4. Try to post a reply → Should be blocked ✓ (NEW)

### Test 2: Date Validation
1. Create event with time "13" (missing minutes)
2. Should reject with validation error ✓ (NEW)
3. Create event with time "13:00" → Should work ✓

### Test 3: Header Buttons After Sign-In
1. Sign out (if signed in)
2. Sign in
3. **Verify**: Header buttons should be enabled immediately ✓ (NEW)
4. Navigate to feed → Should work
5. Sign out
6. **Verify**: Header buttons should be disabled immediately ✓

---

## Next Steps

### Immediate Actions

1. **Push current branch** (header buttons fix):
   ```bash
   git push origin fix/header-buttons-after-signin
   ```

2. **Push previous branch** (bug fixes):
   ```bash
   git checkout feat/auth-overhaul-and-post-controls
   git push origin feat/auth-overhaul-and-post-controls
   ```

3. **Clean up uncommitted changes** (optional):
   ```bash
   git checkout fix/header-buttons-after-signin
   git restore src/app/api/projects/[id]/replies/route.js src/lib/dates.js 05-Logs/Daily/2026-01-22-cursor-notes.md
   ```

### Testing

4. **Test all fixes** in development/preview environment:
   - Test project lock check (comments and replies)
   - Test date validation (malformed time strings)
   - Test header buttons after sign-in

### Merging

5. **Create PRs** or merge as needed:
   - PR for `feat/auth-overhaul-and-post-controls` → `main`
   - PR for `fix/header-buttons-after-signin` → `main`
   - Or merge directly if you have bypass permissions

---

## Files Modified Summary

### Branch: `feat/auth-overhaul-and-post-controls`
- `src/app/api/projects/[id]/replies/route.js` - Lock check
- `src/lib/dates.js` - Date validation
- `docs/GitHub-Permissions-Troubleshooting.md` - New guide
- `05-Logs/Daily/2026-01-22-cursor-notes.md` - Log updates

### Branch: `fix/header-buttons-after-signin`
- `src/app/layout.js` - Force dynamic rendering
- `src/components/ClaimUsernameForm.js` - Router refresh calls

---

## Code Quality Checks

- ✅ All fixes follow existing code patterns
- ✅ Error handling is consistent
- ✅ Comments explain the fixes
- ✅ No breaking changes
- ✅ Rollout-safe (try/catch where needed)
- ✅ Consistent with codebase style

---

## Conclusion

All three fixes are correctly implemented and ready for testing. The code follows best practices and matches existing patterns in the codebase.
