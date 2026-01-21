'use client';

import { useRef, useState } from 'react';

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

function insertAtCursor(textarea, text) {
  const start = textarea.selectionStart || 0;
  const end = textarea.selectionEnd || 0;
  const value = textarea.value;
  const nextValue = value.slice(0, start) + text + value.slice(end);
  textarea.value = nextValue;
  const cursor = start + text.length;
  textarea.focus();
  textarea.setSelectionRange(cursor, cursor);
}

export default function DevLogForm({ logId, initialData }) {
  const bodyRef = useRef(null);
  const [quickUpdate, setQuickUpdate] = useState(false);

  const apply = (before, after) => {
    if (!bodyRef.current) {
      return;
    }
    wrapSelection(bodyRef.current, before, after);
  };

  const insert = (text) => {
    if (!bodyRef.current) return;
    insertAtCursor(bodyRef.current, text);
  };

  const getBody = () => String(bodyRef.current?.value || '').trim();
  const setBody = (text) => {
    if (!bodyRef.current) return;
    bodyRef.current.value = text;
  };

  const updateTemplate = `### Update
- 

### Notes
- 

### Links
- 
`;

  const action = logId ? `/api/devlog/${logId}` : '/api/devlog';
  const isEdit = !!logId;

  return (
    <form action={action} method="post" encType="multipart/form-data">
      <label>
        <div className="muted">Title</div>
        <input
          name="title"
          placeholder="Development post title"
          required
          defaultValue={initialData?.title || ''}
        />
      </label>

      <details className="muted">
        <summary>Links (optional)</summary>
        <div className="stack" style={{ marginTop: 10 }}>
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
            <div className="muted">Extra links (one per line)</div>
            <textarea
              name="links"
              placeholder={`https://...\nhttps://...`}
              defaultValue={initialData?.links || ''}
              style={{ minHeight: 90, paddingTop: 12 }}
            />
          </label>
        </div>
      </details>
      <label>
        <div className="muted">Image (optional)</div>
        <input name="image" type="file" accept="image/*" />
      </label>
      <label className="text-field">
        <div className="muted">Body</div>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
          <span className="muted">Quick update (optional)</span>
          <input
            type="checkbox"
            checked={quickUpdate}
            onChange={(e) => {
              const next = e.target.checked;
              setQuickUpdate(next);
              if (next && !getBody()) {
                setBody(updateTemplate);
              }
            }}
          />
        </label>
        <div className="formatting-toolbar">
          <button type="button" onClick={() => apply('**', '**')}>Bold</button>
          <button type="button" onClick={() => apply('*', '*')}>Italic</button>
          <button type="button" onClick={() => apply('<u>', '</u>')}>Underline</button>
          <button type="button" onClick={() => insert('\n- ')}>- List</button>
          <button type="button" onClick={() => insert('\n1. ')}>1. List</button>
          <button type="button" onClick={() => insert('\n> ')}>&gt; Quote</button>
          <button type="button" onClick={() => apply('`', '`')}>Code</button>
          <button type="button" onClick={() => insert('\n\n```\\n\\n```\\n')}>Code block</button>
          <button type="button" onClick={() => apply('## ', '')}>H2</button>
          <button type="button" onClick={() => apply('### ', '')}>H3</button>
          <button type="button" onClick={() => apply('[text](', ')')}>Link</button>
          <button type="button" onClick={() => apply('<mark>', '</mark>')}>Highlight</button>
          <button type="button" onClick={() => apply('<span class=\"text-pink\">', '</span>')}>Pink</button>
          <button type="button" onClick={() => apply('<span class=\"text-blue\">', '</span>')}>Blue</button>
          <button type="button" onClick={() => apply('<span class=\"text-green\">', '</span>')}>Green</button>
        </div>
        <textarea
          ref={bodyRef}
          name="body"
          placeholder="Write your post... (Markdown supported)"
          required
          defaultValue={initialData?.body || ''}
          style={{ minHeight: 320 }}
        />
      </label>
      <button type="submit">{isEdit ? 'Update Post' : 'Create Post'}</button>
    </form>
  );
}

