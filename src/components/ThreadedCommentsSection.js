'use client';

import { useState, useEffect, useRef } from 'react';
import Username from './Username';
import { getUsernameColorIndex } from '../lib/usernameColor';
import { formatDateTime } from '../lib/dates';
import ReplyButton from './ReplyButton';
import DeleteCommentButton from './DeleteCommentButton';
import LikeButton from './LikeButton';

/**
 * Shared threaded comments UI for sections that use post_comments, timeline_comments, or music_comments.
 * Renders comments in a one-level thread (byParent), form with optional reply_to_id and "Replying to X".
 * Props: comments, replyLinkPrefix (e.g. `/lore/${id}`), action, hiddenFields, buttonLabel, placeholder, labelText,
 * likePostType, deleteType, parentId, user, isAdmin, commentNotice, usernameColorMap, isLocked, sectionTitle.
 */
export default function ThreadedCommentsSection({
  comments = [],
  replyLinkPrefix,
  action,
  hiddenFields = {},
  buttonLabel = 'Post comment',
  placeholder = 'Drop your thoughts into the goo...',
  labelText = 'What would you like to say?',
  likePostType,
  deleteType,
  parentId,
  user,
  isAdmin = false,
  commentNotice,
  usernameColorMap = new Map(),
  isLocked = false,
  sectionTitle = 'Comments',
}) {
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const textareaRef = useRef(null);
  const hiddenReplyToRef = useRef(null);

  useEffect(() => {
    const handleReplyToChanged = (event) => {
      const { replyId, replyAuthor } = event.detail;
      setReplyingTo({ id: replyId, author_name: replyAuthor, body: '' });
      if (hiddenReplyToRef.current) hiddenReplyToRef.current.value = replyId;
      if (textareaRef.current) textareaRef.current.value = '';
      setShowCommentBox(true);
    };

    window.addEventListener('replyToChanged', handleReplyToChanged);
    return () => {
      window.removeEventListener('replyToChanged', handleReplyToChanged);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const replyToId = urlParams.get('replyTo');
    if (!replyToId) return;
    const comment = comments.find((c) => c.id === replyToId);
    if (!comment) return;
    setReplyingTo({ id: comment.id, author_name: comment.author_name, body: comment.body || '' });
    setShowCommentBox(true);
  }, [comments]);

  const handleCancelComment = () => {
    setShowCommentBox(false);
    setReplyingTo(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('replyTo');
      window.history.pushState({}, '', url.toString());
    }
  };

  return (
    <section className="card">
      <h3 className="section-title" style={{ marginTop: 0 }}>{sectionTitle}</h3>

      {commentNotice ? <div className="notice">{commentNotice}</div> : null}

      <div className="list">
        {comments.length === 0 ? (
          <p className="muted">No comments yet.</p>
        ) : (
          (() => {
            const byParent = new Map();
            const validReplyIds = new Set(comments.map((c) => c.id).filter(Boolean));
            for (const c of comments) {
              if (!c || !c.id) continue;
              const key = (c.reply_to_id && validReplyIds.has(c.reply_to_id)) ? c.reply_to_id : null;
              const arr = byParent.get(key) || [];
              arr.push(c);
              byParent.set(key, arr);
            }
            const renderComment = (c, { isChild }) => {
              const preferredColor = c.author_color_preference !== null && c.author_color_preference !== undefined ? Number(c.author_color_preference) : null;
              const colorIndex = usernameColorMap.get(c.author_name) ?? getUsernameColorIndex(c.author_name, { preferredColorIndex: preferredColor });
              const replyLink = `${replyLinkPrefix}?replyTo=${encodeURIComponent(c.id)}#comment-form`;
              return (
                <div key={c.id} className={`list-item comment-card${isChild ? ' reply-item--child' : ''}`} style={{ position: 'relative' }}>
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
                      <LikeButton postType={likePostType} postId={c.id} initialLiked={!!c.liked} initialCount={c.like_count || 0} size="sm" />
                      <DeleteCommentButton
                        inline
                        commentId={c.id}
                        parentId={parentId}
                        type={deleteType}
                        authorUserId={c.author_user_id}
                        currentUserId={user?.id}
                        isAdmin={!!isAdmin}
                      />
                    </div>
                  </div>
                  <div className="post-body" dangerouslySetInnerHTML={{ __html: c.body_html || c.body || '' }} />
                </div>
              );
            };
            const top = byParent.get(null) || [];
            return top.map((c) => {
              const kids = byParent.get(c.id) || [];
              const renderedKids = kids.map((child) => renderComment(child, { isChild: true }));
              return (
                <div key={`thread-${c.id}`} className="stack" style={{ gap: 10 }}>
                  {renderComment(c, { isChild: false })}
                  {renderedKids.length ? <div className="reply-children">{renderedKids}</div> : null}
                </div>
              );
            });
          })()
        )}
      </div>

      {isLocked ? (
        <p className="muted" style={{ marginTop: '12px' }}>Comments are locked.</p>
      ) : user ? (
        showCommentBox ? (
          <form id="comment-form" action={action} method="post" style={{ marginTop: '12px' }}>
            {Object.entries(hiddenFields).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value ?? ''} />
            ))}
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
                {replyingTo ? `Replying to ${replyingTo.author_name}` : labelText}
              </div>
              <textarea
                ref={textareaRef}
                name="body"
                placeholder={replyingTo ? 'Write your reply…' : placeholder}
                required
              />
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit">{buttonLabel}</button>
              <button type="button" onClick={handleCancelComment}>Cancel</button>
            </div>
          </form>
        ) : (
          <button id="comment-form" type="button" onClick={() => setShowCommentBox(true)} style={{ marginTop: '12px' }}>
            {buttonLabel}
          </button>
        )
      ) : (
        <p className="muted" style={{ marginTop: '12px' }}>Sign in to comment.</p>
      )}
    </section>
  );
}
