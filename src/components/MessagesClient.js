'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Username from './Username';
import { formatTimeAgo, formatDateTimeShort } from '../lib/dates';
import { getUsernameColorIndex } from '../lib/usernameColor';
import { renderMarkdown } from '../lib/markdown';
import CreatePostModal from './CreatePostModal';

const MOBILE_BREAKPOINT = 720;
/* Shared with sidebar/conversation UI (compose modal uses CreatePostModal + global form styles) */
const BUTTON_STYLE = {
  padding: '8px 16px',
  borderRadius: '999px',
  border: '1px solid rgba(52, 225, 255, 0.35)',
  background: 'rgba(2, 7, 10, 0.6)',
  color: 'var(--muted)',
  fontWeight: 600,
  fontSize: '13px',
  cursor: 'pointer',
};
const INPUT_STYLE = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '12px',
  border: '1px solid rgba(52, 225, 255, 0.3)',
  background: 'rgba(2, 7, 10, 0.6)',
  color: 'var(--ink)',
  fontSize: '14px',
};

function truncate(str, max = 60) {
  if (!str) return '';
  const s = String(str).trim();
  return s.length <= max ? s : s.slice(0, max - 1) + '...';
}

function applyFormatting(textareaRef, setBody, before, after = '') {
  if (!textareaRef?.current) return;
  const ta = textareaRef.current;
  const start = ta.selectionStart || 0;
  const end = ta.selectionEnd || 0;
  const value = ta.value;
  const selected = value.slice(start, end);
  const nextValue = value.slice(0, start) + before + selected + after + value.slice(end);
  const cursor = start + before.length + selected.length + after.length;
  setBody(nextValue);
  setTimeout(() => {
    ta.focus();
    ta.setSelectionRange(cursor, cursor);
  }, 0);
}

export default function MessagesClient({ user, isAdmin }) {
  const searchParams = useSearchParams();
  const initialConversationId = searchParams?.get('conversation') || searchParams?.get('id') || null;

  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(initialConversationId);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingConv, setLoadingConv] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [composeBody, setComposeBody] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [broadcastRole, setBroadcastRole] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'conversation'
  const [recentUsers, setRecentUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const replyBodyRef = useRef(null);
  const composeBodyRef = useRef(null);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/messages/conversations');
      if (!res.ok) throw new Error('Failed to load conversations');
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchConversation = useCallback(async (id) => {
    if (!id) {
      setConversation(null);
      setMessages([]);
      return;
    }
    setLoadingConv(true);
    try {
      const res = await fetch(`/api/messages/conversations/${id}`);
      if (!res.ok) throw new Error('Failed to load conversation');
      const data = await res.json();
      setConversation(data.conversation);
      setMessages(data.messages || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingConv(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    setSelectedId(initialConversationId);
  }, [initialConversationId]);

  useEffect(() => {
    if (isMobile) {
      setMobileView(selectedId ? 'conversation' : 'list');
    }
  }, [selectedId, isMobile]);

  useEffect(() => {
    setError(null);
    if (selectedId) {
      fetchConversation(selectedId);
    } else {
      setConversation(null);
      setMessages([]);
    }
  }, [selectedId, fetchConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const body = String(composeBody).trim();
    if (!body || !conversation) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/messages/conversations/${conversation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setMessages((prev) => [...prev, data.message]);
      setComposeBody('');
      setError(null);
      fetchConversations();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleComposeSubmit = async (e) => {
    e.preventDefault();
    const body = String(composeBody).trim();
    if (!body && selectedUsers.length === 0 && !broadcastRole) return;
    if (!broadcastRole && selectedUsers.length === 0) {
      setError('Select at least one recipient');
      return;
    }
    setSending(true);
    setError(null);
    try {
      const payload = {
        participantIds: selectedUsers.map((u) => u.id),
        body: body || undefined,
        subject: composeSubject || undefined,
        broadcastRole: broadcastRole || undefined,
      };
      const res = await fetch('/api/messages/conversations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create');
      setComposeOpen(false);
      setComposeBody('');
      setComposeSubject('');
      setSelectedUsers([]);
      setBroadcastRole('');
      setSelectedId(data.conversationId);
      fetchConversations();
      fetchConversation(data.conversationId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (composeOpen) {
      fetch('/api/messages/users?list=recent')
        .then((r) => r.json())
        .then((d) => setRecentUsers(d.users || []))
        .catch(() => setRecentUsers([]));
    } else {
      setRecentUsers([]);
    }
  }, [composeOpen]);

  useEffect(() => {
    if (!userSearch || userSearch.length < 2) {
      setUserResults([]);
      return;
    }
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/messages/users?q=${encodeURIComponent(userSearch)}`);
        const data = await res.json();
        setUserResults(data.users || []);
      } catch {
        setUserResults([]);
      }
    }, 200);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [userSearch]);

  const addUser = (u) => {
    if (selectedUsers.some((x) => x.id === u.id)) return;
    setSelectedUsers((prev) => [...prev, u]);
    setUserSearch('');
    setUserResults([]);
  };

  const removeUser = (id) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== id));
  };

  if (!user) {
    return (
      <div className="card" style={{ padding: '16px 20px' }}>
        <h2 style={{ marginTop: 0 }}>Messages</h2>
        <p className="muted">Log in to send and view private messages.</p>
        <Link href="/account?tab=login" className="link" style={{ color: 'var(--errl-accent)' }}>
          Log in
        </Link>
      </div>
    );
  }

  const showSidebar = !isMobile || mobileView === 'list';
  const showMain = !isMobile || mobileView === 'conversation';

  return (
    <div
      className="messages-layout"
      style={{
        display: 'flex',
        minHeight: 400,
        marginTop: 4,
        gap: 0,
      }}
    >
      <aside
        className="messages-sidebar"
        style={{
          width: isMobile ? '100%' : 280,
          flexShrink: 0,
          padding: '16px 20px',
          borderRight: isMobile ? 'none' : '1px solid rgba(22, 58, 74, 0.4)',
          background: isMobile ? 'transparent' : 'rgba(4, 16, 23, 0.35)',
          maxHeight: isMobile ? 'none' : 'min(70vh, 520px)',
          overflowY: 'auto',
          display: showSidebar ? undefined : 'none',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: '16px' }}>Inbox</h2>
          <button
            type="button"
            onClick={() => setComposeOpen(true)}
            style={{
              ...BUTTON_STYLE,
              borderColor: 'rgba(255, 52, 245, 0.4)',
              color: 'var(--errl-accent-2)',
            }}
          >
            New message
          </button>
        </div>

        {loading ? (
          <p className="muted" style={{ fontSize: 13 }}>Loading...</p>
        ) : conversations.length === 0 ? (
          <p className="muted" style={{ fontSize: 13 }}>No conversations yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: selectedId === c.id ? '1px solid rgba(255, 52, 245, 0.5)' : '1px solid transparent',
                  background: selectedId === c.id ? 'rgba(255, 52, 245, 0.12)' : 'transparent',
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  transition: 'background 0.2s, border-color 0.2s',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {c.type === 'group' && (
                    <span
                      style={{
                        fontSize: 10,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: 'rgba(255, 52, 245, 0.2)',
                        color: 'var(--errl-accent-2)',
                        fontWeight: 600,
                      }}
                    >
                      Group
                    </span>
                  )}
                  {c.display_name || 'Conversation'}
                  {c.type === 'group' && c.participants?.length > 0 && (
                    <span className="muted" style={{ fontSize: 10 }}>({c.participants.length} people)</span>
                  )}
                </div>
                <div className="muted" style={{ fontSize: 11, lineHeight: 1.3 }}>
                  {truncate(c.last_message_preview, 45)}
                </div>
                <div className="muted" style={{ fontSize: 10, marginTop: 4 }}>
                  {formatTimeAgo(c.last_message_at)}
                </div>
              </button>
            ))}
          </div>
        )}
      </aside>

      <div
        className="messages-main"
        style={{
          flex: 1,
          minWidth: 0,
          padding: '16px 20px',
          display: showMain ? 'flex' : 'none',
          flexDirection: 'column',
          maxHeight: isMobile ? 'none' : 'min(70vh, 520px)',
        }}
      >
        {isMobile && showMain && (
          <button
            type="button"
            onClick={() => setMobileView('list')}
            style={{
              ...BUTTON_STYLE,
              alignSelf: 'flex-start',
              marginBottom: 12,
              fontSize: 12,
            }}
          >
            ← Back to inbox
          </button>
        )}
        {!selectedId ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p className="muted" style={{ textAlign: 'center' }}>
              Select a conversation or start a new one.
            </p>
          </div>
        ) : loadingConv ? (
          <p className="muted">Loading...</p>
        ) : conversation ? (
          <>
            <div
              style={{
                borderBottom: '1px solid rgba(52, 225, 255, 0.2)',
                paddingBottom: 12,
                marginBottom: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 15 }}>
                  {conversation.display_name || 'Conversation'}
                </h3>
                <div className="muted" style={{ fontSize: 12 }}>
                  {conversation.participants?.map((p) => p.username).join(', ')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!conversation?.id || !window.confirm('Permanently delete this conversation? This cannot be undone.')) return;
                      try {
                        const res = await fetch(`/api/messages/conversations/${conversation.id}`, { method: 'DELETE' });
                        if (res.ok) {
                          setSelectedId(null);
                          setConversation(null);
                          setMessages([]);
                          fetchConversations();
                        } else {
                          setError('Failed to delete');
                        }
                      } catch (e) {
                        setError('Failed to delete');
                      }
                    }}
                    style={{
                      ...BUTTON_STYLE,
                      fontSize: 11,
                      padding: '6px 12px',
                      opacity: 0.8,
                      color: '#ff6b6b',
                    }}
                  >
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    if (!conversation?.id) return;
                    try {
                      const res = await fetch(`/api/messages/conversations/${conversation.id}/leave`, { method: 'POST' });
                      if (res.ok) {
                        setSelectedId(null);
                        setConversation(null);
                        setMessages([]);
                        fetchConversations();
                      }
                    } catch (e) {
                      setError('Failed to leave');
                    }
                  }}
                  style={{
                    ...BUTTON_STYLE,
                    fontSize: 11,
                    padding: '6px 12px',
                    opacity: 0.8,
                  }}
                >
                  Leave
                </button>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                marginBottom: 12,
              }}
            >
              {messages.map((m) => {
                const isOwn = m.author_user_id === user.id;
                const colorIdx = getUsernameColorIndex(m.author_username, {
                  preferredColorIndex: m.author_color_preference,
                });
                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: isOwn ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      padding: '10px 14px',
                      borderRadius: '14px',
                      background: isOwn ? 'rgba(52, 225, 255, 0.15)' : 'rgba(7, 27, 37, 0.8)',
                      border: `1px solid ${isOwn ? 'rgba(52, 225, 255, 0.3)' : 'rgba(52, 225, 255, 0.2)'}`,
                    }}
                  >
                    <div style={{ fontSize: 11, marginBottom: 4 }}>
                      <Username
                        name={m.author_username}
                        preferredColorIndex={m.author_color_preference}
                      />
                      {' · '}
                      <span className="muted">{formatDateTimeShort(m.created_at)}</span>
                    </div>
                    <div
                      className="dm-message-body"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(m.body),
                      }}
                      style={{ fontSize: 14, lineHeight: 1.5 }}
                    />
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {error && (
              <p style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 8 }}>{error}</p>
            )}

            <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="formatting-toolbar" style={{ marginBottom: 0 }}>
                <button type="button" title="Bold" onClick={() => applyFormatting(replyBodyRef, setComposeBody, '**', '**')}>B</button>
                <button type="button" title="Italic" onClick={() => applyFormatting(replyBodyRef, setComposeBody, '*', '*')}>I</button>
                <button type="button" title="Code" onClick={() => applyFormatting(replyBodyRef, setComposeBody, '`', '`')}>`</button>
                <button type="button" title="Link" onClick={() => applyFormatting(replyBodyRef, setComposeBody, '[text](', ')')}>[]</button>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea
                  ref={replyBodyRef}
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Write a message... (Markdown supported)"
                  rows={2}
                  style={{
                    ...INPUT_STYLE,
                    flex: 1,
                    resize: 'vertical',
                    minHeight: 44,
                  }}
                />
                <button
                  type="submit"
                  disabled={sending || !composeBody.trim()}
                  style={{
                    ...BUTTON_STYLE,
                    opacity: sending || !composeBody.trim() ? 0.6 : 1,
                  }}
                >
                  Send
                </button>
              </div>
            </form>
          </>
        ) : null}
      </div>

      <CreatePostModal
        isOpen={composeOpen}
        onClose={() => setComposeOpen(false)}
        title="New message"
        className="messages-compose-modal"
        maxWidth="440px"
        maxHeight="90vh"
        confirmOnUnsavedChanges={false}
      >
        <form onSubmit={handleComposeSubmit} className="stack" style={{ gap: 16 }}>
          {isAdmin && (
            <label className="text-field">
              <div className="muted">Admin: Send to role</div>
              <select
                value={broadcastRole}
                onChange={(e) => setBroadcastRole(e.target.value)}
              >
                <option value="">-- Select role (optional) --</option>
                <option value="all">All users</option>
                <option value="user">Driplets (user)</option>
                <option value="drip_nomad">Drip Nomads</option>
                <option value="mod">Moderators</option>
                <option value="admin">Admins</option>
              </select>
            </label>
          )}

          {!broadcastRole && (
            <>
              <label className="text-field">
                <div className="muted">To</div>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder={recentUsers.length > 0 ? 'Search users or pick from recent below' : 'Type 2+ characters to search users'}
                  autoComplete="off"
                />
                {recentUsers.length > 0 && userSearch.length < 2 && (
                  <p className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                    Recent conversations shown below. Or type to search.
                  </p>
                )}
                {selectedUsers.length >= 2 && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: '8px 12px',
                      borderRadius: '12px',
                      background: 'rgba(255, 52, 245, 0.12)',
                      border: '1px solid rgba(255, 52, 245, 0.3)',
                      fontSize: 12,
                      color: 'var(--errl-accent-2)',
                    }}
                  >
                    Group conversation ({selectedUsers.length} recipients). Add a subject below to name the group.
                  </div>
                )}
                {userSearch.length >= 2 && userResults.length > 0 && (
                  <div className="messages-compose-userlist">
                    <div className="muted" style={{ padding: '6px 10px', fontSize: 11 }}>Search results</div>
                    {userResults.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => addUser(u)}
                        disabled={selectedUsers.some((x) => x.id === u.id)}
                        className="messages-compose-user-option"
                      >
                        <Username name={u.username} preferredColorIndex={u.preferred_username_color_index} />
                      </button>
                    ))}
                  </div>
                )}
                {userSearch.length < 2 && recentUsers.length > 0 && (
                  <div className="messages-compose-userlist">
                    <div className="muted" style={{ padding: '6px 10px', fontSize: 11 }}>Recent conversations</div>
                    {recentUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => addUser(u)}
                        disabled={selectedUsers.some((x) => x.id === u.id)}
                        className="messages-compose-user-option"
                      >
                        <Username name={u.username} preferredColorIndex={u.preferred_username_color_index} />
                      </button>
                    ))}
                  </div>
                )}
                {selectedUsers.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {selectedUsers.map((u) => (
                      <span
                        key={u.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          borderRadius: 999,
                          background: 'rgba(52, 225, 255, 0.2)',
                          fontSize: 12,
                        }}
                      >
                        {u.username}
                        <button
                          type="button"
                          onClick={() => removeUser(u.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--muted)',
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: 14,
                          }}
                          aria-label={`Remove ${u.username}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </label>
              <label className="text-field">
                <div className="muted">
                  {selectedUsers.length >= 2 ? 'Group name (recommended)' : 'Subject (optional, for groups)'}
                </div>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder={selectedUsers.length >= 2 ? 'e.g. Trip planning, Project team' : 'Group subject'}
                />
              </label>
            </>
          )}

          <label className="text-field">
            <div className="muted">Message</div>
            <div className="formatting-toolbar" style={{ marginBottom: 6 }}>
              <button type="button" title="Bold" onClick={() => applyFormatting(composeBodyRef, setComposeBody, '**', '**')}>B</button>
              <button type="button" title="Italic" onClick={() => applyFormatting(composeBodyRef, setComposeBody, '*', '*')}>I</button>
              <button type="button" title="Code" onClick={() => applyFormatting(composeBodyRef, setComposeBody, '`', '`')}>`</button>
              <button type="button" title="Link" onClick={() => applyFormatting(composeBodyRef, setComposeBody, '[text](', ')')}>[]</button>
            </div>
            <textarea
              ref={composeBodyRef}
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              placeholder="Write your message... (Markdown supported)"
              rows={4}
              style={{ resize: 'vertical' }}
            />
          </label>

          {error && (
            <p style={{ color: '#ff6b6b', fontSize: 13 }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setComposeOpen(false)} className="button" style={{ background: 'rgba(2, 7, 10, 0.6)', color: 'var(--ink)', border: '1px solid rgba(52, 225, 255, 0.3)' }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="button"
              style={sending ? { opacity: 0.7 } : {}}
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </CreatePostModal>
    </div>
  );
}
