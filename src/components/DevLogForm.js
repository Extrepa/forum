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

export default function DevLogForm({ logId, initialData }) {
  const bodyRef = useRef(null);

  const apply = (before, after) => {
    if (!bodyRef.current) {
      return;
    }
    wrapSelection(bodyRef.current, before, after);
  };

  const action = logId ? `/api/devlog/${logId}` : '/api/devlog';
  const isEdit = !!logId;

  return (
    <form action={action} method="post" encType="multipart/form-data">
      <label>
        <div className="muted">Title</div>
        <input
          name="title"
          placeholder="Dev log title"
          required
          defaultValue={initialData?.title || ''}
        />
      </label>
      <label>
        <div className="muted">Image (optional)</div>
        <input name="image" type="file" accept="image/*" />
      </label>
      <label className="text-field">
        <div className="muted">Body</div>
        <div className="formatting-toolbar">
          <button type="button" onClick={() => apply('**', '**')}>Bold</button>
          <button type="button" onClick={() => apply('*', '*')}>Italic</button>
          <button type="button" onClick={() => apply('<u>', '</u>')}>Underline</button>
          <button type="button" onClick={() => apply('## ', '')}>H2</button>
          <button type="button" onClick={() => apply('### ', '')}>H3</button>
          <button type="button" onClick={() => apply('[text](', ')')}>Link</button>
        </div>
        <textarea
          ref={bodyRef}
          name="body"
          placeholder="Write your dev log..."
          required
          defaultValue={initialData?.body || ''}
        />
      </label>
      <button type="submit">{isEdit ? 'Update Post' : 'Create Post'}</button>
    </form>
  );
}

