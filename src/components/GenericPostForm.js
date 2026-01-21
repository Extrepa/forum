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

export default function GenericPostForm({
  action,
  type,
  titleLabel = 'Title',
  titlePlaceholder = 'Title',
  bodyLabel = 'Body',
  bodyPlaceholder = 'Write something...',
  buttonLabel = 'Post',
  requireImage = false,
  showImage = false,
  showPrivateToggle = true,
  defaultPrivate = false,
  titleRequired = false,
  bodyRequired = true,
}) {
  const bodyRef = useRef(null);

  const apply = (before, after) => {
    if (!bodyRef.current) return;
    wrapSelection(bodyRef.current, before, after);
  };

  return (
    <form action={action} method="post" encType="multipart/form-data">
      <input type="hidden" name="type" value={type} />

      <label>
        <div className="muted">{titleLabel}</div>
        <input name="title" placeholder={titlePlaceholder} required={titleRequired} />
      </label>

      {showPrivateToggle ? (
        <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="checkbox" name="is_private" value="1" defaultChecked={defaultPrivate} />
          <span className="muted">Members-only (signed-in users only)</span>
        </label>
      ) : null}

      {showImage ? (
        <label>
          <div className="muted">Image {requireImage ? '(required)' : '(optional)'}</div>
          <input name="image" type="file" accept="image/*" required={requireImage} />
        </label>
      ) : null}

      <label className="text-field">
        <div className="muted">{bodyLabel}</div>
        <div className="formatting-toolbar">
          <button type="button" onClick={() => apply('**', '**')}>Bold</button>
          <button type="button" onClick={() => apply('*', '*')}>Italic</button>
          <button type="button" onClick={() => apply('> ', '')}>Quote</button>
          <button type="button" onClick={() => apply('- ', '')}>List</button>
          <button type="button" onClick={() => apply('## ', '')}>H2</button>
          <button type="button" onClick={() => apply('### ', '')}>H3</button>
          <button type="button" onClick={() => apply('`', '`')}>Code</button>
          <button type="button" onClick={() => apply('\n```\n', '\n```\n')}>Code block</button>
          <button type="button" onClick={() => apply('[text](', ')')}>Link</button>
        </div>
        <textarea
          ref={bodyRef}
          name="body"
          placeholder={bodyPlaceholder}
          required={bodyRequired}
          style={{ minHeight: 180 }}
        />
      </label>

      <button type="submit">{buttonLabel}</button>
    </form>
  );
}

