# Navigation Flow Analysis - 2026-01-22

## Current Flow

### 1. First Visit (Not Signed In)
- **URL**: `/` (home page)
- **Shows**: `ClaimUsernameForm` component
- **Default Mode**: `'login'` (line 13 of ClaimUsernameForm.js)
- **User Action**: Can toggle to signup via "Create an account" button
- **Issue**: First-time visitors see login form, not signup form

### 2. After Sign-In
- **Action**: `submitLogin()` called
- **Flow**:
  1. API call to `/api/auth/login`
  2. `refreshMe()` - updates client state
  3. `router.refresh()` - invalidates Next.js cache
  4. `router.replace('/')` - navigates to home page
- **Home Page Logic**:
  - Checks if user has `default_landing_page === 'feed'`
  - If yes: `redirect('/feed')` (server-side redirect)
  - If no: Shows home page content
- **Result**: User ends up at `/` or `/feed` depending on preference

### 3. After Sign-Up
- **Action**: `submitSignup()` called
- **Flow**:
  1. API call to `/api/auth/signup`
  2. `refreshMe()` - updates client state
  3. `router.refresh()` - invalidates Next.js cache
  4. `router.replace('/')` - navigates to home page
- **Home Page Logic**:
  - New user likely has `default_landing_page === 'feed'` (default from form)
  - If yes: `redirect('/feed')` (server-side redirect)
  - If no: Shows home page content
- **Result**: User ends up at `/` or `/feed` depending on preference

### 4. Returning Visitor (Not Signed In)
- **URL**: `/` (home page)
- **Shows**: `ClaimUsernameForm` component
- **Default Mode**: `'login'` (correct for returning visitors)
- **User Action**: Can sign in or toggle to signup

## Issues Identified

### Issue 1: Default Mode Always 'login'
**Problem**: First-time visitors see login form instead of signup form.

**Current Code**:
```javascript
const [mode, setMode] = useState('login'); // signup | login
```

**Impact**: New users must click "Create an account" to see signup form.

**Solution Options**:
1. Default to 'signup' mode (but returning visitors would see signup)
2. Check for session token - if none exists, default to 'signup'
3. Keep current behavior (users can toggle)

### Issue 2: Potential Redirect Flash
**Problem**: After sign-in/sign-up, user navigates to `/` then immediately redirects to `/feed` if preference is set.

**Current Flow**:
1. `router.replace('/')` - client-side navigation to home
2. Home page renders, checks `default_landing_page`
3. Server-side `redirect('/feed')` happens
4. User sees brief flash of home page before redirect

**Impact**: Minor UX issue - brief flash of home page before redirect.

**Solution Options**:
1. Check preference before navigation and navigate directly to `/feed`
2. Accept the redirect (it's server-side, so fast)
3. Use client-side redirect check before navigation

### Issue 3: No Clear "First-Time Visitor" Detection
**Problem**: Cannot reliably detect if user is first-time or returning visitor.

**Current State**: 
- No session token = not signed in (could be first-time OR returning)
- Session token exists = signed in (definitely returning)

**Solution**: Check for session token existence:
- No token → default to 'signup' mode
- Token exists but invalid → default to 'login' mode
- Token valid → user is signed in, show home page

## Recommended Changes

### Change 1: Smart Default Mode Based on Session Token

**File**: `src/components/ClaimUsernameForm.js`

**Logic**:
- Check if session token exists on mount
- If no token: default to 'signup' (first-time visitor)
- If token exists: default to 'login' (returning visitor)

**Implementation**:
```javascript
useEffect(() => {
  // Check for existing session token
  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const payload = await response.json();
      // If no user, default to signup (first-time visitor)
      if (!payload.user) {
        setMode('signup');
      } else {
        // User exists but form is showing (shouldn't happen, but handle it)
        setMode('login');
      }
    } catch (error) {
      // No session, default to signup
      setMode('signup');
    }
  };
  checkSession();
}, []);
```

**Note**: This runs after the initial `useEffect` that loads user data, so we need to coordinate.

### Change 2: Navigate Directly to Preferred Landing Page

**File**: `src/components/ClaimUsernameForm.js`

**Logic**:
- After sign-in/sign-up, check user's `default_landing_page` preference
- Navigate directly to that page instead of always going to `/`

**Implementation**:
```javascript
// In submitLogin and submitSignup, after refreshMe():
await refreshMe();
router.refresh();

// Check landing page preference
const landingPage = me?.defaultLandingPage || 'home';
if (landingPage === 'feed') {
  router.replace('/feed');
} else {
  router.replace('/');
}
```

**Note**: This requires `refreshMe()` to complete and update `me` state before checking.

## Current Flow Diagram

```
First Visit (No Session)
  ↓
Home Page (/)
  ↓
ClaimUsernameForm (mode: 'login') ← ISSUE: Should be 'signup'
  ↓
User clicks "Create an account"
  ↓
Mode switches to 'signup'
  ↓
User fills form and submits
  ↓
submitSignup()
  ↓
router.replace('/')
  ↓
Home Page checks default_landing_page
  ↓
If 'feed': redirect('/feed')
If 'home': Show home content
```

```
Returning Visit (No Session)
  ↓
Home Page (/)
  ↓
ClaimUsernameForm (mode: 'login') ← CORRECT
  ↓
User signs in
  ↓
submitLogin()
  ↓
router.replace('/')
  ↓
Home Page checks default_landing_page
  ↓
If 'feed': redirect('/feed')
If 'home': Show home content
```

## Verification Checklist

- [x] After sign-in → navigates to home page
- [x] After sign-up → navigates to home page
- [x] Home page respects `default_landing_page` preference
- [x] No intermediate pages between sign-in/sign-up and destination
- [ ] First-time visitors see signup form by default (CURRENTLY NO)
- [ ] Returning visitors see login form by default (CURRENTLY YES)
- [ ] Navigation is clean (no unnecessary redirects)

## Recommendations

1. **Implement smart default mode** - Check for session token to determine if user is first-time or returning
2. **Navigate directly to preferred page** - Check `default_landing_page` before navigation
3. **Keep current toggle behavior** - Users can still switch between login/signup

## Files to Modify

1. `src/components/ClaimUsernameForm.js`
   - Add logic to set default mode based on session
   - Update navigation to check landing page preference

2. No other files need changes (home page redirect logic is fine)
