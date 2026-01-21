# Next Phase Plan - Post Implementation Review

## Overview
This document outlines the next phases of development based on items from `IssuesAndUpgrades-1.txt` that were not fully completed or need enhancement.

## Phase 1: Remaining Core Items (High Priority)

### 1.1 Browser-Based Login Detection
**Priority**: Medium
**Status**: Not Started
**Description**: Detect browser-based authentication and show different UI accordingly

**Implementation Plan**:
1. Add detection logic in `src/lib/auth.js` to check for browser-based auth
2. Update `src/components/ClaimUsernameForm.js` to conditionally render based on auth type
3. Show different UI for browser-based vs cookie-based authentication
4. May need to check for specific browser APIs or session storage patterns

**Files to Modify**:
- `src/lib/auth.js` - Add detection function
- `src/components/ClaimUsernameForm.js` - Conditional rendering
- Possibly create new component for browser-based auth UI

**Estimated Effort**: 2-3 hours

### 1.2 Default Landing Page Preference
**Priority**: Medium
**Status**: Not Started
**Description**: Allow users to choose default landing page (Home vs Feed) or default to Feed after signup

**Implementation Options**:

**Option A: Simple Redirect (Easiest)**
- Redirect signed-in users to `/feed` instead of `/` (home)
- Modify `src/app/page.js` to redirect if user is signed in
- No database changes needed

**Option B: User Preference (More Flexible)**
- Add `default_landing_page` column to `users` table (migration)
- Add setting in account page to choose Home or Feed
- Update home page to redirect based on preference
- Requires migration: `0019_user_landing_preference.sql`

**Option C: Hybrid**
- Default new signups to Feed
- Allow users to change preference in settings
- Home page checks preference and redirects if set

**Recommended**: Option C (Hybrid) - best UX with flexibility

**Files to Modify**:
- `src/app/page.js` - Conditional redirect logic
- `src/app/api/auth/signup/route.js` - Set default preference on signup
- `src/components/ClaimUsernameForm.js` - Add preference setting
- `src/app/account/page.js` - Display preference setting
- New migration: `0019_user_landing_preference.sql`

**Estimated Effort**: 3-4 hours

### 1.3 Home Page Section Cards Expansion
**Priority**: Medium
**Status**: Not Started
**Description**: Show more than 6 section cards on home page since there are more pages now

**Current Sections** (6):
- Timeline/Announcements
- Forum/Lobby
- Events
- Music
- Projects
- Shitposts

**Additional Sections to Add**:
- Art & Nostalgia (combined)
- Bugs & Rants (combined)
- Development (already conditionally shown if signed in)
- Lore (signed-in only)
- Memories (signed-in only)

**Implementation Plan**:
1. Update `src/app/page.js` to query additional sections
2. Add section data for Art & Nostalgia, Bugs & Rants
3. Conditionally show Lore and Memories if signed in
4. Update home page rendering to display all sections
5. Consider grid layout if more than 6-8 sections

**Files to Modify**:
- `src/app/page.js` - Add queries and section data
- Possibly update home page layout/component

**Estimated Effort**: 2-3 hours

### 1.4 Welcome Text Update
**Priority**: Low
**Status**: Needs Clarification
**Description**: Update welcome text (needs clarification on what specific text)

**Action Needed**:
- Clarify which welcome text needs updating:
  - Home page "Welcome" section for non-logged-in users?
  - "Welcome back, {username}" greeting?
  - Something else?
- Once clarified, update appropriate strings in `src/lib/forum-texts/strings.js`

**Estimated Effort**: 30 minutes (after clarification)

## Phase 2: Enhanced Calendar Features (Medium Priority)

### 2.1 Enhanced Calendar Display
**Priority**: Medium
**Status**: Not Started
**Description**: Better calendar features for events (beyond basic RSVP)

**Potential Features**:
- Calendar view (monthly/weekly grid)
- Event date formatting improvements
- Upcoming events widget
- Event reminders/notifications
- Recurring events support

**Implementation Plan**:
1. Research calendar component libraries or build custom
2. Create calendar view page/component
3. Add date formatting utilities
4. Consider event reminders system

**Estimated Effort**: 8-12 hours (depending on scope)

### 2.2 RSVP Enhancements
**Priority**: Low
**Status**: Basic RSVP Complete
**Description**: Enhance RSVP feature with additional functionality

**Potential Enhancements**:
- RSVP with plus-one/guests
- RSVP notes/comments
- Event capacity limits
- Waitlist functionality
- Email notifications for RSVP changes

**Estimated Effort**: 4-6 hours per enhancement

## Phase 3: UI/UX Improvements (Lower Priority)

### 3.1 Enhanced Navigation
**Priority**: Low
**Status**: Functional
**Description**: Further navigation improvements

**Potential Improvements**:
- Keyboard navigation improvements
- Better mobile menu experience
- Navigation search/filter
- Recently visited pages

**Estimated Effort**: 4-6 hours

### 3.2 Home Page Redesign
**Priority**: Low
**Status**: Functional
**Description**: Redesign home page for better organization with more sections

**Potential Improvements**:
- Grid layout for section cards
- Section grouping/categories
- Personalized section ordering
- Quick actions/widgets

**Estimated Effort**: 6-8 hours

## Phase 4: Documentation & Maintenance

### 4.1 Update Documentation
**Priority**: Low
**Status**: Partial
**Description**: Update remaining documentation files

**Action Items**:
- Update `docs/forum-texts/README.md` with new tagline
- Update `docs/forum-texts/errl-forum-texts.md` with new tagline
- Review and update any other outdated documentation

**Estimated Effort**: 1 hour

### 4.2 Code Review & Refactoring
**Priority**: Low
**Status**: Good
**Description**: Review code for optimization opportunities

**Action Items**:
- Review new components for optimization
- Check for any code duplication
- Consider component extraction where appropriate
- Performance optimization if needed

**Estimated Effort**: 4-6 hours

## Implementation Priority Order

### Immediate (Before Next Deployment)
1. ✅ Apply migration `0018_event_attendees.sql` to production
2. ✅ Test all implemented features
3. ⚠️ Clarify welcome text requirement (Item 3)

### Short Term (Next 1-2 Weeks)
1. Default landing page preference (Item 13) - Option C recommended
2. Home page section cards expansion (Item 13b)
3. Browser-based login detection (Item 4) - if needed

### Medium Term (Next Month)
1. Enhanced calendar features (Item 1 enhancement)
2. Welcome text update (after clarification)
3. Documentation updates

### Long Term (Future Iterations)
1. RSVP enhancements
2. Navigation improvements
3. Home page redesign
4. Other UI/UX enhancements

## Database Migrations Needed

### Immediate
- `0018_event_attendees.sql` - RSVP feature (created, needs application)

### Short Term
- `0019_user_landing_preference.sql` - If implementing Option B or C for default landing page
  ```sql
  ALTER TABLE users ADD COLUMN default_landing_page TEXT DEFAULT 'feed';
  ```

## Testing Requirements

### Before Phase 1 Deployment
- [ ] Test default landing page behavior
- [ ] Test home page with expanded section cards
- [ ] Test browser-based login detection (if implemented)
- [ ] Verify welcome text updates (after clarification)

### Ongoing
- [ ] Monitor RSVP feature usage
- [ ] Collect feedback on combined pages
- [ ] Track navigation usage patterns
- [ ] Monitor performance with expanded home page

## Notes

- All Phase 1 items are directly from `IssuesAndUpgrades-1.txt`
- Phase 2-4 items are enhancements beyond the original requirements
- Estimated efforts are rough estimates and may vary
- Priorities can be adjusted based on user feedback and needs
- Some items may need design decisions before implementation
