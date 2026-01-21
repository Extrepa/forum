'use client';

import { useState, useRef, useEffect } from 'react';
import { quoteMarkdown, combineQuotes } from '../lib/quotes';

export default function ReplyForm({ threadId, initialQuotes = [], action }) {
  const [selectedQuotes, setSelectedQuotes] = useState(initialQuotes);
  const [colorsOpen, setColorsOpen] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (selectedQuotes.length > 0 && bodyRef.current) {
      const combinedQuotes = combineQuotes(selectedQuotes);
      bodyRef.current.value = combinedQuotes;
    }
  }, [selectedQuotes]);

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

  const apply = (before, after) => {
    if (!bodyRef.current) return;
    wrapSelection(bodyRef.current, before, after);
  };

  const removeQuote = (quoteId) => {
    setSelectedQuotes(prev => prev.filter(q => q.id !== quoteId));
  };

  const clearAllQuotes = () => {
    setSelectedQuotes([]);
    if (bodyRef.current) {
      bodyRef.current.value = '';
    }
  };

  return (
    <form action={action} method="post" className="reply-form">
      {selectedQuotes.length > 0 && (
        <div style={{ marginBottom: '12px', padding: '12px', background: 'rgba(22, 58, 74, 0.3)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <strong style={{ fontSize: '14px' }}>Quoting {selectedQuotes.length} {selectedQuotes.length === 1 ? 'reply' : 'replies'}</strong>
            <button type="button" onClick={clearAllQuotes} style={{ fontSize: '12px', padding: '4px 8px' }}>
              Clear all
            </button>
          </div>
          {selectedQuotes.map((quote) => (
            <div key={quote.id} style={{ marginBottom: '8px', padding: '8px', background: 'rgba(4, 16, 23, 0.5)', borderRadius: '4px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <strong>@{quote.author_name}</strong>
                  <div style={{ marginTop: '4px', opacity: 0.8 }}>{quote.body.substring(0, 100)}{quote.body.length > 100 ? '...' : ''}</div>
                </div>
                <button 
                  type="button" 
                  onClick={() => removeQuote(quote.id)}
                  style={{ marginLeft: '8px', padding: '2px 6px', fontSize: '11px' }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <label>
        <div className="muted" style={{ marginBottom: '8px' }}>
          Add a reply
        </div>
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
          placeholder="Write your reply..." 
          required 
        />
      </label>
      <button type="submit">Post reply</button>
    </form>
  );
}
