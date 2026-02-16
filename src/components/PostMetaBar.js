'use client';

import Username from './Username';
import { formatDateTimeShort } from '../lib/dates';

/**
 * PostMetaBar - Standardized metadata bar for section pages (Latest & More)
 *
 * Layout: Row 1 = title (left) + stats inline on right.
 * Row 2 = "by user at time" (left) + last activity (right) when present; single row, wraps on narrow.
 * Pass customRowsAfterTitle to override rows 2+ (e.g. for events).
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
  customRowsAfterTitle = null
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

      {customRowsAfterTitle ?? (
        <>
          {/* Row 2: by user (left) + last activity (right) on same row when room; wraps on narrow */}
          <div className={`post-meta-row2 post-meta-by-row${hasLastActivity ? ' post-meta-row2-with-activity' : ''}`}>
            {byUserAtTime}
            {hasLastActivity && (
              <span className="post-meta-last-activity post-meta-last-activity-inline muted" style={{ fontSize: '12px' }}>
                Last activity{lastActivityBy ? (
                  <> by <Username name={lastActivityBy} colorIndex={lastActivityByColorIndex} preferredColorIndex={lastActivityByPreferredColorIndex} /></>
                ) : null} at <span suppressHydrationWarning>{formatDateTimeShort(lastActivity)}</span>
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
