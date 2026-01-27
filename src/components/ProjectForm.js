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

export default function ProjectForm({ projectId, initialData }) {
  const descriptionRef = useRef(null);
  const [colorsOpen, setColorsOpen] = useState(false);

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
        </div>
      </details>
      <label>
        <div className="muted">Image (optional)</div>
        <input name="image" type="file" accept="image/*" />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: '4px 0 12px 0' }}>
        <input 
          type="checkbox" 
          name="updates_enabled" 
          defaultChecked={!!initialData?.updates_enabled} 
          style={{ width: 'auto', margin: 0 }}
        />
        <span className="muted" style={{ fontSize: '14px' }}>Enable "Project Updates" log for this project</span>
      </label>
      <label className="text-field">
        <div className="muted">Description</div>
        <div className="formatting-toolbar">
          <button type="button" title="Bold" onClick={() => apply('**', '**')}>B</button>
          <button type="button" title="Italic" onClick={() => apply('*', '*')}>I</button>
          <button type="button" title="Underline" onClick={() => apply('<u>', '</u>')}>U</button>
          <button type="button" title="Bullet list" onClick={() => apply('\n- ', '')}>-</button>
          <button type="button" title="Numbered list" onClick={() => apply('\n1. ', '')}>1.</button>
          <button type="button" title="Quote" onClick={() => apply('\n> ', '')}>&gt;</button>
          <button type="button" title="Inline code" onClick={() => apply('`', '`')}>`</button>
          <button type="button" title="Code block" onClick={() => apply('\n```\n', '\n```\n')}>```</button>
          <button type="button" title="Heading 2" onClick={() => apply('## ', '')}>H2</button>
          <button type="button" title="Heading 3" onClick={() => apply('### ', '')}>H3</button>
          <button type="button" title="Link" onClick={() => apply('[text](', ')')}>[]</button>
          <button
            type="button"
            title="Colors"
            onClick={() => setColorsOpen((v) => !v)}
            aria-expanded={colorsOpen ? 'true' : 'false'}
          >
            Clr
          </button>
          {colorsOpen ? (
            <span className="color-palette">
              <button type="button" title="Pink" onClick={() => { apply('<span class=\"text-pink\">', '</span>'); setColorsOpen(false); }}>P</button>
              <button type="button" title="Blue" onClick={() => { apply('<span class=\"text-blue\">', '</span>'); setColorsOpen(false); }}>B</button>
              <button type="button" title="Green" onClick={() => { apply('<span class=\"text-green\">', '</span>'); setColorsOpen(false); }}>G</button>
              <button type="button" title="Muted" onClick={() => { apply('<span class=\"text-muted\">', '</span>'); setColorsOpen(false); }}>M</button>
            </span>
          ) : null}
        </div>
        <textarea
          ref={descriptionRef}
          name="description"
          placeholder="Describe the idea... (bullets, links, images, whatever helps)"
          required
          defaultValue={initialData?.description || ''}
        />
      </label>
      <button type="submit">{isEdit ? 'Update Project' : 'Create Project'}</button>
    </form>
  );
}
