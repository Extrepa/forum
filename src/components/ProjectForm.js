'use client';

import { useRef } from 'react';

function wrapSelection(textarea, before, after = '') {
  const start = textarea.selectionStart || 0;
  const end = textarea.selectionEnd || 0;
  const value = textarea.value;
  const selected = value.slice(start, end);
  const nextValue = value.slice(0, start) + before + selected + after + value.slice(end);
  textarea.value = nextValue;
  const cursor = start + before.length + selected.length + after.length;
  textarea.focus();
  textarea.setSelectionRange(cursor, cursor);
}

export default function ProjectForm({ projectId, initialData }) {
  const descriptionRef = useRef(null);

  const apply = (before, after) => {
    if (!descriptionRef.current) {
      return;
    }
    wrapSelection(descriptionRef.current, before, after);
  };

  const action = projectId ? `/api/projects/${projectId}` : '/api/projects';
  const isEdit = !!projectId;

  return (
    <form action={action} method="post" encType="multipart/form-data">
      <label>
        <div className="muted">Title</div>
        <input
          name="title"
          placeholder="Project title"
          required
          defaultValue={initialData?.title || ''}
        />
      </label>
      <label>
        <div className="muted">Status</div>
        <select name="status" required defaultValue={initialData?.status || 'active'}>
          <option value="active">Active</option>
          <option value="on-hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </label>
      <label>
        <div className="muted">GitHub URL (optional)</div>
        <input
          name="github_url"
          type="url"
          placeholder="https://github.com/..."
          defaultValue={initialData?.github_url || ''}
        />
      </label>
      <label>
        <div className="muted">Demo URL (optional)</div>
        <input
          name="demo_url"
          type="url"
          placeholder="https://example.com"
          defaultValue={initialData?.demo_url || ''}
        />
      </label>
      <label>
        <div className="muted">Image (optional)</div>
        <input name="image" type="file" accept="image/*" />
      </label>
      <label className="text-field">
        <div className="muted">Description</div>
        <div className="formatting-toolbar">
          <button type="button" onClick={() => apply('**', '**')}>Bold</button>
          <button type="button" onClick={() => apply('*', '*')}>Italic</button>
          <button type="button" onClick={() => apply('<u>', '</u>')}>Underline</button>
          <button type="button" onClick={() => apply('## ', '')}>H2</button>
          <button type="button" onClick={() => apply('### ', '')}>H3</button>
          <button type="button" onClick={() => apply('[text](', ')')}>Link</button>
        </div>
        <textarea
          ref={descriptionRef}
          name="description"
          placeholder="Describe the project..."
          required
          defaultValue={initialData?.description || ''}
        />
      </label>
      <button type="submit">{isEdit ? 'Update Project' : 'Create Project'}</button>
    </form>
  );
}
