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
