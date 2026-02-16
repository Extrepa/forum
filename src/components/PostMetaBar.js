'use client';

import Username from './Username';
import { formatDateTimeShort } from '../lib/dates';

/**
 * PostMetaBar - Standardized metadata bar for section pages (Latest & More)
 *
 * Layout: Row 1 = title (left) + stats inline on right (e.g. "21 views · 1 reply · 1 like").
 * Row 2 = "by user at time" + (optional) last activity or row2Suffix; on wide viewports (min 640px)
 * stays on one line for a compact two-row layout; wraps when narrow.
 * Uses formatDateTimeShort for compact date/time.
 */
export default function PostMetaBar({
  title,
  author,
  authorColorIndex,
  authorPreferredColorIndex,
  views = 0,
  replies = 0,
  likes = 0,
  createdAt,
  lastActivity,
  lastActivityBy,
  lastActivityByColorIndex,
  lastActivityByPreferredColorIndex,
  className = '',
  titleHref,
  showTitleLink = true,
  hideDateOnDesktop = false,
  authorDateInline = false,
  hideStats = false,
  row2Suffix = null
}) {
  const formatCount = (count) => {
    if (count === 0) return null;
    return count;
  };

  const statLines = [
    formatCount(views) !== null && `${views} ${views === 1 ? 'view' : 'views'}`,
    formatCount(replies) !== null && `${replies} ${replies === 1 ? 'reply' : 'replies'}`,
    formatCount(likes) !== null && `${likes} ${likes === 1 ? 'like' : 'likes'}`
  ].filter(Boolean);

  const hasStats = statLines.length > 0 && !hideStats;
  const hasLastActivity = Boolean(lastActivity && replies > 0);

  const TitleElement = showTitleLink && titleHref ? 'a' : 'span';
  const titleProps = showTitleLink && titleHref ? { href: titleHref } : {};

  const byUserAtTime = (
    <span className="post-meta-by-block muted" style={{ fontSize: '12px' }}>
      by <Username
        name={author}
        colorIndex={authorColorIndex}
        preferredColorIndex={authorPreferredColorIndex}
      />
      {createdAt ? <> at <span className="post-meta-inline-date" style={{ fontSize: '12px' }} suppressHydrationWarning>{formatDateTimeShort(createdAt)}</span></> : null}
    </span>
  );

  const statsInline = hasStats ? (
    <span className="post-meta-stats-inline muted" style={{ fontSize: '12px', whiteSpace: 'nowrap', flexShrink: 0 }}>
      {statLines.join(' \u00B7 ')}
    </span>
  ) : null;

  return (
    <div className={`${className} post-meta`.trim()} style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
      {/* Row 1: Title (left, can wrap) + stats (right, one line) */}
      <div
        className="post-meta-row1 post-meta-title-row"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '8px',
          flexWrap: 'wrap',
          minWidth: 0
        }}
      >
        <TitleElement
          {...titleProps}
          style={{ ...(showTitleLink ? { textDecoration: 'none', color: 'inherit' } : {}), minWidth: 0, flex: '1 1 auto' }}
        >
          <h3 style={{ margin: 0, display: 'inline', fontSize: 'inherit' }}>{title}</h3>
        </TitleElement>
        {statsInline}
      </div>

      {/* Row 2: by user + last activity or row2Suffix; stays on one line when wide */}
      <div className="post-meta-row2 post-meta-by-row">
        {byUserAtTime}
        {hasLastActivity && (
          <>
            <span className="post-meta-row2-sep muted">{' \u00B7 '}</span>
            <span className="post-meta-last-activity muted">
              Last activity{lastActivityBy ? (
                <> by <Username name={lastActivityBy} colorIndex={lastActivityByColorIndex} preferredColorIndex={lastActivityByPreferredColorIndex} /></>
              ) : null} at <span suppressHydrationWarning>{formatDateTimeShort(lastActivity)}</span>
            </span>
          </>
        )}
        {row2Suffix && (
          <>
            <span className="post-meta-row2-sep muted">{' \u00B7 '}</span>
            {row2Suffix}
          </>
        )}
      </div>
    </div>
  );
}
