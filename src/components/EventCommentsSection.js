'use client';

import { useState } from 'react';
import Username from './Username';
import { getUsernameColorIndex } from '../lib/usernameColor';

export default function EventCommentsSection({ 
  eventId, 
  initialAttending, 
  initialAttendees, 
  comments, 
  user, 
  commentNotice,
  usernameColorMap = new Map()
}) {
  const [attending, setAttending] = useState(initialAttending);
  const [attendees, setAttendees] = useState(initialAttendees);
  const [showCommentBox, setShowCommentBox] = useState(false);
  
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
              <Username name={a.username} colorIndex={getUsernameColorIndex(a.username)} />
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
            <span style={{ fontSize: '14px', wordWrap: 'break-word', overflowWrap: 'break-word' }}>I'm attending</span>
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
            const colorIndex = usernameColorMap.get(c.author_name) ?? getUsernameColorIndex(c.author_name);
            return (
              <div key={c.id} className="list-item">
                <div className="post-body" dangerouslySetInnerHTML={{ __html: c.body_html || c.body }} />
                <div
                  className="list-meta"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>
                    <Username name={c.author_name} colorIndex={colorIndex} />
                  </span>
                  <span>{new Date(c.created_at).toLocaleString()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Comment form - hidden until activated */}
      {user ? (
        showCommentBox ? (
          <form id="event-comment-form" action={`/api/events/${eventId}/comments`} method="post">
            <label>
              <div className="muted">What would you like to say?</div>
              <textarea name="body" placeholder="Drop your thoughts into the goo..." required />
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit">Post comment</button>
              <button type="button" onClick={() => setShowCommentBox(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => setShowCommentBox(true)}>
            Post comment
          </button>
        )
      ) : (
        <p className="muted">Sign in to comment.</p>
      )}
    </section>
  );
}
