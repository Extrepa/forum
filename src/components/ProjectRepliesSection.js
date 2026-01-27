'use client';

import { useState, useEffect } from 'react';
import Username from './Username';
import { getUsernameColorIndex } from '../lib/usernameColor';
import { formatDateTime } from '../lib/dates';
import ReplyButton from './ReplyButton';
import ReplyFormWrapper from './ReplyFormWrapper';
import DeleteCommentButton from './DeleteCommentButton';

export default function ProjectRepliesSection({
  projectId,
  replies,
  user,
  isAdmin = false,
  commentNotice,
  usernameColorMap = new Map(),
  isLocked = false,
  repliesEnabled = true
}) {
  // Log error notice for debugging
  useEffect(() => {
    if (commentNotice) {
      console.error('Project reply error:', commentNotice);
    }
  }, [commentNotice]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyPrefill, setReplyPrefill] = useState('');
  
  // Listen for dynamic reply changes from ReplyButton clicks
  useEffect(() => {
    const handleReplyToChanged = (event) => {
      const { replyId, replyAuthor, replyBody } = event.detail;
      
      setReplyingTo({ id: replyId, author_name: replyAuthor, body: replyBody });
      const quoteText = `> @${replyAuthor} said:\n${replyBody.split('\n').slice(0, 8).map(l => `> ${l}`).join('\n')}\n\n`;
      setReplyPrefill(quoteText);
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
        const reply = replies.find(r => r.id === replyToId);
        if (reply) {
          setReplyingTo({ id: reply.id, author_name: reply.author_name, body: reply.body });
          const quoteText = `> @${reply.author_name} said:\n${reply.body.split('\n').slice(0, 8).map(l => `> ${l}`).join('\n')}\n\n`;
          setReplyPrefill(quoteText);
        }
      }
    }
  }, [replies]);

  // Render replies with threading
  const renderReplies = () => {
    if (!replies || replies.length === 0) return [];

    const byParent = new Map();
    const validReplyIds = new Set(replies.map(r => r.id).filter(Boolean));

    for (const r of replies) {
      if (!r || !r.id) continue;
      const key = (r.reply_to_id && validReplyIds.has(r.reply_to_id)) ? r.reply_to_id : null;
      const arr = byParent.get(key) || [];
      arr.push(r);
      byParent.set(key, arr);
    }

    const renderReply = (r, { isChild }) => {
      if (!r || !r.id || !r.body) return null;
      const preferredColor = r.author_color_preference !== null && r.author_color_preference !== undefined ? Number(r.author_color_preference) : null;
      const colorIndex = usernameColorMap.get(r.author_name) ?? getUsernameColorIndex(r.author_name || 'Unknown', { preferredColorIndex: preferredColor });

      const replyLink = `/projects/${projectId}?replyTo=${encodeURIComponent(r.id)}#reply-form`;

      return (
        <div
          key={r.id}
          className={`list-item${isChild ? ' reply-item--child' : ''}`}
          id={`reply-${r.id}`}
          style={{ position: 'relative' }}
        >
          <DeleteCommentButton
            commentId={r.id}
            parentId={projectId}
            type="project"
            authorUserId={r.author_user_id}
            currentUserId={user?.id}
            isAdmin={!!isAdmin}
          />
          <div className="post-body" dangerouslySetInnerHTML={{ __html: r.body_html || r.body }} />
          {r.image_key && (
            <div style={{ marginTop: '12px' }}>
              <img
                src={`/api/media/${r.image_key}`}
                alt="Reply attachment"
                style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }}
              />
            </div>
          )}
          <div
            className="list-meta"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: '8px', fontSize: '12px' }}
          >
            <span>
              <Username name={r.author_name} colorIndex={colorIndex} preferredColorIndex={preferredColor} />
              {' · '}
              {r.created_at ? <span suppressHydrationWarning>{formatDateTime(r.created_at)}</span> : ''}
            </span>
            <ReplyButton
              replyId={r.id}
              replyAuthor={r.author_name}
              replyBody={r.body}
              replyHref={replyLink}
            />
          </div>
        </div>
      );
    };

    const top = byParent.get(null) || [];
    return top.map((r) => {
      const kids = byParent.get(r.id) || [];
      const renderedReply = renderReply(r, { isChild: false });
      const renderedKids = kids.map((c) => renderReply(c, { isChild: true })).filter(Boolean);
      if (!renderedReply) return null;
      return (
        <div key={`thread-${r.id}`} className="stack" style={{ gap: 10 }}>
          {renderedReply}
          {renderedKids.length ? (
            <div className="reply-children">
              {renderedKids}
            </div>
          ) : null}
        </div>
      );
    }).filter(Boolean);
  };

  const renderedReplies = renderReplies();
  const replyToId = replyingTo ? replyingTo.id : null;

  return (
    <section className="card">
      <h3 className="section-title">Replies</h3>
      {commentNotice ? <div className="notice">{commentNotice}</div> : null}
      <div className="list">
        {renderedReplies.length === 0 ? (
          <p className="muted">No replies yet.</p>
        ) : (
          renderedReplies
        )}
      </div>
      {isLocked ? (
        <p className="muted" style={{ marginTop: '12px' }}>Comments are locked for this project.</p>
      ) : repliesEnabled ? (
        user ? (
          <div style={{ marginTop: '12px' }} id="reply-form">
            <ReplyFormWrapper
              action={`/api/projects/${projectId}/replies`}
              buttonLabel="Post reply"
              placeholder="Share your drip-certified thoughts..."
              labelText="What would you like to say?"
              hiddenFields={{ reply_to_id: replyToId || '' }}
              replyingTo={replyingTo}
              replyPrefill={replyPrefill}
              allowImageUpload={true}
            />
          </div>
        ) : (
          <p className="muted" style={{ marginTop: '12px' }}>Sign in to reply.</p>
        )
      ) : (
        <div className="muted" style={{ fontSize: 13, marginTop: '12px' }}>
          Replies aren't enabled yet (database updates still applying).
        </div>
      )}
    </section>
  );
}
