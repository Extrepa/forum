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

export default function MusicPostForm() {
  const bodyRef = useRef(null);

  const apply = (before, after) => {
    if (!bodyRef.current) {
      return;
    }
    wrapSelection(bodyRef.current, before, after);
  };

  return (
    <form action="/api/music/posts" method="post" encType="multipart/form-data">

      <label>
        <div className="muted">Title</div>
        <input name="title" placeholder="Song title" required />
      </label>

      <label>
        <div className="muted">Embed type</div>
        <select name="type" defaultValue="youtube" required>
          <option value="youtube">YouTube</option>
          <option value="soundcloud">SoundCloud</option>
        </select>
      </label>

      <label>
        <div className="muted">URL</div>
        <input name="url" placeholder="Paste the YouTube or SoundCloud link" required />
      </label>

      <label>
        <div className="muted">Tags (comma separated)</div>
        <input name="tags" placeholder="ambient, friend, live" />
      </label>

      <label>
        <div className="muted">Image (optional)</div>
        <input name="image" type="file" accept="image/*" />
      </label>

      <label className="text-field">
        <div className="muted">Notes</div>
        <div className="formatting-toolbar">
          <button type="button" onClick={() => apply('**', '**')}>Bold</button>
          <button type="button" onClick={() => apply('*', '*')}>Italic</button>
          <button type="button" onClick={() => apply('<u>', '</u>')}>Underline</button>
          <button type="button" onClick={() => apply('## ', '')}>H2</button>
          <button type="button" onClick={() => apply('### ', '')}>H3</button>
          <button type="button" onClick={() => apply('[text](', ')')}>Link</button>
        </div>
        <textarea ref={bodyRef} name="body" placeholder="Why you love this..." />
      </label>

      <button type="submit">Post to Music Feed</button>
    </form>
  );
}
