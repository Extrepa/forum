'use client';

import { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import Username from './Username';

/**
 * Parses text before cursor for @mention trigger.
 * Returns { query, startIndex } if we're in a mention context, else null.
 * Query is the fragment after @ (e.g. "jo" from "@jo").
 */
function parseMentionTrigger(text, cursorPos) {
  const before = text.slice(0, cursorPos);
  const lastAt = before.lastIndexOf('@');
  if (lastAt === -1) return null;
  // @ must be at start or preceded by whitespace (not part of email)
  const charBefore = lastAt > 0 ? before[lastAt - 1] : ' ';
  if (charBefore !== ' ' && charBefore !== '\n') return null;
  const afterAt = before.slice(lastAt + 1);
  // Query cannot contain spaces
  if (afterAt.includes(' ') || afterAt.includes('\n')) return null;
  return { query: afterAt, startIndex: lastAt };
}

const MentionableTextarea = forwardRef(function MentionableTextarea({
  value: controlledValue,
  onChange: controlledOnChange,
  defaultValue,
  placeholder,
  rows = 4,
  style,
  innerRef,
  className,
  forMentions = true, // true = forum-wide users (posts/comments), false = messageable only (DMs)
  ...rest
}, ref) {
  const isControlled = controlledValue !== undefined && controlledOnChange !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const value = isControlled ? controlledValue : internalValue;
  const setValue = isControlled ? controlledOnChange : (v) => setInternalValue(typeof v === 'string' ? v : '');
  const [mentionUsers, setMentionUsers] = useState([]);
  const [mentionTrigger, setMentionTrigger] = useState(null);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);
  const mentionDebounceRef = useRef(null);
  const textareaRef = useRef(null);
  const containerRef = useRef(null);

  const textareaRefOrInner = innerRef || textareaRef;

  useImperativeHandle(ref, () => ({
    setValue: (v) => setValue(typeof v === 'string' ? v : ''),
    focus: () => textareaRefOrInner?.current?.focus?.(),
  }), [setValue, textareaRefOrInner]);

  const fetchMentionUsers = useCallback(async (query) => {
    setMentionLoading(true);
    try {
      const mentionParam = forMentions ? '&for=mentions' : '';
      const url = query
        ? `/api/messages/users?q=${encodeURIComponent(query)}${mentionParam}`
        : `/api/messages/users?list=all${mentionParam}`;
      const res = await fetch(url);
      const data = await res.json();
      setMentionUsers(data.users || []);
      setMentionIndex(0);
    } catch {
      setMentionUsers([]);
    } finally {
      setMentionLoading(false);
    }
  }, [forMentions]);

  const handleChange = (e) => {
    const v = e.target.value;
    const pos = e.target.selectionStart ?? v.length;
    setValue(v);

    const trigger = parseMentionTrigger(v, pos);
    if (!trigger) {
      setMentionTrigger(null);
      setMentionUsers([]);
      return;
    }

    setMentionTrigger(trigger);

    if (mentionDebounceRef.current) clearTimeout(mentionDebounceRef.current);
    mentionDebounceRef.current = setTimeout(() => {
      fetchMentionUsers(trigger.query);
    }, 150);
  };

  const insertMention = useCallback((username) => {
    if (!textareaRefOrInner?.current || !mentionTrigger) return;
    const ta = textareaRefOrInner.current;
    const { startIndex } = mentionTrigger;
    const currentVal = ta.value ?? '';
    const before = currentVal.slice(0, startIndex);
    const after = currentVal.slice(ta.selectionStart ?? currentVal.length);
    const replacement = `@${username} `;
    const next = before + replacement + after;
    setValue(next);
    setMentionTrigger(null);
    setMentionUsers([]);
    setTimeout(() => {
      ta.focus();
      const pos = startIndex + replacement.length;
      ta.setSelectionRange(pos, pos);
    }, 0);
  }, [textareaRefOrInner, mentionTrigger, setValue]);

  const handleKeyDown = (e) => {
    if (!mentionTrigger || mentionUsers.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMentionIndex((i) => (i + 1) % mentionUsers.length);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMentionIndex((i) => (i - 1 + mentionUsers.length) % mentionUsers.length);
      return;
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const u = mentionUsers[mentionIndex];
      if (u) insertMention(u.username);
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setMentionTrigger(null);
      setMentionUsers([]);
    }
  };

  // Close mention popover on click outside
  useEffect(() => {
    if (!mentionTrigger) return;
    const onPointerDown = (ev) => {
      if (containerRef.current && !containerRef.current.contains(ev.target)) {
        setMentionTrigger(null);
        setMentionUsers([]);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [mentionTrigger]);

  const showMentionPopover = mentionTrigger && (mentionUsers.length > 0 || mentionLoading);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <textarea
        ref={textareaRefOrInner}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={className}
        style={{ ...style, width: '100%' }}
        {...rest}
      />
      {showMentionPopover && (
        <div
          className="messages-compose-userlist"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            right: 0,
            marginBottom: 4,
            zIndex: 100,
          }}
        >
          <div className="muted" style={{ padding: '6px 10px', fontSize: 11 }}>
            {mentionLoading ? 'Loading...' : 'Mention a user'}
          </div>
          {!mentionLoading &&
            mentionUsers.map((u, i) => (
              <button
                key={u.id}
                type="button"
                className="messages-compose-user-option"
                style={{
                  background: i === mentionIndex ? 'rgba(52, 225, 255, 0.15)' : undefined,
                }}
                onClick={() => insertMention(u.username)}
              >
                <Username name={u.username} preferredColorIndex={u.preferred_username_color_index} />
              </button>
            ))}
        </div>
      )}
    </div>
  );
});

export default MentionableTextarea;
