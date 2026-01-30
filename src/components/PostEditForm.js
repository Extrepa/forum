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

export default function PostEditForm({
  action,
  initialData,
  titleLabel = 'Title',
  bodyLabel = 'Body',
  buttonLabel = 'Update Post',
  showImage = false,
}) {
  const bodyRef = useRef(null);
  const [colorsOpen, setColorsOpen] = useState(false);

  const apply = (before, after) => {
    if (!bodyRef.current) return;
    wrapSelection(bodyRef.current, before, after);
  };

  return (
    <form action={action} method="post" encType="multipart/form-data">
      <label>
        <div className="muted">{titleLabel}</div>
        <input 
          name="title" 
          placeholder={titleLabel} 
          required 
          defaultValue={initialData?.title || ''} 
        />
      </label>

      {showImage ? (
        <label>
          <div className="muted">Image (optional)</div>
          <input name="image" type="file" accept="image/*" />
        </label>
      ) : null}

      <label className="text-field">
        <div className="muted">{bodyLabel}</div>
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
              <button type="button" title="Pink" onClick={() => { apply('<span class="text-pink">', '</span>'); setColorsOpen(false); }}>P</button>
              <button type="button" title="Blue" onClick={() => { apply('<span class="text-blue">', '</span>'); setColorsOpen(false); }}>B</button>
              <button type="button" title="Green" onClick={() => { apply('<span class="text-green">', '</span>'); setColorsOpen(false); }}>G</button>
              <button type="button" title="Muted" onClick={() => { apply('<span class="text-muted">', '</span>'); setColorsOpen(false); }}>M</button>
            </span>
          ) : null}
        </div>
        <textarea
          ref={bodyRef}
          name="body"
          placeholder={bodyLabel}
          required
          defaultValue={initialData?.body || ''}
          style={{ minHeight: 180 }}
        />
      </label>

      <button type="submit">{buttonLabel}</button>
    </form>
  );
}
