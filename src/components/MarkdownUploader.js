'use client';

import { useRef, useState } from 'react';

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.md', '.markdown'];

export default function MarkdownUploader({
  targetRef,
  label = 'Upload Markdown file (optional)',
  helper,
  disabled = false
}) {
  const [fileName, setFileName] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const clearSelection = () => {
    setFileName(null);
    setError(null);
    setLoading(false);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleChange = (event) => {
    const file = event.target?.files?.[0];
    if (!file) {
      clearSelection();
      return;
    }
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setError('Please select a .md or .markdown file.');
      setFileName(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      setLoading(false);
      return;
    }
    if (file.size > MAX_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setError(`File is too large (${sizeMB}MB). Maximum is 5MB.`);
      setFileName(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      setLoading(false);
      return;
    }
    setError(null);
    setFileName(file.name);
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const content = String(loadEvent.target?.result || '');
      if (targetRef?.current) {
        targetRef.current.value = content;
        const evt = new Event('input', { bubbles: true });
        targetRef.current.dispatchEvent(evt);
      }
      setLoading(false);
    };
    reader.onerror = () => {
      setError('Error reading file. Please try again.');
      setFileName(null);
      setLoading(false);
    };
    reader.readAsText(file);
  };

  return (
    <label className="markdown-upload" style={{ display: 'block' }}>
      <div className="muted" style={{ marginBottom: '6px' }}>{label}</div>
      <input
        ref={inputRef}
        type="file"
        accept=".md,.markdown"
        onChange={handleChange}
        disabled={disabled}
      />
      {loading ? (
        <div className="muted" style={{ fontSize: '13px', marginTop: '6px' }}>Loading...</div>
      ) : null}
      {fileName ? (
        <div className="muted" style={{ fontSize: '13px', marginTop: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span>✓ {fileName}</span>
          <button
            type="button"
            onClick={clearSelection}
            className="button ghost mini"
            style={{ padding: '2px 6px' }}
          >
            Clear
          </button>
        </div>
      ) : null}
      {error ? (
        <div className="notice" style={{ marginTop: '6px' }}>{error}</div>
      ) : null}
      {helper ? <div className="muted" style={{ fontSize: '12px', marginTop: '4px' }}>{helper}</div> : null}
    </label>
  );
}
