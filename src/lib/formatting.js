/**
 * Wraps selected text with before/after strings. Dispatches input event so
 * controlled components (e.g. MentionableTextarea) stay in sync.
 */
export function wrapSelection(textarea, before, after = '') {
  if (!textarea) return;
  const start = textarea.selectionStart || 0;
  const end = textarea.selectionEnd || 0;
  const value = textarea.value;
  const selected = value.slice(start, end);
  const nextValue = value.slice(0, start) + before + selected + after + value.slice(end);
  textarea.value = nextValue;
  const cursor = start + before.length + selected.length + after.length;
  textarea.focus();
  textarea.setSelectionRange(cursor, cursor);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Inserts text at cursor. Dispatches input for sync with controlled components. */
export function insertAtCursor(textarea, text) {
  if (!textarea) return;
  const start = textarea.selectionStart || 0;
  const end = textarea.selectionEnd || 0;
  const value = textarea.value;
  const nextValue = value.slice(0, start) + text + value.slice(end);
  textarea.value = nextValue;
  const cursor = start + text.length;
  textarea.focus();
  textarea.setSelectionRange(cursor, cursor);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}
