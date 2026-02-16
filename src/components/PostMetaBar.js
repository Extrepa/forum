'use client';

import Username from './Username';
import { formatDateTime } from '../lib/dates';

/**
 * PostMetaBar - Standardized metadata bar for section pages (Latest & More)
 *
 * Layout (all viewports):
 * Row 1: Title only (wraps cleanly).
 * Row 2: "by username at time" as one block (never splits); stats column on right when no row 3.
 * Row 3 (when last activity): Last activity (left), stats column (right, stacked).
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
  hideStats = false
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
  const isCondensed = replies === 0;
  const hasLastActivity = Boolean(lastActivity && replies > 0);

  const TitleElement = showTitleLink && titleHref ? 'a' : 'span';
  const titleProps = showTitleLink && titleHref ? { href: titleHref } : {};

  const byUserAtTime = (
    <span className="post-meta-by-block muted" style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>
      by <Username
        name={author}
        colorIndex={authorColorIndex}
        preferredColorIndex={authorPreferredColorIndex}
      />
      {createdAt ? <> at <span className="post-meta-inline-date" style={{ fontSize: '12px' }} suppressHydrationWarning>{formatDateTime(createdAt)}</span></> : null}
    </span>
  );

  const statsColumn = hasStats && (
    <div className="post-meta-stats-column muted" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '12px', flexShrink: 0 }}>
      {statLines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </div>
  );

  return (
    <div className={`${className} post-meta ${isCondensed ? 'post-meta--condensed' : ''}`.trim()} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {/* Row 1: Title only so it wraps cleanly */}
      <div className="post-meta-row1 post-meta-title-row" style={{ minWidth: 0 }}>
        <TitleElement
          {...titleProps}
          style={showTitleLink ? { textDecoration: 'none', color: 'inherit' } : {}}
        >
          <h3 style={{ margin: 0, display: 'inline' }}>{title}</h3>
        </TitleElement>
      </div>

      {/* Row 2: "by user at time" (one block) + stats column when no last activity */}
      <div
        className="post-meta-row2 post-meta-by-row"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          rowGap: '4px',
          minWidth: 0
        }}
      >
        <div style={{ minWidth: 0 }}>{byUserAtTime}</div>
        {!hasLastActivity && statsColumn}
      </div>

      {/* Row 3: Last activity (left), Stats column (right) */}
      {hasLastActivity && (
        <div
          className="post-meta-row3"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '8px',
            flexWrap: 'wrap',
            rowGap: '4px',
            fontSize: '12px',
            minWidth: 0
          }}
        >
          <div style={{ flex: '1 1 auto', minWidth: 0 }}>
            <span className="post-meta-last-activity muted" style={{ display: 'block' }}>
              Last activity{lastActivityBy ? (
                <> by <Username name={lastActivityBy} colorIndex={lastActivityByColorIndex} preferredColorIndex={lastActivityByPreferredColorIndex} /></>
              ) : null} at <span suppressHydrationWarning>{formatDateTime(lastActivity)}</span>
            </span>
          </div>
          {hasLastActivity && statsColumn}
        </div>
      )}
    </div>
  );
}
