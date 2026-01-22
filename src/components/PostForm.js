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

// Helper function to convert UTC timestamp to local datetime-local format
// The Date constructor interprets the timestamp as UTC, and getHours/getMinutes
// return local time values, which is what we want for datetime-local input
function toLocalDateTimeString(utcTimestamp) {
  if (!utcTimestamp) return '';
  const date = new Date(utcTimestamp); // Date constructor interprets timestamp as UTC
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0'); // Local time
  const minutes = String(date.getMinutes()).padStart(2, '0'); // Local time
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function PostForm({
  action,
  titleLabel,
  bodyLabel,
  buttonLabel,
  showDate = false,
  titleRequired = true,
  bodyRequired = true,
  showImage = false,
  initialData
}) {
  const bodyRef = useRef(null);
  const [colorsOpen, setColorsOpen] = useState(false);

  const apply = (before, after) => {
    if (!bodyRef.current) {
      return;
    }
    wrapSelection(bodyRef.current, before, after);
  };

  return (
    <form action={action} method="post" encType="multipart/form-data">
      <label>
        <div className="muted">{titleLabel}</div>
        <input name="title" placeholder={titleLabel || 'Title'} required={titleRequired} defaultValue={initialData?.title || ''} />
      </label>
      {showDate ? (
        <label>
          <div className="muted">Date and time</div>
          <input 
            name="starts_at" 
            type="datetime-local" 
            required 
            defaultValue={initialData?.starts_at ? toLocalDateTimeString(initialData.starts_at) : ''}
          />
        </label>
      ) : null}
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
              <button type="button" title="Pink" onClick={() => { apply('<span class=\"text-pink\">', '</span>'); setColorsOpen(false); }}>P</button>
              <button type="button" title="Blue" onClick={() => { apply('<span class=\"text-blue\">', '</span>'); setColorsOpen(false); }}>B</button>
              <button type="button" title="Green" onClick={() => { apply('<span class=\"text-green\">', '</span>'); setColorsOpen(false); }}>G</button>
              <button type="button" title="Muted" onClick={() => { apply('<span class=\"text-muted\">', '</span>'); setColorsOpen(false); }}>M</button>
            </span>
          ) : null}
        </div>
        <textarea
          ref={bodyRef}
          name="body"
          placeholder={bodyLabel || 'Share the details...'}
          required={bodyRequired}
          defaultValue={initialData?.body || initialData?.details || ''}
        />
      </label>
      <button type="submit">{buttonLabel}</button>
    </form>
  );
}
