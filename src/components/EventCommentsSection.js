'use client';

import { useState, useEffect, useRef } from 'react';
import Username from './Username';
import { getUsernameColorIndex } from '../lib/usernameColor';
import { formatDateTime } from '../lib/dates';
import ReplyButton from './ReplyButton';
import DeleteCommentButton from './DeleteCommentButton';
import LikeButton from './LikeButton';

export default function EventCommentsSection({
  eventId,
  initialAttending,
  initialAttendees,
  comments,
  user,
  isAdmin = false,
  commentNotice,
  usernameColorMap = new Map(),
  isLocked = false,
  canRSVP = true,
  eventHasPassed = false,
  canInvite = false,
  invitableUsers = []
}) {
  const [attending, setAttending] = useState(initialAttending);
  const [attendees, setAttendees] = useState(initialAttendees || []);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState(() => new Set());
  const [selectedRoles, setSelectedRoles] = useState(() => new Set());
  const [inviteAll, setInviteAll] = useState(false);
  const [inviteFilter, setInviteFilter] = useState('');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteNotice, setInviteNotice] = useState('');
  const textareaRef = useRef(null);
  const hiddenReplyToRef = useRef(null);
  const attendeeLabel = eventHasPassed ? 'attended' : 'attending';
  const attendeeTitle = attendees.map((a) => a.username).filter(Boolean).join(', ');
  const availableRoles = Array.from(new Set(invitableUsers.map((u) => u.role).filter(Boolean))).sort();
  const filteredUsers = invitableUsers.filter((u) => {
    if (!inviteFilter.trim()) return true;
    return u.username.toLowerCase().includes(inviteFilter.trim().toLowerCase());
  });
  
  // Listen for dynamic reply changes from ReplyButton clicks
  useEffect(() => {
    const handleReplyToChanged = (event) => {
      const { replyId, replyAuthor } = event.detail;
      
      setReplyingTo({ id: replyId, author_name: replyAuthor, body: '' });
      
      if (hiddenReplyToRef.current) {
        hiddenReplyToRef.current.value = replyId;
      }
      if (textareaRef.current) {
        textareaRef.current.value = '';
      }
      setShowCommentBox(true);
    };
    
    window.addEventListener('replyToChanged', handleReplyToChanged);
    
    return () => {
      window.removeEventListener('replyToChanged', handleReplyToChanged);
    };
  }, []);

  // Check URL for replyTo parameter on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const replyToId = urlParams.get('replyTo');
      if (replyToId) {
        const comment = comments.find(c => c.id === replyToId);
        if (comment) {
          setReplyingTo({ id: comment.id, author_name: comment.author_name, body: comment.body });
          setShowCommentBox(true);
        }
      }
    }
  }, [comments]);

  const handleAttendingChange = async (e) => {
    if (!canRSVP) return;
    const newValue = e.target.checked;
    const previousValue = attending;
    setAttending(newValue); // Optimistic update
    
    try {
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error('Failed to update attendance');
      }
      
      // Refetch attendees list
      const attendeesRes = await fetch(`/api/events/${eventId}/attendees`);
      if (attendeesRes.ok) {
        const attendeesData = await attendeesRes.json();
        setAttendees(attendeesData.attendees || []);
      }
    } catch (error) {
      // Revert on error
      setAttending(previousValue);
      console.error('Failed to update attendance:', error);
    }
  };

  const handleCancelComment = () => {
    setShowCommentBox(false);
    setReplyingTo(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('replyTo');
      window.history.pushState({}, '', url.toString());
    }
  };

  const toggleUser = (userId) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const toggleRole = (role) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) {
        next.delete(role);
      } else {
        next.add(role);
      }
      return next;
    });
  };

  const submitInvites = async () => {
    if (inviteSubmitting) return;
    setInviteSubmitting(true);
    setInviteNotice('');
    try {
      const response = await fetch(`/api/events/${eventId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invite_all: inviteAll,
          role_groups: Array.from(selectedRoles),
          user_ids: Array.from(selectedUsers),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to send invites.');
      }
      setInviteNotice(`Invites sent: ${payload.sent_count || 0}${payload.already_invited_count ? ` (${payload.already_invited_count} already invited)` : ''}.`);
      setSelectedUsers(new Set());
      setSelectedRoles(new Set());
      setInviteAll(false);
    } catch (error) {
      setInviteNotice(error?.message || 'Failed to send invites.');
    } finally {
      setInviteSubmitting(false);
    }
  };
  
  return (
    <section className="card">
      {/* Attendee list */}
      {attendees.length > 0 && (
        <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--muted)' }}>
          <strong style={{ color: 'var(--ink)' }} title={attendeeTitle}>
            {attendees.length} {attendees.length === 1 ? 'person' : 'people'} {attendeeLabel}:
          </strong>{' '}
          {attendees.slice(0, 5).map((a, i) => (
            <span key={a.id}>
              <Username 
                name={a.username} 
                colorIndex={getUsernameColorIndex(a.username, { preferredColorIndex: a.preferred_username_color_index !== null && a.preferred_username_color_index !== undefined ? Number(a.preferred_username_color_index) : null })} 
              />
              {i < Math.min(attendees.length, 5) - 1 ? ', ' : ''}
            </span>
          ))}
          {attendees.length > 5 && <span className="muted"> and {attendees.length - 5} more</span>}
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '12px', flexWrap: 'wrap' }}>
        <h3 className="section-title" style={{ margin: 0 }}>Comments</h3>
        {user ? (
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <input 
              type="checkbox" 
              checked={attending}
              onChange={handleAttendingChange}
              disabled={!canRSVP}
            />
            <span style={{ fontSize: '14px', wordWrap: 'break-word', overflowWrap: 'break-word' }}>I&apos;m attending</span>
          </label>
        ) : null}
      </div>
      {!canRSVP ? (
        <p className="muted" style={{ marginTop: '-6px', marginBottom: '12px', fontSize: '12px' }}>
          RSVP is closed because this event already happened.
        </p>
      ) : null}

      {canInvite ? (
        <div style={{ marginBottom: '14px' }}>
          <button type="button" onClick={() => setShowInvitePanel((v) => !v)}>
            {showInvitePanel ? 'Close invites' : 'Invite people'}
          </button>
          {showInvitePanel ? (
            <div style={{ marginTop: '10px', border: '1px solid var(--line)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <input type="checkbox" checked={inviteAll} onChange={(e) => setInviteAll(e.target.checked)} />
                  <span>Invite all users</span>
                </label>
                {availableRoles.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                    {availableRoles.map((role) => (
                      <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="checkbox"
                          checked={selectedRoles.has(role)}
                          onChange={() => toggleRole(role)}
                        />
                        <span>{role}</span>
                      </label>
                    ))}
                  </div>
                ) : null}
                <label>
                  <div className="muted">Search users</div>
                  <input
                    type="text"
                    value={inviteFilter}
                    onChange={(e) => setInviteFilter(e.target.value)}
                    placeholder="Filter by username"
                  />
                </label>
              </div>
              <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--line)', borderRadius: '8px', padding: '8px' }}>
                {filteredUsers.length === 0 ? (
                  <p className="muted" style={{ margin: 0 }}>No matching users.</p>
                ) : (
                  filteredUsers.map((member) => (
                    <label key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(member.id)}
                        onChange={() => toggleUser(member.id)}
                      />
                      <span>{member.username}</span>
                      <span className="muted" style={{ fontSize: '12px' }}>({member.role})</span>
                      {Number(member.already_invited || 0) === 1 ? (
                        <span className="muted" style={{ fontSize: '11px' }}>invited</span>
                      ) : null}
                    </label>
                  ))
                )}
              </div>
              <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button type="button" onClick={submitInvites} disabled={inviteSubmitting}>
                  {inviteSubmitting ? 'Sending…' : 'Send invites'}
                </button>
                {inviteNotice ? <span className="muted" style={{ fontSize: '12px' }}>{inviteNotice}</span> : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      
      {commentNotice ? <div className="notice">{commentNotice}</div> : null}
      
      {/* Comments list */}
      <div className="list">
        {comments.length === 0 ? (
          <p className="muted">No comments yet.</p>
        ) : (
          comments.map((c) => {
            const preferredColor = c.author_color_preference !== null && c.author_color_preference !== undefined ? Number(c.author_color_preference) : null;
            const colorIndex = usernameColorMap.get(c.author_name) ?? getUsernameColorIndex(c.author_name, { preferredColorIndex: preferredColor });
            const replyLink = `/events/${eventId}?replyTo=${encodeURIComponent(c.id)}#comment-form`;
            return (
              <div key={c.id} className="list-item comment-card" style={{ position: 'relative' }}>
                <div className="reply-top-row">
                  <span className="reply-meta-inline">
                    <Username name={c.author_name} colorIndex={colorIndex} preferredColorIndex={preferredColor} />
                    {' · '}
                    <span suppressHydrationWarning>{formatDateTime(c.created_at)}</span>
                  </span>
                  <div className="reply-actions-inline">
                    <ReplyButton
                      replyId={c.id}
                      replyAuthor={c.author_name}
                      replyHref={replyLink}
                    />
                    <LikeButton postType="event_comment" postId={c.id} initialLiked={!!c.liked} initialCount={c.like_count || 0} size="sm" />
                    <DeleteCommentButton
                      inline
                      commentId={c.id}
                      parentId={eventId}
                      type="event"
                      authorUserId={c.author_user_id}
                      currentUserId={user?.id}
                      isAdmin={!!isAdmin}
                    />
                  </div>
                </div>
                <div className="post-body" dangerouslySetInnerHTML={{ __html: c.body_html || c.body }} />
              </div>
            );
          })
        )}
      </div>
      
      {/* Comment form - hidden until activated */}
      {isLocked ? (
        <p className="muted" style={{ marginTop: '16px' }}>Comments are locked for this event.</p>
      ) : user ? (
        showCommentBox ? (
          <form id="comment-form" action={`/api/events/${eventId}/comments`} method="post" style={{ marginTop: '16px' }}>
            {replyingTo ? (
              <input
                ref={hiddenReplyToRef}
                type="hidden"
                name="reply_to_id"
                value={replyingTo.id || ''}
              />
            ) : null}
            <label>
              <div className="muted">
                {replyingTo ? `Replying to ${replyingTo.author_name}` : 'What would you like to say?'}
              </div>
              <textarea
                ref={textareaRef}
                name="body"
                placeholder={replyingTo ? 'Write your reply…' : 'Drop your thoughts into the goo...'}
                required
              />
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit">Post comment</button>
              <button type="button" onClick={handleCancelComment}>Cancel</button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => setShowCommentBox(true)} style={{ marginTop: '16px' }}>
            Post comment
          </button>
        )
      ) : (
        <p className="muted" style={{ marginTop: '16px' }}>Sign in to comment.</p>
      )}
    </section>
  );
}
