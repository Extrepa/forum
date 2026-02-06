# Admin Console Capabilities (Current)

Last updated: 2026-02-06

This document lists what the Admin Console currently does in the app.

## Access and scope
- Admin-only access (`/admin`) gated by session role.
- Dynamic server-rendered admin page.
- Admin tools are split across:
  - `Admin Console` (`/admin` tabs)
  - `Moderation` page (`/admin/moderation`)
  - `Backups` page (`/admin/backups`)

## Console header quick actions
- `Create announcement` -> `/announcements`
- `Mod queue` -> `/admin?tab=reports`
- `Audit log` -> switches to `Overview` and scrolls to recent admin actions block.
- `Backup status` -> `/admin/backups`

## Tabs and capabilities

### 1) Overview
- Aggregated operational stats:
  - users (total, active 24h, active 7d)
  - posts (24h, 7d)
  - comments (24h, 7d)
  - hidden posts, locked posts, pinned posts
  - open flagged items
- Recent admin actions list from `admin_actions`.
- Latest threads/content preview list.

### 2) Posts
- Unified cross-content moderation table across content types:
  - forum threads
  - timeline updates
  - posts
  - events
  - music posts
  - projects
  - dev logs
- Search/filter by title, author, and section label.
- Show/hide deleted toggle.
- Row status chips: pinned/hidden/locked/deleted.
- Per-item actions menu:
  - Pin / Unpin
  - Hide / Show
  - Lock / Unlock (where supported)
  - Edit
  - Delete (soft delete)
  - Restore (if deleted)
  - View in new tab
- Action menus auto-flip upward when opened near viewport bottom.

### 3) Users
- Recent users table with:
  - role
  - joined
  - last seen
  - posts count
  - comments count
- Search by username.
- Show/hide deleted users toggle.
- Per-user actions:
  - View profile
  - Details drawer
  - Role change (`user` / `mod` / `admin`)
  - Delete account (anonymize + revoke access)

### 4) Reports
- Open moderation queue from `reports` table.
- Displays target, reporter, reason, created timestamp.
- Quick `View` links to reported content where resolvable.
- Fast path to Moderation tools page.

### 5) Media
- Media totals by source table (`image_key` counts) + gallery count.
- Recent upload cards across:
  - forum threads
  - timeline updates
  - posts
  - events
  - music posts
  - projects
  - dev logs
  - profile gallery
- Per-media card actions:
  - View image
  - Open source
  - Edit source (when supported)

### 6) Settings
- Global image upload enable/disable control.
- Links to moderation tools.

## Moderation page capabilities (`/admin/moderation`)
- Global image upload toggle.
- Content move workflow:
  - move by source URL or by manual source type + source ID
  - choose destination type
  - fill destination-specific fields (events/projects/music)
- Navigation shortcuts:
  - Back to Admin Console
  - Open Reports Queue

## Backups page (`/admin/backups`)
- Backup status entry point (manual guidance/workflow links).

## API capabilities used by admin console
- Post moderation:
  - `POST /api/admin/posts/[id]/pin`
  - `POST /api/admin/posts/[id]/restore`
  - content-type specific hide/lock/delete routes
- User moderation:
  - `POST /api/admin/users/[id]/role`
  - `POST /api/admin/users/[id]/delete`
- Settings:
  - `POST /api/admin/settings/image-upload`
- Moderation move tools:
  - `POST /api/admin/move`

## Data + audit capabilities
- Soft-delete aware behavior for posts and users.
- Admin action tracking into `admin_actions` table for key moderation actions.
- Role-based auth checks block non-admin access.

## Known boundaries
- Settings tab currently contains only image-upload toggle (no broader config set yet).
- Backup page is an operational status/entry page, not full in-console backup orchestration.
