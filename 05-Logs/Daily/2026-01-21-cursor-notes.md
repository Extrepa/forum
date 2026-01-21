## 2026-01-21 Cursor Notes

### Work summary
- Made Projects public for signed-in users (create), and owner-only for edits/updates.
- Added migration to move the latest forum thread into Projects and "archive" the original thread.
- Added new admin-only section: Dev Log (DB + API + pages + nav).

### Key changes
- **Projects permissions**
  - Create project: any authenticated user with password set.
  - Edit project / add updates: only the project author.
  - Files:
    - `src/app/api/projects/route.js`
    - `src/app/api/projects/[id]/route.js`
    - `src/app/api/projects/[id]/updates/route.js`
    - `src/app/projects/page.js`
    - `src/app/projects/ProjectsClient.js`
    - `src/app/projects/[id]/page.js`

- **Move latest forum post to Projects**
  - Migration: `migrations/0009_move_forum_to_project.sql`
  - Inserts most recent `forum_threads` row into `projects` (status='active'), then locks + rewrites the forum thread to point at `/projects/<id>`.

- **Dev Log (admin-only)**
  - Migration: `migrations/0010_devlog.sql`
  - API:
    - `src/app/api/devlog/route.js`
    - `src/app/api/devlog/[id]/route.js`
    - `src/app/api/devlog/[id]/comments/route.js`
  - Pages:
    - `src/app/devlog/page.js`
    - `src/app/devlog/DevLogClient.js`
    - `src/app/devlog/[id]/page.js`
  - Component:
    - `src/components/DevLogForm.js`
  - Nav:
    - `src/components/NavLinks.js` now accepts `isAdmin` to conditionally show Dev Log
    - `src/app/layout.js` now computes `isAdmin` server-side and passes it down

### Follow-up: Dev Log signed-in visibility + locking
- **Visibility**:
  - Dev Log is now **not public** but **readable by signed-in users**.
  - Only admins can create/edit Dev Log posts.
  - Signed-in users can comment for feedback (same posting password rules apply).
- **Per-post lock**:
  - Added `dev_logs.is_locked` (default 0/unlocked) via `migrations/0011_devlog_lock.sql`.
  - Admins can lock/unlock comments per post (new endpoint `POST /api/devlog/[id]/lock`).
  - When locked, comment form is hidden and API rejects new comments with `error=locked`.
- **Navigation**:
  - Dev Log link is shown only when signed in (not public), via `NavLinks` + `layout` passing `isSignedIn`.

### Follow-up: Forum thread locking enforced + toggle
- **Enforcement**:
  - Reply posting now checks `forum_threads.is_locked` and rejects new replies when locked (`error=locked`).
  - Thread page hides reply form when locked and shows a notice.
- **Toggle**:
  - Added `POST /api/forum/[id]/lock` for thread author (or admin) to lock/unlock replies.

