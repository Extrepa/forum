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
  const markdownFileInputRef = useRef(null);
  const [quickUpdate, setQuickUpdate] = useState(false);
  const [colorsOpen, setColorsOpen] = useState(false);
  const [markdownFileName, setMarkdownFileName] = useState(null);
  const [isLoadingMarkdown, setIsLoadingMarkdown] = useState(false);
  const [markdownError, setMarkdownError] = useState(null);

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
      <label>
        <div className="muted">Upload Markdown file (optional)</div>
        <input 
          ref={markdownFileInputRef}
          type="file" 
          accept=".md,.markdown" 
          onChange={(e) => {
            const file = e.target.files[0];
            if (!file) {
              setMarkdownFileName(null);
              setMarkdownError(null);
              return;
            }

            // Validate file type
            const validExtensions = ['.md', '.markdown'];
            const fileName = file.name.toLowerCase();
            const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
            if (!validExtensions.includes(fileExtension)) {
              setMarkdownError(`Invalid file type. Please select a .md or .markdown file.`);
              setMarkdownFileName(null);
              if (markdownFileInputRef.current) {
                markdownFileInputRef.current.value = '';
              }
              return;
            }

            // Validate file size (5MB limit)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
              const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
              setMarkdownError(`File is too large (${sizeMB}MB). Maximum size is 5MB.`);
              setMarkdownFileName(null);
              if (markdownFileInputRef.current) {
                markdownFileInputRef.current.value = '';
              }
              return;
            }

            // Clear previous errors and set loading state
            setMarkdownError(null);
            setMarkdownFileName(file.name);
            setIsLoadingMarkdown(true);

            // Read file
            if (!bodyRef.current) {
              setMarkdownError('Unable to read file. Please try again.');
              setIsLoadingMarkdown(false);
              setMarkdownFileName(null);
              return;
            }

            try {
              const reader = new FileReader();
              
              reader.onload = (event) => {
                try {
                  bodyRef.current.value = event.target.result;
                  setIsLoadingMarkdown(false);
                } catch (err) {
                  setMarkdownError('Error loading file content. Please try again.');
                  setIsLoadingMarkdown(false);
                  setMarkdownFileName(null);
                }
              };

              reader.onerror = () => {
                setMarkdownError('Error reading file. Please try again.');
                setIsLoadingMarkdown(false);
                setMarkdownFileName(null);
                if (markdownFileInputRef.current) {
                  markdownFileInputRef.current.value = '';
                }
              };

              reader.readAsText(file);
            } catch (err) {
              setMarkdownError('Unexpected error. Please try again.');
              setIsLoadingMarkdown(false);
              setMarkdownFileName(null);
              if (markdownFileInputRef.current) {
                markdownFileInputRef.current.value = '';
              }
            }
          }}
        />
        {markdownFileName && !markdownError && (
          <div style={{ marginTop: 8, fontSize: '14px', color: 'var(--muted)' }}>
            <span style={{ marginRight: 8 }}>✓ {markdownFileName}</span>
            <button
              type="button"
              onClick={() => {
                setMarkdownFileName(null);
                setMarkdownError(null);
                if (markdownFileInputRef.current) {
                  markdownFileInputRef.current.value = '';
                }
              }}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--muted)',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Clear
            </button>
          </div>
        )}
        {isLoadingMarkdown && (
          <div style={{ marginTop: 8, fontSize: '14px', color: 'var(--muted)' }}>
            Loading file...
          </div>
        )}
        {markdownError && (
          <div style={{ marginTop: 8, fontSize: '14px', color: '#ff6b6b' }}>
            {markdownError}
          </div>
        )}
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
          <button type="button" title="Bold" onClick={() => apply('**', '**')}>B</button>
          <button type="button" title="Italic" onClick={() => apply('*', '*')}>I</button>
          <button type="button" title="Underline" onClick={() => apply('<u>', '</u>')}>U</button>
          <button type="button" title="Bullet list" onClick={() => insert('\n- ')}>-</button>
          <button type="button" title="Numbered list" onClick={() => insert('\n1. ')}>1.</button>
          <button type="button" title="Quote" onClick={() => insert('\n> ')}>&gt;</button>
          <button type="button" title="Inline code" onClick={() => apply('`', '`')}>`</button>
          <button type="button" title="Code block" onClick={() => insert('\n\n```\\n\\n```\\n')}>```</button>
          <button type="button" title="Heading 2" onClick={() => apply('## ', '')}>H2</button>
          <button type="button" title="Heading 3" onClick={() => apply('### ', '')}>H3</button>
          <button type="button" title="Link" onClick={() => apply('[text](', ')')}>[]</button>
          <button type="button" title="Highlight" onClick={() => apply('<mark>', '</mark>')}>HL</button>
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

