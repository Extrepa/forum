'use client';

import Username from './Username';
import { formatDateTimeShort } from '../lib/dates';

/**
 * PostMetaBar - Standardized metadata bar for section pages (Latest & More)
 *
 * DOM order: Row 1 = title; Row 2 = by user or custom (e.g. events); Row 3 = stats; Row 4 = last activity.
 * Wide: 2 rows (title+stats, by+last activity or event details+last activity).
 * Condensed: 3–4 stacked rows as needed, rows 3–4 right-aligned.
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

  const lastActivityEl = hasLastActivity && (
    <span className="post-meta-last-activity post-meta-last-activity-inline muted" style={{ fontSize: '12px' }}>
      Last activity{lastActivityBy ? (
        <> by <Username name={lastActivityBy} colorIndex={lastActivityByColorIndex} preferredColorIndex={lastActivityByPreferredColorIndex} /></>
      ) : null} at <span suppressHydrationWarning>{formatDateTimeShort(lastActivity)}</span>
    </span>
  );

  const hasCustomRow2 = customRowsAfterTitle != null;
  const row2Content = hasCustomRow2 ? customRowsAfterTitle : byUserAtTime;

  return (
    <div className={`${className} post-meta`.trim()}>
      {/* Row 1: Title only (truncates when long). Stats appear in row 3; CSS places them on same line as title on wide. */}
      <div className="post-meta-row1 post-meta-title-row">
        <TitleElement
          {...titleProps}
          className="post-meta-title-link"
          style={showTitleLink ? { textDecoration: 'none', color: 'inherit' } : undefined}
        >
          <h3 style={{ margin: 0, display: 'inline', fontSize: 'inherit' }}>{title}</h3>
        </TitleElement>
      </div>

      {/* Row 2: by user only, or custom (e.g. events: by + event info). */}
      <div className="post-meta-row2 post-meta-by-row">
        {row2Content}
      </div>

      {/* Row 3: Stats (views, replies, likes). Condensed: own row, right-aligned. Wide: CSS places next to title. */}
      {hasStats && statsInline && (
        <div className="post-meta-row3 post-meta-stats-row">
          {statsInline}
        </div>
      )}

      {/* Row 4: Last activity. Condensed: own row, right-aligned. Wide: CSS places next to by-line. */}
      {hasLastActivity && (
        <div className="post-meta-row4 post-meta-last-activity-row">
          {lastActivityEl}
        </div>
      )}
    </div>
  );
}
