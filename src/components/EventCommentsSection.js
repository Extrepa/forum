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
  isLocked = false
}) {
  const [attending, setAttending] = useState(initialAttending);
  const [attendees, setAttendees] = useState(initialAttendees);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyPrefill, setReplyPrefill] = useState('');
  const textareaRef = useRef(null);
  const hiddenReplyToRef = useRef(null);
  
  // Listen for dynamic reply changes from ReplyButton clicks
  useEffect(() => {
    const handleReplyToChanged = (event) => {
      const { replyId, replyAuthor, replyBody } = event.detail;
      
      setReplyingTo({ id: replyId, author_name: replyAuthor, body: replyBody });
      const quoteText = `> @${replyAuthor} said:\n${replyBody.split('\n').slice(0, 8).map(l => `> ${l}`).join('\n')}\n\n`;
      setReplyPrefill(quoteText);
      
      if (hiddenReplyToRef.current) {
        hiddenReplyToRef.current.value = replyId;
      }
      if (textareaRef.current) {
        textareaRef.current.value = quoteText;
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
          const quoteText = `> @${comment.author_name} said:\n${comment.body.split('\n').slice(0, 8).map(l => `> ${l}`).join('\n')}\n\n`;
          setReplyPrefill(quoteText);
          setShowCommentBox(true);
        }
      }
    }
  }, [comments]);

  const handleAttendingChange = async (e) => {
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
    setReplyPrefill('');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('replyTo');
      window.history.pushState({}, '', url.toString());
    }
  };
  
  return (
    <section className="card">
      {/* Attendee list */}
      {attendees.length > 0 && (
        <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--muted)' }}>
          <strong style={{ color: 'var(--ink)' }}>
            {attendees.length} {attendees.length === 1 ? 'person' : 'people'} attending:
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
            />
            <span style={{ fontSize: '14px', wordWrap: 'break-word', overflowWrap: 'break-word' }}>I&apos;m attending</span>
          </label>
        ) : null}
      </div>
      
      {commentNotice ? <div className="notice">{commentNotice}</div> : null}
      
      {/* Comments list */}
      <div className="list">
        {comments.length === 0 ? (
          <p className="muted">No comments yet.</p>
        ) : (
          comments.map((c) => {
            const preferredColor = c.author_color_preference !== null && c.author_color_preference !== undefined ? Number(c.author_color_preference) : null;
            const colorIndex = usernameColorMap.get(c.author_name) ?? getUsernameColorIndex(c.author_name, { preferredColorIndex: preferredColor });
            return (
              <div key={c.id} className="list-item comment-card" style={{ position: 'relative' }}>
                <div className="comment-action-row">
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
                <div className="post-body" dangerouslySetInnerHTML={{ __html: c.body_html || c.body }} />
                <div
                  className="list-meta"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}
                >
                  <span>
                    <Username name={c.author_name} colorIndex={colorIndex} preferredColorIndex={preferredColor} />
                    {' · '}
                    <span suppressHydrationWarning>{formatDateTime(c.created_at)}</span>
                  </span>
                  <ReplyButton
                    replyId={c.id}
                    replyAuthor={c.author_name}
                    replyBody={c.body}
                    replyHref={`/events/${eventId}?replyTo=${encodeURIComponent(c.id)}#comment-form`}
                  />
                </div>
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
                defaultValue={replyPrefill}
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
