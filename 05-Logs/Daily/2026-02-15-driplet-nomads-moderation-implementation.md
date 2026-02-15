# 2026-02-15: Driplet + Drip Nomad + Moderator Delete Scope

## Request implemented
- Rename base user role display from `Drip` to `Driplet` (capabilities unchanged).
- Add a new role `drip_nomad` (`Drip Nomad`).
- Add Nomads-only visibility control for posts/events.
- Add a Nomads section (`/nomads`) with role-gated access.
- Keep admin full access.
- Extend moderator powers so mods can delete posts/comments/replies in sections (delete-only moderation scope).

## Data/migration changes
- Added migration: `migrations/0066_drip_nomads_and_visibility.sql`
  - `posts.visibility_scope` (`members` default)
  - `posts.section_scope` (`default` default)
  - `posts.nomad_post_kind`
  - `events.visibility_scope` (`members` default)
  - `events.section_scope` (`default` default)
  - `events.event_kind`
  - indexes for section/visibility + created time

## New shared permission utilities
- Added `src/lib/roles.js`
  - `isAdminUser`, `isModeratorUser`, `isDripNomadUser`, role display labels
- Added `src/lib/visibility.js`
  - `normalizeVisibilityScope`
  - `canViewScope`
  - constants for `members` and `nomads`
- Updated `src/lib/admin.js`
  - now reuses role helpers
  - exports `isModUser` and `isDripNomad`

## Role/admin UI updates
- `src/app/api/admin/users/[id]/role/route.js`
  - valid roles now include `drip_nomad`
- `src/components/AdminConsole.js`
  - role dropdown now includes `Driplet` + `Drip Nomad`
  - move destinations include Nomads subtype
- Role labels updated to show Driplet/Drip Nomad:
  - `src/components/UserPopover.js`
  - `src/app/account/AccountTabsClient.js`
  - `src/app/profile/[username]/page.js`

## Nomads section implementation
- Added Nomads post type in registry:
  - `src/lib/contentTypes.js`
- Added routes:
  - `src/app/nomads/page.js`
  - `src/app/nomads/[id]/page.js`
- Added header nav link for Nomads (only admin or drip_nomad):
  - `src/components/SiteHeader.js`
- Updated shared client support for custom section title/url:
  - `src/app/lore/LoreClient.js`

## Visibility behavior (members + nomads + admin override)
- No public mode introduced.
- Nomads-only visibility available only to Drip Nomad/Admin users.
- Nomads post type creation restricted to Drip Nomad/Admin.
- Visibility enforcement added in APIs and pages:
  - Posts APIs:
    - `src/app/api/posts/route.js`
    - `src/app/api/posts/[id]/route.js`
    - `src/app/api/posts/[id]/comments/route.js`
  - Events APIs:
    - `src/app/api/events/route.js`
    - `src/app/api/events/[id]/route.js`
  - Feed/search/home/list/detail filtering:
    - `src/app/feed/page.js`
    - `src/app/api/search/route.js`
    - `src/app/search/SearchResults.js`
    - `src/app/page.js`
    - section list pages (`art`, `nostalgia`, `bugs`, `rant`, `lore`, `memories`, grouped pages)
    - section detail pages (`art/[id]`, `nostalgia/[id]`, `bugs/[id]`, `rant/[id]`, `lore/[id]`, `memories/[id]`, `lore-memories/[id]`)
    - `events/page.js`, `events/[id]/page.js`

## Posting/edit form updates
- Added Nomads-only checkbox support:
  - `src/components/GenericPostForm.js`
  - `src/components/PostForm.js`
- Added Nomad post kind selector for Nomads section form:
  - `src/components/GenericPostForm.js`
- Hooked Nomad visibility controls into section/event creation UIs where allowed.

## Moderator delete permissions
- Mods now pass delete authorization checks (delete-only moderation scope) across section delete endpoints:
  - Posts/comments/replies and content-specific delete APIs under:
    - `src/app/api/posts/.../delete/route.js`
    - `src/app/api/forum/.../delete/route.js`
    - `src/app/api/events/.../delete/route.js`
    - `src/app/api/timeline/.../delete/route.js`
    - `src/app/api/devlog/.../delete/route.js`
    - `src/app/api/music/.../delete/route.js`
    - `src/app/api/projects/.../delete/route.js`

## Routing updates
- Added Nomads route handling for post lock/hide redirects:
  - `src/app/api/posts/[id]/hide/route.js`
  - `src/app/api/posts/[id]/lock/route.js`
- Search result URL mapping updated to handle `nomads` posts.

## Event invites UI labels
- Invite role labels now humanized:
  - `user` -> `Driplets`
  - `drip_nomad` -> `Drip Nomads`
  - file: `src/components/EventEngagementSection.js`

## Verification run (double-check)
- `npm run lint` -> passed
- `npm run build` -> passed (includes `/nomads` and `/nomads/[id]`)
- `npm test -- --run` -> not available in this repository (no `test` script)

## Deployment note
- Apply migration before release:
  - `migrations/0066_drip_nomads_and_visibility.sql`

## 2026-02-15 addendum: Nomads post-scope model refinement
- Updated Nomads section description copy to:
  - `private posts for the Nomads and anything we don't want to share with the public`
- Reworked Nomads new-post flow:
  - Removed legacy Nomad-only kind selector (`post/update/event/invite`).
  - Nomads composer now uses section-oriented post types (`nomads`, `art`, `nostalgia`, `bugs`, `rant`, `lore`, `memories`, `about`).
- Implemented section-scope behavior for Nomads visibility:
  - Any post created with `Nomads-only` visibility is now persisted with `section_scope = 'nomads'` and `visibility_scope = 'nomads'`.
  - This makes the post visible in `/nomads` while still visible in its typed section (`/art`, `/bugs`, etc.) to Drip Nomad/Admin users only.
- Nomads list/detail queries now key off `section_scope = 'nomads'` (with legacy fallback for older `type='nomads'` rows).
- Comment redirect and edit redirect for Nomad-scoped posts now resolve to `/nomads/[id]`.
- Home Nomads card count/recent queries now include Nomad-scoped typed posts.

## Consolidated implementation ledger (all work in this thread)
- Roles and naming:
  - Base member role display standardized to `Driplet` (capabilities unchanged).
  - Added `drip_nomad` role (`Drip Nomad`) to role model and admin assignment flow.
  - Admin remains full-access role.
- Membership model clarification:
  - No public posting model added; visibility model is member-authenticated with Nomads scoped privacy where selected.
- Nomads section:
  - Added dedicated Nomads section routes and UI integration.
  - Added Nomads card visibility in home for eligible users.
  - Updated Nomads description copy per final wording request.
- Post visibility/scope model:
  - Added and enforced `visibility_scope` (`members`/`nomads`) and `section_scope` (`default`/`nomads`) behavior.
  - Any Nomad-scoped post is accessible only to Drip Nomad/Admin users.
  - Posting from Nomads can use section-style types while retaining Nomad scope.
  - Posting in other sections with Nomads-only enabled now persists as Nomad-scoped and appears in Nomads + typed section for authorized viewers.
- Nomads composer/type UX:
  - Removed old Nomad-specific kind selector (`post/update/event/invite`).
  - Replaced with section-oriented post types relevant to existing forum sections.
- Routing and redirect consistency:
  - Updated detail, edit return, comment return, and content-type view-path resolution so Nomad-scoped posts resolve to `/nomads/[id]`.
- Moderator permissions:
  - Expanded moderator scope to delete posts/comments/replies across section delete endpoints (delete moderation behavior).
- Event invite labels:
  - Updated invite audience labels to humanized role terms (`Driplets`, `Drip Nomads`).
- Admin console:
  - Added role reassignment support for `Drip Nomad` and role label consistency updates.
- Migration/database:
  - `migrations/0066_drip_nomads_and_visibility.sql` introduces role/visibility-supporting fields and indexes (`posts/events` scope fields + indexes).
