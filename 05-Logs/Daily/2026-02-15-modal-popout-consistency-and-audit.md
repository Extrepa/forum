# 2026-02-15 modal pop-out consistency and audit

## Request
- Fix inconsistent pop-out modal behavior and border/layout issues on mobile (create/edit/settings flows).
- Ensure large pop-outs are consistent: visible backdrop, tap-out close, and safer close handling when drafts are in progress.
- Extend consistency to other full-screen/admin/profile pop-outs.
- Re-audit the full pass and log everything.

## Root causes identified
- Shared modal wrappers were inconsistent across features (some used custom fixed overlays, others used `CreatePostModal`).
- Global card sizing (`height: 100%`) leaked into modal internals and could cause content/outline mismatch on mobile, especially with flattened card-in-modal forms.
- Unsaved-close safeguards were not consistently applied across backdrop close, close button, and `Escape` paths.

## Implementation summary
- Standardized key pop-outs onto the shared modal shell (`CreatePostModal`) for create/edit/settings/admin/profile contexts.
- Added unsaved-change close guard support to shared modal close paths (backdrop, close button, `Escape`).
- Added modal-safe card sizing overrides to avoid clipped/misaligned outline behavior in mobile pop-outs.
- Added dirty checks for account settings sheets so accidental tap-out prompts before discarding edits.
- Rechecked and removed one unrelated text-label change found during audit to keep this pass scoped.

## Files updated
- `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/CreatePostModal.js`
  - Added form snapshot dirty detection.
  - Added unified guarded close path (`requestClose`) for backdrop/close button/`Escape`.
  - Added optional `confirmOnUnsavedChanges` and `unsavedChangesMessage` props.
  - Added dialog semantics.

- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/globals.css`
  - Added modal card sizing safeguards:
    - `.edit-post-modal > .card` and `.create-post-modal > .card` now force `height: auto` / `min-height: 0`.
    - `.modal-content .card` now forces `height: auto` / `min-height: 0`.
  - Added `.admin-drawer--wide` width variant for larger admin composer modal.

- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/account/AccountSettings.js`
  - Replaced custom `EditSheet` overlay/panel with `CreatePostModal` wrapper.
  - Added per-sheet dirty state checks (contact/password/notifications) and confirm-on-close behavior.
  - Reverted unrelated label text during audit to keep scope clean.

- `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/AdminConsole.js`
  - Converted these overlays to `CreatePostModal`:
    - edit post panel
    - user details panel
    - move post dialog
    - broadcast composer
  - Preserved busy-state close restrictions where needed.

- `/Users/extrepa/Projects/errl-portal-forum-docs/src/components/ProfileTabsClient.js`
  - Converted public profile gallery full-size overlay to `CreatePostModal`.

- `/Users/extrepa/Projects/errl-portal-forum-docs/src/app/account/AccountTabsClient.js`
  - Converted account gallery full-size overlay to `CreatePostModal`.

## Verification and audit
- Ran lint after changes: `npm run lint` (pass).
- Re-ran lint during final audit: `npm run lint` (pass).
- Grepped codebase to confirm target custom overlay patterns were replaced in admin/profile/account gallery flows.
- Confirmed no destructive git operations were used.

## Notes / remaining manual QA
- Manual mobile QA is still recommended for final signoff on:
  - `/events` create modal
  - `/projects` create modal
  - post edit modal on content pages
  - `/account` settings sheets
  - profile gallery (public + account edit)
  - admin move/broadcast/edit drawers
- Expected behavior now:
  - backdrop remains visible
  - tap-out close works consistently
  - dirty forms prompt before close where applicable
