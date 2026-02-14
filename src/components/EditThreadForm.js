'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import MarkdownUploader from './MarkdownUploader';

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

export default function EditThreadForm({
  threadId,
  initialTitle,
  initialBody,
  initialHasImage = false,
  allowImageUploads = true,
  onCancel
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [colorsOpen, setColorsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const bodyRef = useRef(null);

  const apply = (before, after) => {
    if (!bodyRef.current) return;
    wrapSelection(bodyRef.current, before, after);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.set('title', String(title || '').trim());
    formData.set('body', String(bodyRef.current?.value || '').trim());

    try {
      const response = await fetch(`/api/forum/${threadId}/edit`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        if (onCancel) {
          onCancel();
        } else {
          router.refresh();
        }
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update thread');
      }
    } catch (e) {
      alert('Error updating thread');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data" style={{ marginTop: '16px' }}>
      <label>
        <div className="muted">Title</div>
        <input
          name="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ width: '100%', marginBottom: '12px', maxWidth: '100%' }}
        />
      </label>
      {allowImageUploads ? (
        <label>
          <div className="muted">Image (optional)</div>
          <input name="image" type="file" accept="image/*" />
          {initialHasImage ? (
            <div className="muted image-note">Current image will be kept unless you upload a new one.</div>
          ) : null}
        </label>
      ) : (
        <div className="muted image-note">Image uploads are temporarily disabled by the admin.</div>
      )}
      <MarkdownUploader
        targetRef={bodyRef}
        helper="Upload a Markdown file to auto-fill the body."
      />
      <label className="text-field">
        <div className="muted">Body</div>
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
          defaultValue={initialBody}
          required
          style={{ width: '100%', minHeight: '120px', marginBottom: '12px' }}
        />
      </label>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="submit" disabled={isSubmitting} className="button">
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="button ghost">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
