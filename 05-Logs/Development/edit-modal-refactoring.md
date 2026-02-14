# Refactoring: Migrating to `PostActionMenu` `editModal` Prop & Data Serialization

## Objective
1. **Refactor Edit UI**: Convert all post detail pages (`src/app/**/[id]/page.js`) from using hidden edit panels (toggled by ID via `PostActionMenu`) to passing the edit form directly into the `editModal` prop of `PostActionMenu`. This uses a managed modal state instead of direct DOM manipulation by ID.
2. **Fix Serialization**: Ensure all data passed to client components (especially from `params`, `searchParams`, and DB results) are converted to primitives (strings/numbers/booleans) to avoid Next.js 15 / BigInt serializability errors.

## Progress Summary

### Completed Files (Edit Modal + Serialization)
- `src/app/events/[id]/page.js`
- `src/app/devlog/[id]/page.js`
- `src/app/art/[id]/page.js`
- `src/app/announcements/[id]/page.js`
- `src/app/projects/[id]/page.js`
- `src/app/lobby/[id]/page.js`
- `src/app/rant/[id]/page.js`
- `src/app/nostalgia/[id]/page.js`
- `src/app/music/[id]/page.js` (Verified: Redundant panel removed)
- `src/app/memories/[id]/page.js`
- `src/app/lore/[id]/page.js`
- `src/app/lore-memories/[id]/page.js`
- `src/app/bugs/[id]/page.js`

### Remaining Files to Refactor (Edit Modal + Serialization)
- None

## Implementation Steps for Remaining Files

1.  **Read the file** to identify the existing `PostActionMenu` call and the hidden edit panel at the bottom.
2.  **Ensure Next.js 15 Compatibility**:
    - `const { id } = await params;`
    - `const resolvedSearchParams = (await searchParams) || {};`
3.  **Serialize Data**:
    - Convert BigInt fields from DB to `Number()` or `String()`.
    - Pre-render markdown in the Server Component and pass HTML strings if possible, or ensure the raw body is a string.
4.  **Update `PostActionMenu`**:
    - Remove the `panelId` prop.
    - Add the `editModal` prop.
    - Move the content of the hidden edit panel (the `<section className="card">...</section>` block containing the form and notice) into the `editModal` prop.
5.  **Remove the Redundant Panel**:
    - Locate the `{canEdit ? ( <div id="edit-*-panel" style={{ display: 'none' }}> ... </div> ) : null}` block near the bottom of the return statement and delete it.
6.  **Cleanup**:
    - Ensure all required imports for the form components are still present.
    - Remove any unused state or variables related to the old toggle method.

## Component Reference

### Updated `PostActionMenu.js`
The component now manages an `isEditModalOpen` state and renders an `EditPostModal` wrapper around the `editModal` prop content.

### Example Transformation

**Before:**
```jsx
<PostActionMenu
  buttonLabel="Edit Post"
  panelId="edit-post-panel"
  rightChildren={...}
>
  ...
</PostActionMenu>

...

{canEdit ? (
  <div id="edit-post-panel" style={{ display: 'none' }}>
    <section className="card">
      <h3 className="section-title">Edit Post</h3>
      {notice ? <div className="notice">{notice}</div> : null}
      <PostEditForm ... />
    </section>
  </div>
) : null}
```

**After:**
```jsx
<PostActionMenu
  buttonLabel="Edit Post"
  editModal={
    <section className="card">
      <h3 className="section-title">Edit Post</h3>
      {notice ? <div className="notice">{notice}</div> : null}
      <PostEditForm ... />
    </section>
  }
  rightChildren={...}
>
  ...
</PostActionMenu>

// (Redundant hidden panel removed from bottom)
```
