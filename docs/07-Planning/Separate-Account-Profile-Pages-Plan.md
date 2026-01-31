# Separate Account and Profile Pages – Plan

**Status:** Implemented. Account page = settings + edit profile; Profile page = view-only; users can visit their own profile; clear labels and links.

**Goal:** Make the profile page and account page separate. Allow users to visit their own profile at `/profile/[username]` (same tabbed card as everyone else). Use `/account` only for settings and editing. Add clear ways to go from "my profile" to "edit" and from "account" to "view my profile."

---

## 1. Current state

- **`/profile/[username]`** – Public profile (single tabbed card). If the viewer is the owner, the app **redirects** to `/account?tab=profile`.
- **`/account`** – Two tabs: "Account" (claim username, sign out) and "Profile" (view + edit: avatar, username, color, socials, mood/song, stats, recent activity).
- **Username component** – Links to `/profile/[username]` by default (so clicking your own name would currently redirect to account).
- **NotificationsMenu** – Has "Account" and "Profile" buttons; "Profile" goes to `/account?tab=profile`.

---

## 2. Target state

| Page | Purpose |
|------|--------|
| **`/profile/[username]`** | Always show the same tabbed profile card (header + Activity/Lately/Gallery/Notes/Files). When the viewer is the owner: same card **plus** an "Edit profile" link/button to `/account`. No redirect. |
| **`/account`** | Settings and profile **editor** only. Two tabs: "Account" (claim username, sign out) and "Edit profile" (avatar, username, color, socials, mood/song – same form as today). Add a "View my profile" link that goes to `/profile/[currentUsername]`. |

**User flows**

- Visit own profile: go to `/profile/myname` → see tabbed profile → click "Edit profile" → `/account` (Edit profile tab).
- Edit profile: go to `/account` → Edit profile tab → make changes → click "View my profile" → `/profile/myname`.
- Visit someone else's profile: `/profile/theirname` → same as today (no "Edit profile").
- Notifications / nav: "Profile" (or "View my profile") → `/profile/currentUsername`; "Account" (or "Edit profile") → `/account`.

---

## 3. Implementation steps

### 3.1 Profile page: allow viewing own profile, add "Edit profile"

**File:** [src/app/profile/[username]/page.js](src/app/profile/[username]/page.js)

1. **Remove the redirect** when the viewer is the owner.
   - Delete or comment out the block that does `if (currentUser && isOwnProfile) { redirect('/account?tab=profile'); }`.
   - Keep computing `isOwnProfile` (needed for the edit link).

2. **When `isOwnProfile` is true, show an "Edit profile" entry point** in the profile card.
   - Option A: In the header block (e.g. next to username/role), add a link or button "Edit profile" → `/account` (or `/account?tab=profile` if the profile-editor tab is still `tab=profile`).
   - Option B: Add a small bar or link above/below the card, e.g. "You're viewing your profile. [Edit profile]."
   - Recommended: Option A – a clear "Edit profile" button or link in the header (e.g. top-right of the header block on desktop, below role on mobile) so it's visible but doesn't dominate.

3. **Implementation detail for the edit link**
   - Use `Link` or `<a href="/account">` (or `/account?tab=profile` if you keep that tab for the editor). If the account page defaults to the profile-editor tab when coming from "Edit profile", a plain `/account` is enough; otherwise use a query so the correct tab opens.

**Deliverable:** Visiting `/profile/yourname` shows the same tabbed profile as for others, with an "Edit profile" link/button when you're the owner; no redirect.

---

### 3.2 Account page: clarify tabs and add "View my profile"

**File:** [src/app/account/page.js](src/app/account/page.js)

- No structural change to data fetching. Keep passing `user` (with `username`) and `stats` to `AccountTabsClient`.

**File:** [src/app/account/AccountTabsClient.js](src/app/account/AccountTabsClient.js)

1. **Rename the "Profile" tab** to **"Edit profile"** (or keep label "Profile" but treat it as editor-only; plan assumes label "Edit profile" for clarity).

2. **Add a "View my profile" link** so users can open their public profile from the account page.
   - Place it where it's always visible when on the account page, e.g.:
     - In the account page header (next to breadcrumbs or above the tabs), e.g. "View my profile" → `/profile/${user.username}`.
     - Or at the top of the "Edit profile" tab: "See how others see you. [View my profile]."
   - Use `user?.username` (already passed in) to build the href: `/profile/${encodeURIComponent(user.username)}`.

3. **Default tab**
   - Keep default tab as today (e.g. `tab=profile` or whatever the profile-editor tab is) or switch to `account`; your choice. Plan assumes default remains the profile-editor tab so "Edit profile" is the first thing users see on `/account`.

**Deliverable:** Account page has "Account" and "Edit profile" tabs; a "View my profile" link goes to `/profile/[currentUsername]`.

---

### 3.3 Notifications menu and other entry points

**File:** [src/components/NotificationsMenu.js](src/components/NotificationsMenu.js)

1. **"Profile" button**
   - Change from `router.push('/account?tab=profile')` to **"View my profile"** → `/profile/${currentUsername}`.
   - Use existing `currentUsername` (from the fetch that sets `data.user.username`). Ensure the link is only shown when `currentUsername` is set; otherwise keep a fallback to `/account` or hide the button.

2. **"Account" button**
   - Keep as `router.push('/account')` (or `/account?tab=account` if you want to land on the Account tab).

**Other references**

- [src/components/Username.js](src/components/Username.js) – Already links to `/profile/${safeName}`. When the user clicks their own name, they will now go to their profile (no redirect). No change required.
- [src/components/UserPopover.js](src/components/UserPopover.js) – Links to `/profile/${username}`. No change.
- [src/lib/markdown.js](src/lib/markdown.js) – Profile links use `/profile/${token.username}`. No change.
- [src/components/HeaderSetupBanner.js](src/components/HeaderSetupBanner.js) – Pushes to `/account`. No change.

**Deliverable:** Notifications "Profile" becomes "View my profile" and goes to `/profile/currentUsername`; "Account" still goes to `/account`.

---

### 3.4 Optional: direct "Edit profile" from account URL

- If you want links like "Edit profile" from the profile page to open the editor tab directly, use `/account?tab=profile` (or whatever the tab id is for the profile editor, e.g. `tab=edit-profile`). Account page already reads `searchParams.tab`; no backend change.

---

## 4. Checklist

- [ ] **Profile page:** Remove redirect when viewer is owner; keep `isOwnProfile`.
- [ ] **Profile page:** Add "Edit profile" link/button when `isOwnProfile`, linking to `/account` (or `/account?tab=profile`).
- [ ] **Account page (AccountTabsClient):** Rename "Profile" tab to "Edit profile" (optional but recommended).
- [ ] **Account page (AccountTabsClient):** Add "View my profile" link to `/profile/${user.username}` (header or top of Edit profile tab).
- [ ] **NotificationsMenu:** Change "Profile" to "View my profile" and link to `/profile/${currentUsername}`; keep "Account" as is.
- [ ] **Smoke test:** Visit `/profile/yourname` while logged in as that user → see profile card and "Edit profile" → click → land on account.
- [ ] **Smoke test:** From `/account`, click "View my profile" → land on `/profile/yourname`.
- [ ] **Smoke test:** Notifications "View my profile" → `/profile/currentUsername`; "Account" → `/account`.
- [ ] **Smoke test:** Click own username elsewhere (e.g. header) → go to own profile (no redirect).

---

## 5. Summary

- **Profile page:** Same for everyone; no redirect for own profile; show "Edit profile" when owner.
- **Account page:** Only settings + profile editor; add "View my profile" so users can visit their own profile anytime.
- **Notifications:** "View my profile" → own profile; "Account" → account.
- **Result:** Clear separation (profile = view, account = edit/settings) and users can always visit their own profile at `/profile/[username]`.
